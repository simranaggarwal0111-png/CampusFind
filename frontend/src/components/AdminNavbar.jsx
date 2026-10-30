import React, { useState, useEffect } from "react";
import {
  Shield,
  ClipboardList,
  Package,
  CheckCircle2,
  Users,
  HelpCircle,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Compass,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import { apiUrl } from "../utils/api";

const AdminNavbar = ({ activeTab, onTabSelect }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

  // Keep admin user state synchronized
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

  // Verify session on mount
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
          navigate("/login");
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
  }, [navigate]);

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
    navigate("/login");
  };

  const navLinks = [
    { id: "claims", label: "Claims & Handover", to: "/admin/claims", icon: ClipboardList },
    // { id: "inventory", label: "Campus Inventory", to: "/admin/inventory", icon: Package },
    // { id: "audit", label: "Audit Log", to: "/admin/audit", icon: CheckCircle2 },
    // { id: "users", label: "Staff & Users", to: "/admin/users", icon: Users },
    // { id: "guide", label: "Desk SOP", to: "/admin/guide", icon: HelpCircle },
  ];

  const handleLinkClick = (id) => {
    if (onTabSelect) {
      onTabSelect(id);
    }
    setMenuOpen(false);
  };

  return (
    <nav className="w-full px-4 py-3 sticky top-0 z-50">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between rounded-[22px] border border-amber-500/25 dark:border-amber-500/20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-4 py-2.5 shadow-xl shadow-amber-950/10 dark:shadow-black/40 md:px-6 transition-all duration-300">
        {/* Brand / Admin Portal Title */}
        <div className="flex items-center gap-3">
          <Link to="/admin" className="flex items-center gap-3 group text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-emerald-600 to-teal-700 text-white shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight md:text-xl">
                  Campus<span className="text-amber-500 dark:text-amber-400">Find</span>
                </h1>
                <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Staff Admin
                </span>
              </div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
                Central Station Desk
              </p>
            </div>
          </Link>
        </div>

        {/* Center Admin Operational Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-bold">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                onClick={() => handleLinkClick(item.id)}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all cursor-pointer ${
                    isSelected || isActive
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm border border-amber-500/30 font-black"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Right Section: Student Portal Switch + Admin Info + Theme + Logout */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Switch to Public / Student Portal */}
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-500/40 transition-all shadow-sm"
            title="Switch to Student / Public Portal"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Public Site</span>
          </Link>

          <LanguageToggle />
          <ThemeToggle />

          {/* Admin Profile Pill */}
          <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{currentUser?.name || "Officer Saniya"}</span>
            <span className="text-[9px] rounded bg-amber-500/20 px-1 py-0.2 uppercase text-amber-600 dark:text-amber-400 font-extrabold">
              Admin
            </span>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm cursor-pointer"
            title="Sign out of Admin Station"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <ThemeToggle />
          <button
            type="button"
            className="rounded-xl p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle admin menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="mx-auto mt-2 max-w-[1360px] rounded-[22px] border border-amber-500/30 bg-white/95 dark:bg-slate-900/95 p-4 shadow-2xl backdrop-blur-2xl lg:hidden animate-in fade-in slide-in-from-top-2">
          {/* Admin Info Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Officer {currentUser?.name || "Admin"}
              </p>
              <p className="text-[10px] text-slate-400">{currentUser?.email || "admin@campus.edu"}</p>
            </div>
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-500">
              Station Officer
            </span>
          </div>

          {/* Operational Links */}
          <div className="mt-3 space-y-1 text-sm font-semibold">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <NavLink
                  key={item.id}
                  to={item.to}
                  onClick={() => handleLinkClick(item.id)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all ${
                    isSelected
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Actions & Navigation switch */}
          <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-500"
            >
              <Compass className="h-4 w-4" />
              <span>Switch to Public Student Portal</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout from Admin Desk</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;
