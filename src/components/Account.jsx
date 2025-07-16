import { useEffect, useState } from "react";
import { getToken } from "./Auth";
import { useNavigate } from "react-router-dom";

export default function Account() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setError("You must be logged in to view this page.");
      return;
    }

    // Fetch user info
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to verify token.");
        const userData = await res.json();
        setUser(userData);
      } catch (err) {
        setError("Unauthorized. Please log in again.");
      }
    };

    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:3000/games", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch stats.");
        const statsData = await res.json();
        console.log(statsData)
        setStats(statsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load game statistics.");
      }
    };

    fetchStats();
    fetchUser();
  }, []);

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!user || !stats) {
    return <p>Loading account information...</p>;
  }

  const handsWon = stats.reduce((sum, hand) => sum + hand.hands_won, 0);
  const handsLost = stats.reduce((sum, hand) => sum + hand.hands_lost, 0);
  const handsPushed = stats.reduce((sum, hand) => sum + hand.hands_pushed, 0);
  const winningPct = (handsWon/stats.length) * 100

  return (
    <div className="stats-card">
      <h2 className="stats-header">Welcome, {user.email}!</h2>
      <h3 className="stats-subheader">Your Blackjack Stats:</h3>

      <ul className="stats-list">
        <li><span>Total Hands Played:</span> <strong>{stats.length}</strong></li>
        <li><span>Hands Won:</span> <strong className="won">{handsWon}</strong></li>
        <li><span>Hands Lost:</span> <strong className="lost">{handsLost}</strong></li>
        <li><span>Hands Pushed:</span> <strong className="pushed">{handsPushed}</strong></li>
      </ul>

      <div className="win-percent">
        <p>Winning Percentage</p>
        <h4>{winningPct}%</h4>
      </div>
    </div>
  );

}