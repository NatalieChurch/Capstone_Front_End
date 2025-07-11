import { useState, useEffect , Suspense } from "react";
import { getToken, clearToken } from "./Auth";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useGLTF } from "@react-three/drei";
import Dealer from "./Dealer";

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
  const [handTypes, setHandTypes] = useState([])
  const [strategy, setStrategy] = useState(null)
  const [doubleDownUsed, setDoubleDownUsed] = useState(false);

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
    setDoubleDownUsed(false)
  };

  const currentHand = () => playerHands[activeHandIdx] || [];

  const canSplit = () =>
    currentHand().length === 2 &&
    sameRank(currentHand()[0].rank, currentHand()[1].rank) &&
    playerHands.length === 1;

  function getHandType(hand) {
      if (hand.length === 2 && sameRank(hand[0].rank, hand[1].rank)) {
      return "pair";
      } else {
      const ranks = hand.map((card) => card.rank);
      return ranks.includes("A") ? "soft" : "hard";
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
          setHandTypes([getHandType(newPlayerHand)])

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
    setDoubleDownUsed(true)
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
            setHandTypes([getHandType(newHand)]); 
            return newHand;
          }
          return h;
        })
      );

      const newHands = playerHands.map((h, i) => {
  if (i === activeHandIdx) {
    return [...h, card];
  }
  return h;
  });

  setPlayerHands(newHands);
  setHandTypes(newHands.map(getHandType));

  const newTotal = total(newHands[activeHandIdx]);
  if (newTotal > 21) {
  const allBusted = newHands.every((hand) => total(hand) > 21);

  if (allBusted) {
    setRevealDealerHole(true);
    const dealerTotal = total(dealerHand);
    const results = newHands.map(() => "You Lose");
    setMessage(`Dealer stands on ${dealerTotal} | ${results.join(" | ")}`);
    setGameStarted(false);
  } else {
    setMessage((m) => `${m} Bust. `);
    setActiveHandIdx((idx) => idx + 1);
  }
  }
    } catch (err) {
      setMessage(err.message);
    }
};
  
  const stand = () => nextHand();

  function doubleDown(){
    hit()
    nextHand()
  }

  const nextHand = () => {
    const allHandsPlayed = activeHandIdx >= playerHands.length - 1;
    const allBusted = playerHands.every((hand) => total(hand) > 21);

    if (!allHandsPlayed) {
      setActiveHandIdx(activeHandIdx + 1);
      setStrategy(null);
    } else if (allBusted) {
      setRevealDealerHole(true);
      const dealerTotal = total(dealerHand);
      const results = playerHands.map(() => "You Lose");
      setMessage(`Dealer stands on ${dealerTotal} | ${results.join(" | ")}`);
      setGameStarted(false);
    } else {
      finishDealerPlay();
  }
};

  const finishDealerPlay = async () => {
    try {
      setRevealDealerHole(true);
      let dealer = [...dealerHand];

      const isSoft17 = (hand) => {
      const totalVal = total(hand);
      const hasAce = hand.some((card) => isAce(card.rank))
      let sum = hand.reduce((s, c) => s + c.card_value, 0)
      return totalVal === 17 && hasAce && sum !== 17
    };

      while (total(dealer) < 17 || isSoft17(dealer)) {
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

    const newHands = [
      [first, extra1],
      [second, extra2],
    ];
    setPlayerHands(newHands);

    const newHandTypes = newHands.map(getHandType);
    setHandTypes(newHandTypes);

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
            setHandTypes([getHandType(newPlayerHand)])

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


async function getStrategy(hand) {
  const handTotal = total(hand);
  
  if (getHandType(hand) === "hard" && handTotal <= 7) {
    setStrategy("H");
    return;
  }

  const dealerUpcard = dealerHand[1];
  const upcardRank = ["J", "Q", "K"].includes(dealerUpcard.rank) ? "10" : dealerUpcard.rank;
  const handType = getHandType(hand);

  const response = await fetchJson(`${API}/strategy`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ 
      players_hand: String(handTotal),
      dealers_upcard: upcardRank,
      hand_type: handType
    })
  });

  const strategy = response[0].recc_action;
  setStrategy(strategy);
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
      <div className="game_container">
        <section className='dealer_section'>
          <h3>Dealer</h3>
          <div className='card_container'>
            {dealerHand.map((c, i) => (
              <div key={i} className="card">
                {i === 0 && !revealDealerHole
                  ? "🂠"
                  : `${cleanRank(c.rank)} of ${c.suit}`}
              </div>
            ))}
          </div>
          {revealDealerHole && dealerHand.length > 0 && (
            <p>Total: {total(dealerHand)}</p>
          )}
        </section>

        <section className="player_section">
          <h3>You</h3>
          {playerHands.map((hand, idx) => (
            <div  key={idx} >
              <strong>
                Hand {idx + 1}
                {idx === activeHandIdx && gameStarted && " (active)"}
              </strong>
              <div className='card_container'>
                {hand.map((c, i) => (
                  <div className="card" key={i}>
                    {cleanRank(c.rank)} of {c.suit}
                  </div>
                ))}
              </div>
              
              <p>Total: {total(hand)}</p>

                <div className="strategy">
                  <button id="strategy_button" onClick={()=>getStrategy(hand)}>Get Strategy</button>
                  {strategy && idx === activeHandIdx && (
                    <p><strong>Recommended Action:</strong> {STRATEGY_MAP[strategy]}</p>
                  )}
                </div>

            </div>

          ))}
        </section>

            </div>
              

        {gameStarted && (
          <div className="controls" style={{ gap: "0.5rem" }}>
            <button onClick={hit}>Hit</button>
            <button onClick={stand}>Stand</button>
            {!doubleDownUsed && (
              <button onClick={doubleDown}>Double Down</button>
                )}
            {canSplit() && (
              <button onClick={split}>
                 Split
              </button>
            )}
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

      {/* === Dealer 3D Model Canvas === */}
    
        <div
          style={{
            position: "relative",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
            zIndex: 10000,
          }}
        >
          <Canvas camera={{ position: [0, 2, 5], fov: 25 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <Suspense fallback = {null}>
            <Dealer animationName="Idle" />
            </Suspense>
            <OrbitControls enableZoom = {true} enableRotate = {true} enablePan = {true} target={[-5, 1, 80]} />
          </Canvas>

        </div>
  </main>
);
}