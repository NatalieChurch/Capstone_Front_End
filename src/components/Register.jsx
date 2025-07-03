import { useState } from "react";
import { saveToken } from "./Auth";
import { useNavigate } from "react-router-dom";

export default function Register({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("")
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (data) {
        setSuccessMessage("User successfully created")
        saveToken(data, setToken);
        navigate("/");
      } else {
        setErrorMessage("Registration failed.");
      }
    } catch (err) {
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h2>Register</h2>
      <input
        type="email"
        placeholder="Email"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Register</button>
      {successMessage && <p>{successMessage}</p>}
      {errorMessage && <p>{errorMessage}</p>}
    </form>
  );
}