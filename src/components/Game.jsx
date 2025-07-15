import { useState, useEffect} from "react";
import { getToken, clearToken } from "./Auth";
import { useNavigate } from "react-router-dom";
import DealerScene from "./DealerScene";

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
  H: "hit",
  S: "stand",
  D: "double down baby",
  P: "split",
};

const suitSymbol = {
  hearts: "♥",
  diamonds: "♦",
  spades: "♠",
  clubs: "♣",
};

const cardColor = (suit) => {
  switch (suit.toLowerCase()) {
    case "hearts":
    case "diamonds":
      return "redcard";
    case "spades":
    case "clubs":
      return "blackcard";
    default:
      return "";
  }
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
  const [doubleDownUsed, setDoubleDownUsed] = useState([]);
  const [gameOver, setGameOver] = useState(false);

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
    setDoubleDownUsed([])
    setGameOver(false)
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
  setGameOver(false);

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
          setDoubleDownUsed([false]);
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
    setDoubleDownUsed((prev) =>
      prev.map((used, i) => (i === activeHandIdx ? true : used))
      );
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
    setGameOver(true);
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
  setDoubleDownUsed((prev) =>
    prev.map((used, i) => (i === activeHandIdx ? true : used))
    );
      hit();
      nextHand();
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
      const hasAce = hand.some((card) => isAce(card.rank));
      let sum = hand.reduce((s, c) => s + c.card_value, 0);
      return totalVal === 17 && hasAce && sum !== 17;
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

    const results = await Promise.all(
      playerHands.map(async (hand) => {
        const t = total(hand);
        let outcome;

        if (t > 21) {
          outcome = "You Lose";
        } else if (dealerTotal > 21 || t > dealerTotal) {
          outcome = "You Win";
        } else if (dealerTotal === t) {
          outcome = "You Push";
        } else {
          outcome = "You Lose";
        }

        // Record game result in backend
        await fetch(`${API}/api/games/increment`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ stat: "hands_played" }),
        });
        console.log("Incremented hands_won");

        if (outcome === "You Win") {
          await fetch(`${API}/api/games/increment`, {
            method: "POST",
            headers: authHeaders(token),
            body: JSON.stringify({ stat: "hands_won" }),
          });
        } else if (outcome === "You Lose") {
          await fetch(`${API}/api/games/increment`, {
            method: "POST",
            headers: authHeaders(token),
            body: JSON.stringify({ stat: "hands_lost" }),
          });
        } else if (outcome === "You Push") {
          await fetch(`${API}/api/games/increment`, {
            method: "POST",
            headers: authHeaders(token),
            body: JSON.stringify({ stat: "hands_pushed" }),
          });
        }

        // Update streak
        await fetch(`${API}/api/games/streak`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ outcome }),
        });

        return outcome;
      })
    );

    setMessage(`${dealerResult}. ${results.join(" | ")}`);
    setGameStarted(false);
    setGameOver(true);
  } catch (err) {
    setMessage(err.message);
  }
};

const split = async () => {
  if (!canSplit()) return;
  const [first, second] = currentHand();
  setStrategy(null)

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
    setDoubleDownUsed([false, false]);

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
  <main className="page_container">


 <div className="model_container">
  <DealerScene/>
 </div>

  
  <div className="game_container">

   
        {!gameStarted && playerHands.length === 0 ? (
          <div className="start_container">
            {gameNeedsReset ? (
              <div className="start_controls">
                <p>Deck is low, please start a new game</p>
                <button onClick={startGame}>
                  <strong>Start New Game</strong>
                </button>
              </div>
            ) : (
              <div className="start_controls">
                <button disabled={loading} onClick={startGame}>
                  {loading ? <strong>Starting…</strong> : <strong>Play Blackjack!</strong>}
                </button>
              </div>
            )}
          </div>
        ) : (
      <>
        
        <section className='dealer_section'>
          <h3>Dealer</h3>
          <div className='card_container'>
            {dealerHand.map((c, i) => (
              <div key={i} className={`${cardColor(c.suit.toLowerCase())} ${
                    i === 0 && !revealDealerHole ? "hidden-card" : ""
                    }`}>
                {`${cleanRank(c.rank)} ${suitSymbol[c.suit.toLowerCase()]}`}
              </div>
            ))}
          </div>
          {revealDealerHole && dealerHand.length > 0 && (
            <p>Total: {total(dealerHand)}</p>
          )}
        </section>

        <section className="middle_section">
      
        {gameStarted && (
          <div className="controls" style={{ gap: "0.5rem" }}>
            <button onClick={hit}><strong>Hit</strong></button>
            <button onClick={stand}><strong>Stand</strong></button>
            {!doubleDownUsed[activeHandIdx] && (
              <button onClick={doubleDown}><strong>Double Down</strong></button>
            )}
            {canSplit() && (
              <button onClick={split}><strong>Split</strong></button>
            )}
          </div>
        )}
        
        <section className="results_container">
          {gameOver && (
          <div className="results">
            {message && <p><strong>{message}</strong></p>}
            <button onClick={newHand}><strong>Play Another Hand</strong></button>
          </div>
          )}
        </section>

        </section>

        
        <section className="player_section">
          <h3>You</h3>
          {playerHands.map((hand, idx) => (
            <div key={idx}>
              <strong>
                Hand {idx + 1}
                {idx === activeHandIdx && gameStarted && " (active)"}
              </strong>
              <div className='card_container'>
                {hand.map((c, i) => (
                  <div key={i} className={`${cardColor(c.suit.toLowerCase())}`}>
                    {cleanRank(c.rank)} {suitSymbol[c.suit.toLowerCase()]}
                  </div>
                ))}
              </div>

              <p>Total: {total(hand)}</p>

              <div className="strategy">
                {strategy && idx === activeHandIdx && (
                  <div className="speech_bubble">
                  <p className="typing">I reccommend you <strong>{STRATEGY_MAP[strategy]}.</strong> </p>
                  </div>
                )}
                {idx ===activeHandIdx && (
                  <>
                    <br/>
                    <button id="strategy_button" onClick={() => getStrategy(hand)}><strong>Ask me for strategy</strong></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </section>
      </>
    )}
  </div>
</main>
);
}

//test code