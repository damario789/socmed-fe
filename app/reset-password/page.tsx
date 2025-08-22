"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function validatePassword(password: string) {
  // At least 8 chars, 1 letter, 1 number, 1 symbol
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setSubmitError(null);
    setSubmitSuccess(null);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validatePassword(password)) {
      setPasswordError(
        "Password must be at least 8 characters, include a letter, a number, and a symbol."
      );
      return;
    } else {
      setPasswordError(null);
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error || "Failed to reset password");
        setLoading(false);
        return;
      }
      setSubmitSuccess("Password has been reset. You can now log in.");
      setPassword("");
    } catch (err) {
      setSubmitError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-gray-800 p-8 rounded shadow-md w-full max-w-sm text-white text-center">
          Invalid or missing token.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center text-white">
          Reset Password
        </h2>
        {submitError && (
          <div className="mb-2 text-red-400 text-center">{submitError}</div>
        )}
        {submitSuccess ? (
          <div className="flex flex-col gap-3">
            <div className="mb-2 text-green-400 text-center">{submitSuccess}</div>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
              onClick={() => router.push("/")}
            >
              Login
            </button>
          </div>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <div className="relative mb-1">
              <input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                className={`peer p-2 pt-5 border rounded w-full bg-gray-800 text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 ${passwordError ? "border-red-500" : ""}`}
                placeholder="New Password"
              />
              <label
                htmlFor="reset-password"
                className={`absolute left-2 top-2 text-gray-400 text-sm transition-all duration-200 pointer-events-none
                  peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                  peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-400
                  ${password ? "top-2 text-sm text-blue-400" : ""}
                `}
              >
                New Password
              </label>
              {passwordError && (
                <div className="text-xs text-red-500 mt-1">{passwordError}</div>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-300 mb-2">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(v => !v)}
              />
              Show password
            </label>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
