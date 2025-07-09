import { useState, useEffect } from "react";
import { getToken, clearToken } from "./Auth";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:3000";

/* ─── helpers ────────────────────────────────────────────────────────────── */
const cleanRank = (rank) => rank.split(":")[0];
const isAce = (rank) => cleanRank(rank) === "A";
const sameRank = (r1, r2) => cleanRank(r1) === cleanRank(r2);
const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});
const STRATEGY_MAP = {
  H: "Hit",
  S: "Stand",
  D: "Double Down Baby",
  P: "Split",
};

export default function Game() {
  const navigate = useNavigate();
  const [token] = useState(getToken());
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playerHands, setPlayerHands] = useState([]);
  const [activeHandIdx, setActiveHandIdx] = useState(0);
  const [dealerHand, setDealerHand] = useState([]);
  const [message, setMessage] = useState("");
  const [revealDealerHole, setRevealDealerHole] = useState(false);
  const [gameNeedsReset, setGameNeedsReset] = useState(false);
  const [handType, setHandType] = useState(null)
  const [strategy, setStrategy] = useState(null)

  const total = (hand) => {
    let sum = hand.reduce((s, c) => s + c.card_value, 0);
    let aces = hand.filter((c) => isAce(c.rank)).length;
    while (sum > 21 && aces) {
      sum -= 10;
      aces -= 1;
    }
    return sum;
  };

  const fetchJson = async (url, opts = {}) => {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.status === 204 ? {} : await res.json();
  };

  const resetTable = () => {
    setPlayerHands([]);
    setDealerHand([]);
    setActiveHandIdx(0);
    setMessage("");
    setRevealDealerHole(false);
    setStrategy(null)
  };

  const currentHand = () => playerHands[activeHandIdx] || [];

  const canSplit = () =>
    currentHand().length === 2 &&
    sameRank(currentHand()[0].rank, currentHand()[1].rank) &&
    playerHands.length === 1;
  
  function updateHandType(hand) {
    if (hand.length === 2 && sameRank(hand[0].rank, hand[1].rank)) {
      setHandType("pair");
    } else {
      const ranks = hand.map(card => card.rank);
      if (ranks.includes("A")) {
        setHandType("soft");
      } else {
        setHandType("hard");
      }
    }
    }
  
  async function checkShoe(){
    const shoe = await fetchJson(`${API}/shoe`)
    console.log(shoe)
    return shoe
  }

