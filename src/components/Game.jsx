import { useState, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { getToken, clearToken } from "./Auth";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
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


export default function Game() {
  const navigate = useNavigate();
  const [token] = useState(getToken());
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playerHands, setPlayerHands] = useState([]);
  const [activeHandIdx, setActiveHandIdx] = useState(0);
  const [dealerHand, setDealerHand] = useState([]);
  const [message, setMessage] = useState("");

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
  };

  const currentHand = () => playerHands[activeHandIdx] || [];

  const canSplit = () =>
    currentHand().length === 2 &&
    sameRank(currentHand()[0].rank, currentHand()[1].rank) &&
    playerHands.length === 1; 


  const startGame = async () => {
    setLoading(true);
    try {
      resetTable();
      await fetchJson(`${API}/shoe`, { method: "POST" });

      const p1 = await fetchJson(`${API}/hand/player`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const p2 = await fetchJson(`${API}/hand/player`, {
        method: "POST",
        headers: authHeaders(token),
      });
      setPlayerHands([[p1, p2]]);

      // deal dealer
      const d1 = await fetchJson(`${API}/hand/dealer`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const d2 = await fetchJson(`${API}/hand/dealer`, {
        method: "POST",
        headers: authHeaders(token),
      });
      setDealerHand([d1, d2]);

      setGameStarted(true);
    } catch (err) {
      setMessage(`Couldn't start game: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
    if (activeHandIdx < playerHands.length - 1)
      setActiveHandIdx(activeHandIdx + 1);
    else finishDealerPlay();
  };

  const finishDealerPlay = async () => {
    try {
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

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  
  if (!token) return null;

  return (
    <main>
      <h2>Blackjack!</h2>

      {!gameStarted ? (
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
                  {i === 0 || !gameStarted
                    ? `${cleanRank(c.rank)} of ${c.suit}`
                    : "🂠"}
                </li>
              ))}
            </ul>
            {!gameStarted && <p>Total: {total(dealerHand)}</p>}
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

          
          <div className="controls" style={{ gap: "0.5rem" }}>
            <button onClick={hit}>Hit</button>
            <button onClick={stand}>Stand</button>
            <button onClick={split} disabled={!canSplit()}>
              Split
            </button>
          </div>
        </>
      )}

      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}

      <button
        onClick={() => {
          clearToken(() => {});
          navigate("/login");
        }}
        style={{ marginTop: "2rem" }}
      >
        Log out
      </button>
       {message && <p style={{ marginTop: "1rem" }}>{message}</p>}

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
