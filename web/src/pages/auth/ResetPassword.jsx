import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../lib/supabase";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [checkingLink, setCheckingLink] = useState(true);
  const [linkValid, setLinkValid] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const decodeJwtPayload = (token) => {
    try {
      const payload = token.split(".")[1];
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(window.atob(normalized));
      return decoded;
    } catch {
      return null;
    }
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    let mounted = true;

    const setupRecoverySession = async () => {
      try {
        const hash = window.location.hash || "";
        const params = new URLSearchParams(hash.replace("#", ""));

        const urlError = params.get("error");
        const urlErrorDescription = params.get("error_description");

        if (urlError) {
          if (!mounted) return;

          setError(
            urlErrorDescription?.replaceAll("+", " ") ||
              "This password reset link is invalid or expired. Please request a new one."
          );
          setLinkValid(false);
          setCheckingLink(false);
          return;
        }

        const type = params.get("type");
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (type !== "recovery" || !accessToken || !refreshToken) {
          if (!mounted) return;

          setError("Invalid password reset link. Please request a new one.");
          setLinkValid(false);
          setCheckingLink(false);
          return;
        }

        const payload = decodeJwtPayload(accessToken);

        if (payload?.iat) {
          const nowSeconds = Math.floor(Date.now() / 1000);
          const issuedAt = Number(payload.iat);

          if (issuedAt > nowSeconds) {
            const waitMs = Math.min((issuedAt - nowSeconds + 2) * 1000, 10000);
            console.warn(
              `[ResetPassword] Token issued slightly in future. Waiting ${waitMs}ms before setting session.`
            );
            await sleep(waitMs);
          }
        } else {
          await sleep(1500);
        }

        const { data, error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!mounted) return;

        if (setSessionError) {
          console.error("[ResetPassword] setSession error:", setSessionError);

          setError(
            "Could not verify this reset link. Make sure your device time is set automatically, then request a new reset link."
          );
          setLinkValid(false);
          setCheckingLink(false);
          return;
        }

        if (!data?.session) {
          setError("Could not create password reset session. Please request a new reset link.");
          setLinkValid(false);
          setCheckingLink(false);
          return;
        }

        window.history.replaceState({}, document.title, "/reset-password");

        setLinkValid(true);
        setCheckingLink(false);
      } catch (err) {
        console.error("[ResetPassword] setup failed:", err);

        if (!mounted) return;

        setError("Something went wrong while opening your reset link.");
        setLinkValid(false);
        setCheckingLink(false);
      }
    };

    setupRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      await supabase.auth.signOut();

      toast.success("Password reset successfully!");

      setNewPassword("");
      setConfirmPassword("");

      navigate("/", {
        replace: true,
        state: {
          passwordResetComplete: true,
        },
      });
    } catch (err) {
      console.error("[ResetPassword] password update failed:", err);

      const message = err.message || "Failed to reset password.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4" />
          <p className="text-gray-700">Verifying reset link...</p>
          <p className="text-gray-500 text-sm mt-2">
            This can take a few seconds if your device clock is slightly off.
          </p>
        </div>
      </div>
    );
  }

  if (!linkValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reset Link Problem
            </h1>

            <p className="text-gray-600">
              This password reset link could not be verified.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">
              {error || "This link is invalid or expired. Please request a new one."}
            </p>
          </div>

          <p className="text-center text-gray-600 mt-6">
            Go back to the LoyalCup app, request a new reset link, then open the newest email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Password
          </h1>

          <p className="text-gray-600">
            Enter your new LoyalCup password below.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-2 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-green-700 text-gray-900"
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full px-4 py-2 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-green-700 text-gray-900"
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition font-medium disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          After resetting, return to the LoyalCup app and sign in with your new password.
        </p>
      </div>
    </div>
  );
}