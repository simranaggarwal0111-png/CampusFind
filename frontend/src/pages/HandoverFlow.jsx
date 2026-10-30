import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiUrl } from "../utils/api";
import {
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Package,
  QrCode,
  MapPin,
  ArrowRight,
  HelpCircle,
  Phone,
  Building,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

const HandoverFlow = () => {
  const [query, setQuery] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearchError("");
    setTrackingResult(null);

    try {
      const res = await fetch(
        apiUrl(`/api/claims/track/${encodeURIComponent(query.trim())}`)
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No claim or handover record found for this code.");
      }

      setTrackingResult(data);
    } catch (err) {
      setSearchError(err.message || "Failed to find tracking record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto pt-4 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4" />
            Official Campus Handover Lifecycle
          </div>

          <h1 className="mt-4 text-3xl font-black text-slate-900 dark:text-white md:text-5xl tracking-tight">
            From Item Found to{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
              Safe Handover
            </span>
          </h1>

          <p className="mt-3 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            CampusFind provides a secure, audited chain-of-custody for lost and found property across the campus. Track handover progress in real time or explore our 4-step recovery protocol.
          </p>

          {/* Real-time Handover Tracker */}
          <form onSubmit={handleTrack} className="mt-8 max-w-xl mx-auto flex items-center rounded-2xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 p-2 shadow-xl shadow-slate-200/50 dark:shadow-black/40 backdrop-blur-xl transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
            <Search className="ml-3 h-5 w-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Enter Claim Code (e.g., CF-A9B12C) or Claim ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ml-3 w-full border-0 bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 px-5 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-bold text-white shadow-md shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50"
            >
              {loading ? "Checking..." : "Track"}
            </button>
          </form>

          {searchError && (
            <div role="alert" className="mt-4 max-w-xl mx-auto rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
              {searchError}
            </div>
          )}

          {/* Tracking Result Card */}
          {trackingResult && (
            <div className="mt-6 max-w-2xl mx-auto text-left rounded-[24px] border-2 border-emerald-500/40 bg-white dark:bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Claim Code</span>
                  <p className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {trackingResult.claimCode}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                    trackingResult.status === "Approved"
                      ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                      : trackingResult.status === "Resolved"
                      ? "border border-cyan-500/40 bg-cyan-500/15 text-cyan-600 dark:text-cyan-300"
                      : "border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300"
                  }`}
                >
                  {trackingResult.status === "Approved"
                    ? "Pass Ready • Awaiting Desk Pickup"
                    : trackingResult.status === "Resolved"
                    ? "Handover Completed & Resolved"
                    : "Under Verification"}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <p><strong>Item:</strong> <span data-no-translate>{trackingResult.item?.title || "N/A"}</span></p>
                <p><strong>Category:</strong> <span data-no-translate>{trackingResult.item?.category || "N/A"}</span></p>
                <p><strong>Claimant Name:</strong> <span data-no-translate>{trackingResult.studentName}</span></p>
                <p><strong>Pickup Station:</strong> <span data-no-translate>{trackingResult.pickupStation || "Campus Security Desk (Building B, Room 102)"}</span></p>
              </div>

              {trackingResult.status === "Approved" && (
                <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Instructions for In-Person Collection:
                  </p>
                  <p className="mt-1">
                    Bring your physical Student ID and quote Claim Code <strong>{trackingResult.claimCode}</strong> at the Security Desk.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4-Step Interactive Handover Stepper */}
        <section className="mt-6 rounded-[28px] border border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/80 p-6 md:p-10 shadow-xl shadow-slate-200/50 dark:shadow-black/25 backdrop-blur-xl">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              The 4-Step Handover Protocol
            </h2>
            <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Designed to ensure rightful items are returned securely without unauthorized claims.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-4 relative">
            {/* Step 1 */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-5 transition-all hover:border-emerald-500/50 hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-base">
                    01
                  </span>
                  <Package className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  Found & Logged
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  A student, faculty, or staff finds an item on campus. They submit a "Report Found" or deposit it at the Campus Station. The item is safely stored and labeled.
                </p>
              </div>
              <div className="mt-4 border-t border-slate-200 dark:border-slate-800/80 pt-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Status: Active
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-5 transition-all hover:border-emerald-500/50 hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-base">
                    02
                  </span>
                  <FileCheck2 className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  Proof Verification
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  The rightful owner locates the item in the Found catalog and clicks "Claim This Item". They submit distinctive proof (passcode, internal marks, wallpaper, unique scratches).
                </p>
              </div>
              <div className="mt-4 border-t border-slate-200 dark:border-slate-800/80 pt-3 text-[11px] font-semibold text-amber-500">
                Status: Pending Claim
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-5 transition-all hover:border-emerald-500/50 hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-base">
                    03
                  </span>
                  <QrCode className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  Handover Pass Issued
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Station Admin reviews and confirms the proof matches the physical item. An official digital Handover Pass with a unique Claim Code is generated for pickup.
                </p>
              </div>
              <div className="mt-4 border-t border-slate-200 dark:border-slate-800/80 pt-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Status: Claimed & Approved
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-5 transition-all hover:border-emerald-500/50 hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-base">
                    04
                  </span>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  Physical Reunited
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  The student visits the Campus Desk with their Student ID Card, collects the item, and the admin records the handover log with timestamp and notes.
                </p>
              </div>
              <div className="mt-4 border-t border-slate-200 dark:border-slate-800/80 pt-3 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                Status: Resolved
              </div>
            </div>
          </div>
        </section>

        {/* Campus Stations & FAQs */}
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Campus Handover Stations */}
          <div className="rounded-[24px] border border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/80 p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/25 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-emerald-500" />
              Campus Handover Stations
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Designated drop-off and pickup locations across the campus grounds.
            </p>

            <div className="mt-5 space-y-3.5">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Central Campus Security Desk (Main Station)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Building B, Room 102 (Opposite Main Library)
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      🕒 Mon – Fri: 9:00 AM – 5:00 PM • 📞 Ext: 2831
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Student Affairs & Union Reception
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Campus Center, 2nd Floor Lobby
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      🕒 Mon – Fri: 8:30 AM – 6:00 PM • 📞 Ext: 1405
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Handover FAQs */}
          <div className="rounded-[24px] border border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/80 p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/25 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-emerald-500" />
              Frequently Asked Questions
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Clear guidelines for property collection and handover.
            </p>

            <div className="mt-5 space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  What proof is required to claim an electronic device?
                </h4>
                <p className="mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">
                  For phones and laptops, unlocking the device in the presence of the desk officer or verifying serial numbers on the box/receipt confirms ownership immediately.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  How long are unclaimed items held?
                </h4>
                <p className="mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">
                  Items are securely held at the Central Station for 90 calendar days. After 90 days, unclaimed non-sensitive items may be donated to university charity.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Can a classmate pick up my item for me?
                </h4>
                <p className="mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">
                  Yes, provided you notify the station in advance through your claim notes and they present both your student ID photo and their own ID.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HandoverFlow;
