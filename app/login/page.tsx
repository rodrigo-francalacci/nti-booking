"use client";
import { useState } from "react";
import "./login.scss";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (r.ok) location.href = "/";
    else setError("Wrong password.");
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <h1>Stroma Equipment Booking</h1>
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="login__error">{error}</p>}
        <button type="submit">Enter</button>
      </form>
    </div>
  );
}
