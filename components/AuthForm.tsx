"use client";
import { useState } from "react";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePassword(password: string) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

function FloatingInput({
  id,
  type,
  value,
  onChange,
  label,
  autoComplete,
  required,
  error,
}: {
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  autoComplete?: string;
  required?: boolean;
  error?: string | null;
}) {
  return (
    <div className="relative mb-1">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        className={`peer p-2 pt-5 border rounded w-full bg-gray-800 text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? "border-red-500" : ""}`}
        placeholder={label}
      />
      <label
        htmlFor={id}
        className={`absolute left-2 top-2 text-gray-400 text-sm transition-all duration-200 pointer-events-none
          peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
          peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-400
          ${value ? "top-2 text-sm text-blue-400" : ""}
        `}
      >
        {label}
      </label>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}

export default function AuthForm({ onSuccess }: { onSuccess: () => void }) {
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Login form state
  const [loginEmailOrUsername, setLoginEmailOrUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Validation state
  const [registerEmailError, setRegisterEmailError] = useState<string | null>(null);
  const [registerPasswordError, setRegisterPasswordError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!loginEmailOrUsername || !loginPassword) {
      setErrorMsg("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmailOrUsername,
          password: loginPassword,
        }),
      });

      if (res.status === 401) {
        const data = await res.json();
        setErrorMsg(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Login failed");
        setLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      onSuccess();
    } catch (err) {
      setErrorMsg("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side validation
    let valid = true;
    if (!validateEmail(registerEmail)) {
      setRegisterEmailError("Invalid email format.");
      valid = false;
    } else {
      setRegisterEmailError(null);
    }
    if (!validatePassword(registerPassword)) {
      setRegisterPasswordError(
        "Password must be at least 8 characters, include a letter, a number, and a symbol."
      );
      valid = false;
    } else {
      setRegisterPasswordError(null);
    }
    if (!registerUsername) {
      setErrorMsg("Username is required.");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          username: registerUsername,
        }),
      });

      if (res.status === 409) {
        const data = await res.json();
        setErrorMsg(data.error || "Conflict error");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Registration successful, switch to login form
      setShowRegister(false);
      setErrorMsg("Registration successful! Please log in.");
      setRegisterEmail("");
      setRegisterUsername("");
      setRegisterPassword("");
    } catch (err) {
      setErrorMsg("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-900">
      <div className="bg-gray-800 p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center text-white">
          {showRegister ? "Sign Up" : "Login"}
        </h2>
        {errorMsg && (
          <div className="mb-2 text-red-400 text-center">{errorMsg}</div>
        )}
        {showRegister ? (
          <form className="flex flex-col gap-3" onSubmit={handleRegister}>
            <FloatingInput
              id="register-email"
              type="email"
              value={registerEmail}
              onChange={e => setRegisterEmail(e.target.value)}
              label="Email"
              autoComplete="email"
              required
              error={registerEmailError}
            />
            <FloatingInput
              id="register-username"
              type="text"
              value={registerUsername}
              onChange={e => setRegisterUsername(e.target.value)}
              label="Username"
              autoComplete="username"
              required
            />
            <FloatingInput
              id="register-password"
              type={showRegisterPassword ? "text" : "password"}
              value={registerPassword}
              onChange={e => setRegisterPassword(e.target.value)}
              label="Password"
              autoComplete="new-password"
              required
              error={registerPasswordError}
            />
            <label className="flex items-center gap-2 text-xs text-gray-300 mb-2">
              <input
                type="checkbox"
                checked={showRegisterPassword}
                onChange={() => setShowRegisterPassword(v => !v)}
              />
              Show password
            </label>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded mt-2"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
            <button
              type="button"
              className="text-blue-400 underline mt-2"
              onClick={() => {
                setShowRegister(false);
                setErrorMsg(null);
              }}
            >
              Already have an account? Log in
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={handleLogin}>
            <FloatingInput
              id="login-email-username"
              type="text"
              value={loginEmailOrUsername}
              onChange={e => setLoginEmailOrUsername(e.target.value)}
              label="Email or Username"
              autoComplete="username"
              required
            />
            <FloatingInput
              id="login-password"
              type={showLoginPassword ? "text" : "password"}
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              label="Password"
              autoComplete="current-password"
              required
            />
            <label className="flex items-center gap-2 text-xs text-gray-300 mb-2">
              <input
                type="checkbox"
                checked={showLoginPassword}
                onChange={() => setShowLoginPassword(v => !v)}
              />
              Show password
            </label>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              className="text-green-400 underline mt-2"
              onClick={() => {
                setShowRegister(true);
                setErrorMsg(null);
              }}
            >
              Don't have an account? Sign up
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
