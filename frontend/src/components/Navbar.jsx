import React, { useState, useEffect } from "react";
import { Search, Menu, X, Shield, User, ArrowRight } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import { API_BASE_URL, apiUrl } from "../utils/api";

const getProfilePictureUrl = (picture) =>
  picture?.startsWith("http") ? picture : `${API_BASE_URL}${picture}`;

const Navbar = ({ showPageLinks = true }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

  // Sync state if user changes in localStorage across components or windows
  useEffect(() => {
    const syncUser = () => {
      try {
        setCurrentUser(JSON.parse(localStorage.getItem("user")) || null);
      } catch {
        setCurrentUser(null);
      }
    };
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  // Verify session cookie or token with backend on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(apiUrl("/api/auth/me"), {
      headers,
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setCurrentUser(null);
          window.dispatchEvent(new Event("storage"));
          return null;
        }
        return null;
      })
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          window.dispatchEvent(new Event("storage"));
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(apiUrl("/api/auth/logout"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("storage"));
    setCurrentUser(null);
    setMenuOpen(false);
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    isActive
      ? "font-semibold text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]"
      : "text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors";

  const loggedIn = Boolean(currentUser);
  const isAdmin = currentUser?.role?.toLowerCase()?.trim() === "admin";

  return (
    <nav className="w-full px-4 py-3 sticky top-0 z-50">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between rounded-[20px] border border-slate-200/90 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl px-4 py-2.5 shadow-xl shadow-slate-200/50 dark:shadow-black/25 md:px-6 transition-colors duration-300">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 text-left group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 transition-transform group-hover:scale-105">
            <Search className="h-4.5 w-4.5" />
          </div>

          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white md:text-xl tracking-tight leading-tight">
              Campus<span className="text-emerald-500 dark:text-emerald-400">Find</span>
            </h1>
            <p className="text-[8px] uppercase tracking-[0.22em] text-slate-400 font-medium">Lost & Found</p>
          </div>
        </Link>

        {/* Center Links (Desktop) */}
        {showPageLinks && (
          <div className="hidden items-center gap-5 text-sm font-medium lg:flex">
            <NavLink to="/" className={navLinkClass}>Home</NavLink>
            <NavLink to="/lost" className={navLinkClass}>Lost Items</NavLink>
            <NavLink to="/found" className={navLinkClass}>Found Items</NavLink>
            <NavLink to="/handover" className={navLinkClass}>Handover Flow</NavLink>
            {loggedIn && (
              <>
                <NavLink to="/report-lost" className={navLinkClass}>Report Lost</NavLink>
                <NavLink to="/report-found" className={navLinkClass}>Report Found</NavLink>
                {isAdmin ? (
                  <NavLink to="/admin" className={navLinkClass}>
                    <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                      <Shield className="h-3.5 w-3.5" /> Admin Desk
                    </span>
                  </NavLink>
                ) : (
                  <NavLink to="/my-activity" className={navLinkClass}>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <User className="h-3.5 w-3.5" /> My Activity
                    </span>
                  </NavLink>
                )}
              </>
            )}
          </div>
        )}

        {/* Right Section: Theme Toggle + Auth */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageToggle />
          <ThemeToggle />

          {loggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                to={isAdmin ? "/admin" : "/my-activity"}
                className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-all"
              >
                  {currentUser.profilePicture ? (
                    <img
                      src={getProfilePictureUrl(currentUser.profilePicture)}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                  <span data-no-translate>{currentUser.name?.split(" ")[0] || "User"}</span>
                <span className="text-[10px] text-slate-400 uppercase">({currentUser.role})</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500 shadow-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-all shadow-sm"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-950/30 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <ThemeToggle />

          <button
            type="button"
            className="rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="mx-auto mt-2 max-w-[1280px] rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-2xl backdrop-blur-2xl lg:hidden animate-in fade-in slide-in-from-top-2">
          {showPageLinks && (
            <div className="space-y-1.5 text-sm font-medium">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "block w-full rounded-xl bg-emerald-500/10 px-3 py-2 text-left font-semibold text-emerald-600 dark:text-emerald-400"
                    : "block w-full rounded-xl px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }
                onClick={() => setMenuOpen(false)}
              >
                Home
              </NavLink>
              <NavLink
                to="/lost"
                className={({ isActive }) =>
                  isActive
                    ? "block w-full rounded-xl bg-emerald-500/10 px-3 py-2 text-left font-semibold text-emerald-600 dark:text-emerald-400"
                    : "block w-full rounded-xl px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }
                onClick={() => setMenuOpen(false)}
              >
                Lost Items
              </NavLink>
              <NavLink
                to="/found"
                className={({ isActive }) =>
                  isActive
                    ? "block w-full rounded-xl bg-emerald-500/10 px-3 py-2 text-left font-semibold text-emerald-600 dark:text-emerald-400"
                    : "block w-full rounded-xl px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }
                onClick={() => setMenuOpen(false)}
              >
                Found Items
              </NavLink>
              <NavLink
                to="/handover"
                className={({ isActive }) =>
                  isActive
                    ? "block w-full rounded-xl bg-emerald-500/10 px-3 py-2 text-left font-semibold text-emerald-600 dark:text-emerald-400"
                    : "block w-full rounded-xl px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }
                onClick={() => setMenuOpen(false)}
              >
                Handover Flow & Tracker
              </NavLink>

              {loggedIn && (
                <>
                  <NavLink
                    to="/report-lost"
                    className={({ isActive }) =>
                      isActive
                        ? "block w-full rounded-xl bg-emerald-500/10 px-3 py-2 text-left font-semibold text-emerald-600 dark:text-emerald-400"
                        : "block w-full rounded-xl px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    Report Lost
                  </NavLink>
                  <NavLink
                    to="/report-found"
                    className={({ isActive }) =>
                      isActive
                        ? "block w-full rounded-xl bg-emerald-500/10 px-3 py-2 text-left font-semibold text-emerald-600 dark:text-emerald-400"
                        : "block w-full rounded-xl px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    Report Found
                  </NavLink>

                  {isAdmin ? (
                    <NavLink
                      to="/admin"
                      className="block w-full rounded-xl bg-amber-500/10 px-3 py-2 text-left font-bold text-amber-500"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin Desk (Control Station)
                    </NavLink>
                  ) : (
                    <NavLink
                      to="/my-activity"
                      className="block w-full rounded-xl bg-emerald-500/10 px-3 py-2 text-left font-bold text-emerald-600 dark:text-emerald-400"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Activity & Handover Passes
                    </NavLink>
                  )}
                </>
              )}
            </div>
          )}

          <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
            {loggedIn ? (
              <div className="space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 px-2">
                  <span className="inline-flex items-center gap-2">
                    {currentUser.profilePicture && (
                      <img
                        src={getProfilePictureUrl(currentUser.profilePicture)}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    )}
                    <span>
                      Signed in as <strong data-no-translate>{currentUser.name}</strong> (<span data-no-translate>{currentUser.email}</span>)
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-center text-xs font-semibold text-red-500 hover:bg-red-500/20"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-center text-xs font-bold text-white shadow-md shadow-emerald-950/60"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;