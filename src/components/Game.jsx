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
  };

  const currentHand = () => playerHands[activeHandIdx] || [];

  const canSplit = () =>
    currentHand().length === 2 &&
    sameRank(currentHand()[0].rank, currentHand()[1].rank) &&
    playerHands.length === 1;

  const startGame = () => {
    setLoading(true);
    resetTable();

    fetchJson(`${API}/shoe`, { method: "POST" })
      .then(() => {
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
              setPlayerHands((prev) => [[...prev[0], p2]]);

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
      })
      .catch((err) => {
        setMessage(`Couldn't start game: ${err.message}`);
        setLoading(false);
      });
  };

  const hit = async () => {
    try {
      const handNum = activeHandIdx + 1;
      const card = await fetchJson(`${API}/hand/player?hand=${handNum}`, {
        method: "POST",
        headers: authHeaders(token),
      });
      setPlayerHands((hands) =>
        hands.map((h, i) => (i === activeHandIdx ? [...h, card] : h))
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
          ? "Lose"
          : dealerTotal > 21 || t > dealerTotal
          ? "Win"
          : dealerTotal === t
          ? "Push"
          : "Lose";
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

  const newHand = () => {
  setLoading(true);
  resetTable();

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
          setPlayerHands((prev) => [[...prev[0], p2]]);

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



  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  if (!token) return null;

  return (
    <main>
      <h2>Blackjack!</h2>

      {!gameStarted && playerHands.length === 0 ? (
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
        </>
      )}

      {message && (
        <div>
          <p style={{ marginTop: "1rem" }}>{message}</p>
          <button onClick={newHand}>Play Another Hand</button>
        </div>
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