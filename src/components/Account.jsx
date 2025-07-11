import { useEffect, useState } from "react";
import { getToken } from "./Auth";
import { useNavigate } from "react-router-dom";

export default function Account() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
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
        const res = await fetch("http://localhost:3000/api/games", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch stats.");
        const statsData = await res.json();
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

  return (
    <div>
      <h2>Welcome, {user.email}!</h2>
      <h3>Your Blackjack Stats:</h3>

      <ul>
        <li><strong>Hands Played:</strong> {stats.hands_played}</li>
        <li><strong>Hands Won:</strong> {stats.hands_won}</li>
        <li><strong>Hands Lost:</strong> {stats.hands_lost}</li>
        <li><strong>Hands Pushed:</strong> {stats.hands_pushed}</li>
        <li><strong>Current Win Streak:</strong> {stats.current_streak}</li>
        <li><strong>Max Win Streak:</strong> {stats.max_streak}</li>
      </ul>
    </div>
  );
}