import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Shield,
  Sparkles,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { apiUrl } from "../utils/api";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Staff / Admin registration option
  const [isStaffRegister, setIsStaffRegister] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");

  // OTP verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

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
          navigate("/admin", { replace: true });
        } else {
          navigate("/my-activity", { replace: true });
        }
      }
    } catch {}
  }, [navigate]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Step 1: Send OTP to campus email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError("Please fill in your name, campus email, and password.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          preferredLanguage: language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP.");
      }

      setOtpSent(true);
      setResendTimer(60);
      setSuccess(data.message || `Verification code sent to ${formData.email}.`);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot connect to the server. Please verify backend is running on port 5000."
          : err.message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP and complete registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim() || otp.trim().length < 6) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          otp: otp.trim(),
          adminSecret: isStaffRegister ? adminSecret.trim() : undefined,
          preferredLanguage: language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      // Successful registration with auto-login
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      window.dispatchEvent(new Event("storage"));

      const registeredRole = data.user?.role?.toLowerCase()?.trim();
      if (registeredRole === "admin") {
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
      setError(err.message || "Registration error. Please try again.");
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
              {otpSent ? <KeyRound className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
            </div>

            <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {otpSent ? "Verify Your Email" : "Create Campus Account"}
            </h2>

            <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
              {otpSent
                ? `Enter the 6-digit code sent to ${formData.email}`
                : "Join CampusFind with verified campus credentials"}
            </p>
          </div>

          {/* Status Messages */}
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

          {/* Form Step 1: Details & Request OTP */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="relative mt-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

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
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px] mb-1">
                  Create Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Create a secure password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Staff / Admin toggle
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isStaffRegister}
                    onChange={(e) => setIsStaffRegister(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Campus Staff / Security Desk Officer Account</span>
                </label>

                {isStaffRegister && (
                  <div className="mt-2.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Admin Security Passcode (Default: <code className="text-emerald-500">admin123</code>)
                    </label>
                    <input
                      type="password"
                      placeholder="Enter Admin Secret Passcode"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div> */}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Form Step 2: Enter OTP & Complete */
            <form onSubmit={handleVerifyAndRegister} className="relative mt-6 space-y-4 text-xs">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-center">
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Verification code sent to:
                </p>
                <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                  {formData.email}
                </p>
                {isStaffRegister && (
                  <span className="inline-block mt-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                    Registering as Campus Staff Admin
                  </span>
                )}
              </div>

              <div>
                <label className="block text-center font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px] mb-2">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center font-mono text-2xl font-black tracking-[10px] rounded-xl border-2 border-emerald-500/50 bg-slate-50 dark:bg-slate-950 py-3 text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length < 6}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying OTP & Creating Account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Verify OTP & Complete Registration</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-500 cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Edit Details
                </button>

                {resendTimer > 0 ? (
                  <span className="text-slate-400">
                    Resend code in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSubmitting}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Redirect to Login */}
          <div className="relative mt-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
