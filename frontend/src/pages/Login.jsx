import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
  Lock,
  Mail,
  ShieldCheck,
  Loader2,
  Shield,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { apiUrl } from "../utils/api";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Quick Admin Setup Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalData, setAdminModalData] = useState({
    name: "Saniya",
    email: "simranaggarwal0111@gmail.com",
    password: "adminpassword",
    adminSecret: "admin123",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      if (stored) {
        const role = stored.role?.toLowerCase()?.trim();
        if (role === "admin") {
          const requested = location.state?.from;
          const target =
            typeof requested === "string" && requested.startsWith("/admin")
              ? requested
              : "/admin";
          navigate(target, { replace: true });
        } else {
          navigate("/my-activity", { replace: true });
        }
      }
    } catch {}
  }, [navigate, location.state]);

  // Standard Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      window.dispatchEvent(new Event("storage"));

      const loggedRole = data.user?.role?.toLowerCase()?.trim();
      if (loggedRole === "admin") {
        const requestedPage = location.state?.from;
        const target =
          typeof requestedPage === "string" && requestedPage.startsWith("/admin")
            ? requestedPage
            : "/admin";
        navigate(target, { replace: true });
      } else {
        const requestedPage = location.state?.from;
        navigate(
          typeof requestedPage === "string" ? requestedPage : "/my-activity",
          { replace: true }
        );
      }
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot connect to the server. Please check backend connection."
          : err.message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Admin Bootstrap / Quick Setup
  const handleAdminBootstrap = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl("/api/auth/setup-admin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...adminModalData, preferredLanguage: language }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to setup admin.");
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      window.dispatchEvent(new Event("storage"));

      setShowAdminModal(false);
      const requestedPage = location.state?.from;
      const target =
        typeof requestedPage === "string" && requestedPage.startsWith("/admin")
          ? requestedPage
          : "/admin";
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || "Admin setup error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-12 md:py-16">
        <div className="relative w-full overflow-hidden rounded-[26px] border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/85 p-6 md:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 backdrop-blur-2xl">
          {/* Subtle ambient light */}
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="relative text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome Back
            </h2>

            <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Sign in to manage your lost & found items and active claims
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              {success}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="relative mt-6 space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px] mb-1">
                Campus Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="student@campus.edu"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px]">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Log In to CampusFind"
              )}
            </button>
          </form>



          {/* Switch Mode to Sign Up */}
          <div className="relative mt-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
            Don't have an account yet?{" "}
            <Link
              to="/signup"
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
            >
              Create Account (Sign Up)
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Setup Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-[26px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                Initialize Campus Admin Account
              </h3>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg"
              >
                &times;
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Instantly create or configure the official Station Desk Admin with full management permissions.
            </p>

            {/* Quick Admin Account Selector */}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setAdminModalData({
                    name: "Saniya",
                    email: "simranaggarwal0111@gmail.com",
                    password: "adminpassword",
                    adminSecret: "admin123",
                  })
                }
                className="flex-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-1.5 px-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all text-center cursor-pointer"
              >
                👑 Saniya (simranaggarwal0111)
              </button>
              <button
                type="button"
                onClick={() =>
                  setAdminModalData({
                    name: "Campus Security Desk",
                    email: "admin@campus.edu",
                    password: "adminpassword",
                    adminSecret: "admin123",
                  })
                }
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 py-1.5 px-2 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-center cursor-pointer"
              >
                🛡️ Desk Admin (admin@campus.edu)
              </button>
            </div>

            <form onSubmit={handleAdminBootstrap} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Admin Name
                </label>
                <input
                  type="text"
                  required
                  value={adminModalData.name}
                  onChange={(e) =>
                    setAdminModalData({ ...adminModalData, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={adminModalData.email}
                  onChange={(e) =>
                    setAdminModalData({ ...adminModalData, email: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  required
                  value={adminModalData.password}
                  onChange={(e) =>
                    setAdminModalData({ ...adminModalData, password: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Secret Passcode (Default: <code>admin123</code>)
                </label>
                <input
                  type="password"
                  required
                  value={adminModalData.adminSecret}
                  onChange={(e) =>
                    setAdminModalData({ ...adminModalData, adminSecret: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 px-5 py-2 font-bold text-white shadow-md shadow-amber-950/30 hover:from-amber-400 hover:to-emerald-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Setting up..." : "Configure & Enter Admin Desk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
