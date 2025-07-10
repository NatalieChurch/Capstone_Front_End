import { useState } from "react";
import { saveToken } from "./Auth";
import { useNavigate } from "react-router-dom";

export default function Register({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json(); 

      if (!response.ok) {
        setErrorMessage(typeof data === "string" ? data : "Registration failed.");
        return;
      }

      setSuccessMessage("User successfully created");
      saveToken(data, setToken);            
      navigate("/");
    } catch (err) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h2 className='h2Auth'>Register</h2>
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
      <button className='buttonAuth' type="submit">Register</button>
      {successMessage && <p>{successMessage}</p>}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
    </form>
  );
}
