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
  const [dealerAnimation, setDealerAnimation] = useState("Idle");

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

const MAX_HANDS = 4

const canSplit = () =>
  currentHand().length === 2 &&
  sameRank(currentHand()[0].rank, currentHand()[1].rank) &&
  playerHands.length < MAX_HANDS;

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
  setDealerAnimation("DealingAllCards");
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

            setGameStarted(true)
            setTimeout(() =>{
            setDealerAnimation("Idle")
            }, 1000);;
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
  setDealerAnimation("Hit");
  setTimeout(() => {
    setDealerAnimation("Idle");
  }, 1000);

  setStrategy(null);
  setDoubleDownUsed((prev) =>
    prev.map((used, i) => (i === activeHandIdx ? true : used))
  );

  try {
    const handNum = activeHandIdx + 1;
    const card = await fetchJson(`${API}/hand/player?hand=${handNum}`, {
      method: "POST",
      headers: authHeaders(token),
    });

    // Create updated hands manually so we can check the result before setting state
    const updatedHands = playerHands.map((h, i) => {
      if (i === activeHandIdx) {
        return [...h, card];
      }
      return h;
    });

    const newTotal = total(updatedHands[activeHandIdx]);

    setPlayerHands(updatedHands);
    setHandTypes(updatedHands.map(getHandType));

    if (newTotal > 21) {
      const allBusted = updatedHands.every((hand) => total(hand) > 21);

      if (allBusted) {
        setRevealDealerHole(true);
        const dealerTotal = total(dealerHand);
        const results = updatedHands.map(() => "You Lose");
        setMessage(`Dealer stands on ${dealerTotal} | ${results.join(" | ")}`);
        setGameStarted(false);
        setGameOver(true);
      } else {
        setMessage((m) => `${m} Bust. `);
        setActiveHandIdx((idx) => idx + 1);
      }

      return true; // ⬅️ Hand busted
    }

    return false; // ⬅️ Still alive
  } catch (err) {
    setMessage(err.message);
    return false;
  }
};
  
  const stand = () => nextHand();

async function doubleDown() {
  // Mark this hand as having used double down
  setDoubleDownUsed((prev) =>
    prev.map((used, i) => (i === activeHandIdx ? true : used))
  );

  // Hit once and check if the player busted
  const busted = await hit(); // <- assumes `hit()` returns true if busted

  // If player busted, skip calling nextHand (game is already handled)
  if (busted) return;

  // Otherwise, go to the next hand after a short delay
  setTimeout(() => {
    nextHand();
  }, 300);
}

const nextHand = () => {
  const nextIdx = activeHandIdx + 1;

  const isAllBusted = (hands) => hands.every((hand) => total(hand) > 21);

  if (nextIdx < playerHands.length) {
    setActiveHandIdx(nextIdx);
    setStrategy(null);
    return;
  }

  if (isAllBusted(playerHands)) {
    setRevealDealerHole(true);
    const dealerTotal = total(dealerHand);
    const results = playerHands.map(() => "You Lose");
    setMessage(`Dealer stands on ${dealerTotal} | ${results.join(" | ")}`);
    setGameStarted(false);
    setGameOver(true);
    return;
  }

  finishDealerPlay();
};

  const finishDealerPlay = () => {
      const allBusted = playerHands.every((hand) => total(hand) > 21);
      if (allBusted) return;

  try {
    setRevealDealerHole(true);
    let dealer = [...dealerHand];

    const isSoft17 = (hand) => {
      const totalVal = total(hand);
      const hasAce = hand.some((card) => isAce(card.rank));
      let sum = hand.reduce((s, c) => s + c.card_value, 0);
      return totalVal === 17 && hasAce && sum !== 17;
    };

    const continueDealerPlay = async () => {
      const shouldHit = total(dealer) < 17 || isSoft17(dealer);
      if (!shouldHit) {
        finishResults(dealer);
        return;
      }

      const card = await fetchJson(`${API}/hand/dealer`, {
        method: "POST",
        headers: authHeaders(token),
      });

      dealer.push(card);
      setDealerHand([...dealer]);

      setTimeout(() => {
        continueDealerPlay();
      }, 1000);
    };

    const finishResults = async (finalDealerHand) => {
      const dealerTotal = total(finalDealerHand);

      const results = await Promise.all(
        playerHands.map(async (hand) => {
          const t = total(hand);
          let outcome;

          if (t > 21) {
            outcome = "You Lose";
          } else if (dealerTotal > 21 || t > dealerTotal) {
            outcome = "You Win";
          } else if (t === dealerTotal) {
            outcome = "You Push";
          } else {
            outcome = "You Lose";
          }

          return outcome;
        })
      );

      const dealerMessage =
        dealerTotal > 21
          ? "Dealer busts"
          : `Dealer stands on ${dealerTotal}`;

      setMessage(`${dealerMessage} | ${results.join(" | ")}`);
      setGameStarted(false);
      setGameOver(true);
    };

    setTimeout(() => {
      continueDealerPlay();
    }, 1000);
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
    setDealerAnimation("DealingAllCards");
    setLoading(true);
    resetTable();

    const shoe = await checkShoe();
    if (shoe.length < 10) {
      setGameNeedsReset(true);
      setDealerAnimation("Idle");
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
              setTimeout(() =>{
              setDealerAnimation("Idle")
               }, 1000);;
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
  if (strategy === "D" && hand.length >= 3){
    setStrategy("H")
  } else 
  setStrategy(strategy);
}



  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  if (!token) return null;

  return (
  <main className="page_container">


 <div className="model_container">
  <DealerScene animationName={dealerAnimation}/>
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
            {!doubleDownUsed[activeHandIdx] && currentHand().length === 2 && (
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
                  <p className="typing">I recommend you <strong>{STRATEGY_MAP[strategy]}.</strong> </p>
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