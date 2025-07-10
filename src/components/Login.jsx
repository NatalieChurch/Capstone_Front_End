import { useState } from "react";
import { saveToken } from "./Auth";
import { useNavigate } from "react-router-dom";

export default function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),         
      });

      const data = await response.json();                 
      if (!response.ok) {
        setMessage(data.error ? data : "Login failed.");
        return;
      }

      saveToken(data.token, setToken);     
      navigate("/");
    } catch (err) {
      setMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2 className='h2Auth'>Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button className='buttonAuth' type="submit">Login</button>

      {message && <p style={{ color: "red" }}>{message}</p>}
    </form>
  );
}