async function startGame() {
  setLoading(true);
  resetTable();

  try {
    const shoe = await checkShoe();
    if (shoe.length < 10) {
      await fetchJson(`${API}/shoe`, { method: "POST" });
      setGameNeedsReset(false);
    }

    const updatedShoe = await checkShoe();
    if (updatedShoe.length < 10) {
      setGameNeedsReset(true);
      setLoading(false);
      return;
    }

    setTimeout(async () => {
      const p1 = await fetchJson(`${API}/hand/player`, {
        method: "POST",
        headers: authHeaders(token),
      });
      setPlayerHands([[p1]]);

      setTimeout(async () => {
        const d1 = await fetchJson(`${API}/hand/dealer`, {
          method: "POST",
          headers: authHeaders(token),
        });
        setDealerHand([d1]);

        setTimeout(async () => {
          const p2 = await fetchJson(`${API}/hand/player`, {
            method: "POST",
            headers: authHeaders(token),
          });
          
          const newPlayerHand = [p1, p2];
          setPlayerHands([newPlayerHand]);
          updateHandType(newPlayerHand)

          setTimeout(async () => {
            const d2 = await fetchJson(`${API}/hand/dealer`, {
              method: "POST",
              headers: authHeaders(token),
            });
            setDealerHand((prev) => [...prev, d2]);

            setGameStarted(true);
            setLoading(false);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  } catch (err) {
    setMessage(`Couldn't start game: ${err.message}`);
    setLoading(false);
  }
}

  const hit = async () => {
    setStrategy(null)
    try {
      const handNum = activeHandIdx + 1;
      const card = await fetchJson(`${API}/hand/player?hand=${handNum}`, {
        method: "POST",
        headers: authHeaders(token),
      });

  setPlayerHands((hands) =>
        hands.map((h, i) => {
          if (i === activeHandIdx) {
            const newHand = [...h, card];
            updateHandType(newHand); 
            return newHand;
          }
          return h;
        })
      );

      if (total([...currentHand(), card]) > 21) {
        setMessage((m) => `${m} Bust. `);
        nextHand();
      }
    } catch (err) {
      setMessage(err.message);
    }
  };
  
  const stand = () => nextHand();

  const nextHand = () => {
    if (activeHandIdx < playerHands.length - 1) {
      setActiveHandIdx(activeHandIdx + 1);
    } else {
      finishDealerPlay();
    }
  };

  const finishDealerPlay = async () => {
    try {
      setRevealDealerHole(true);
      let dealer = [...dealerHand];
      while (total(dealer) < 17) {
        const card = await fetchJson(`${API}/hand/dealer`, {
          method: "POST",
          headers: authHeaders(token),
        });
        dealer.push(card);
      }
      setDealerHand(dealer);

      const dealerTotal = total(dealer);

      const dealerResult =
        dealerTotal > 21 ? "Dealer busts" : `Dealer stands on ${dealerTotal}`;

      const results = playerHands.map((hand) => {
        const t = total(hand);
        return t > 21
          ? "You Lose"
          : dealerTotal > 21 || t > dealerTotal
          ? "You Win"
          : dealerTotal === t
          ? "You Push"
          : "You Lose";
      });

      setMessage(`${dealerResult} | ${results.join(" | ")}`);
      setGameStarted(false);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const split = async () => {
    if (!canSplit()) return;
    const [first, second] = currentHand();
    try {
      const extra1 = await fetchJson(`${API}/hand/player?hand=1`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const extra2 = await fetchJson(`${API}/hand/player?hand=2`, {
        method: "POST",
        headers: authHeaders(token),
      });
      setPlayerHands([
        [first, extra1],
        [second, extra2],
      ]);
      setActiveHandIdx(0);
    } catch (err) {
      setMessage(err.message);
    }
  };



async function newHand(){
    setLoading(true);
    resetTable();

    const shoe = await checkShoe();
    if (shoe.length < 10) {
      setGameNeedsReset(true);
      setLoading(false);
      return
    }

    setTimeout(async () => {
      try {
        const p1 = await fetchJson(`${API}/hand/player`, {
          method: "POST",
          headers: authHeaders(token),
        });
        setPlayerHands([[p1]]);

        setTimeout(async () => {
          const d1 = await fetchJson(`${API}/hand/dealer`, {
            method: "POST",
            headers: authHeaders(token),
          });
          setDealerHand([d1]);

          setTimeout(async () => {
            const p2 = await fetchJson(`${API}/hand/player`, {
              method: "POST",
              headers: authHeaders(token),
            });

            const newPlayerHand = [p1, p2];
            setPlayerHands([newPlayerHand]);
            updateHandType(newPlayerHand)

            setTimeout(async () => {
              const d2 = await fetchJson(`${API}/hand/dealer`, {
                method: "POST",
                headers: authHeaders(token),
              });
              setDealerHand((prev) => [...prev, d2]);

              setGameStarted(true);
              setLoading(false);
            }, 1000);
          }, 1000);
        }, 1000);
      } catch (err) {
        setMessage(`Couldn't start new hand: ${err.message}`);
        setLoading(false);
      }
    }, 1000);
  };


    async function getStrategy(hand){
        const handTotal = String(total(hand))
        const dealerUpcard = dealerHand[1]

        const response = await fetchJson(`${API}/strategy`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ 
          players_hand : handTotal,
          dealers_upcard : ["J", "Q", "K"].includes(dealerUpcard.rank) ? "10" : dealerUpcard.rank,
          hand_type : handType
        })
      });
      const strategy = response[0].recc_action
      setStrategy(strategy)
    }



  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  if (!token) return null;

  return (
  <main>
    <h2>Blackjack!</h2>

    {gameNeedsReset ? (
      <div>
        <p>Deck is low, please start a new game</p>
        <button onClick={startGame}>Start New Game</button>
      </div>
    ) : !gameStarted && playerHands.length === 0 ? (
      <button disabled={loading} onClick={startGame}>
        {loading ? "Starting…" : "Start"}
      </button>
    ) : (
      <>
        <section>
          <h3>Dealer</h3>
          <ul>
            {dealerHand.map((c, i) => (
              <li key={i}>
                {i === 0 && !revealDealerHole
                  ? "🂠"
                  : `${cleanRank(c.rank)} of ${c.suit}`}
              </li>
            ))}
          </ul>
          {revealDealerHole && dealerHand.length > 0 && (
            <p>Total: {total(dealerHand)}</p>
          )}
        </section>

        <section>
          <h3>You</h3>
          {playerHands.map((hand, idx) => (
            <div key={idx} style={{ marginBottom: "1rem" }}>
              <strong>
                Hand {idx + 1}
                {idx === activeHandIdx && gameStarted && " (active)"}
              </strong>
              <ul>
                {hand.map((c, i) => (
                  <li key={i}>
                    {cleanRank(c.rank)} of {c.suit}
                  </li>
                ))}
              </ul>
              
              <p>Total: {total(hand)}</p>
              <button onClick={()=>getStrategy(hand)}>Get Strategy</button>
              
                {strategy && idx === activeHandIdx && (
                    <p><strong>Recommended Action:</strong> {STRATEGY_MAP[strategy]}</p>
                )}

            </div>
          ))}
        </section>

        {gameStarted && (
          <div className="controls" style={{ gap: "0.5rem" }}>
            <button onClick={hit}>Hit</button>
            <button onClick={stand}>Stand</button>
            <button onClick={split} disabled={!canSplit()}>
              Split
            </button>
          </div>
        )}

        {!gameStarted && playerHands.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            {message && <p>{message}</p>}
            <button onClick={newHand}>Play Another Hand</button>
          </div>
        )}
      </>
    )}

    <button
      onClick={() => {
        clearToken(() => {});
        navigate("/login");
      }}
      style={{ marginTop: "2rem" }}
    >
      Log out
    </button>
  </main>
);
}