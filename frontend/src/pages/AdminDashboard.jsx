import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  RefreshCw,
  UserCheck,
  Check,
  Building,
} from "lucide-react";
import { apiUrl } from "../utils/api";

const API_CLAIMS = apiUrl("/api/claims");
const API_ITEMS = apiUrl("/api/items");

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState("claims"); // 'claims' | 'inventory'
  const [claims, setClaims] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Department Verification Modal state
  const [verifyingClaim, setVerifyingClaim] = useState(null);
  const [pickupStation, setPickupStation] = useState("Campus Security Desk (Building B, Room 102)");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [proofMatched, setProofMatched] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reject Modal state
  const [rejectingClaim, setRejectingClaim] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Handover Modal state
  const [handoverClaim, setHandoverClaim] = useState(null);
  const [handoverNotes, setHandoverNotes] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Fetch all claims & inventory items
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [claimsRes, itemsRes] = await Promise.all([
        fetch(API_CLAIMS, { headers: getHeaders(), credentials: "include" }),
        fetch(API_ITEMS, { headers: getHeaders(), credentials: "include" }),
      ]);

      const claimsData = await claimsRes.json();
      const itemsData = await itemsRes.json();

      setClaims(Array.isArray(claimsData) ? claimsData : claimsData.claims || []);
      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch {
      setError("Failed to load dashboard data. Please make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Admin access check
  useEffect(() => {
    if (!user || user.role?.toLowerCase()?.trim() !== "admin") {
      navigate("/login", { replace: true });
      return;
    }
    loadData();
  }, [user, navigate, loadData]);

  // Open Department Verification Modal
  const openVerificationModal = (claim) => {
    setVerifyingClaim(claim);
    setPickupStation(claim.pickupStation || "Campus Security Desk (Building B, Room 102)");
    setVerifyNotes("Ownership verified by Lost & Found Department. Please present your student ID upon collection.");
    setProofMatched(true);
  };

  // Submit Department Verification & Activate Digital Pass
  const handleAuthorizeVerification = async (e) => {
    e.preventDefault();
    if (!verifyingClaim) return;
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_CLAIMS}/${verifyingClaim._id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify({
          status: "Approved",
          notes: verifyNotes.trim(),
          pickupStation: pickupStation.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to authorize verification.");

      setMsg(`Ownership authenticated! Digital Handover Pass issued for ${verifyingClaim.studentName}.`);
      setVerifyingClaim(null);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Claim Rejection
  const handleRejectClaim = async (e) => {
    e.preventDefault();
    if (!rejectingClaim) return;
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_CLAIMS}/${rejectingClaim._id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify({
          status: "Rejected",
          notes: rejectReason.trim() || "Proof details did not match physical item.",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject claim.");

      setMsg("Claim request has been rejected.");
      setRejectingClaim(null);
      setRejectReason("");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Physical Handover (Mark Item Returned)
  const handleCompleteHandover = async (e) => {
    e.preventDefault();
    if (!handoverClaim) return;
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_CLAIMS}/${handoverClaim._id}/returned`, {
        method: "PATCH",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify({
          notes: handoverNotes.trim() || "Student ID verified. Physical handover completed at campus desk.",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to record handover.");

      setMsg("Item successfully handed over and marked as Returned & Resolved!");
      setHandoverClaim(null);
      setHandoverNotes("");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Item from Catalog
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Delete this item permanently?")) return;
    try {
      const res = await fetch(`${API_ITEMS}/${itemId}`, {
        method: "DELETE",
        headers: getHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete item.");
      setMsg("Item removed from catalog.");
      setItems((prev) => prev.filter((i) => i._id !== itemId));
      setClaims((prev) => prev.filter((claim) => claim.item?._id !== itemId));
    } catch (err) {
      setError(err.message);
    }
  };

  const pendingCount = claims.filter((c) => c.status === "Pending").length;
  const approvedCount = claims.filter((c) => c.status === "Approved").length;
  const resolvedCount = claims.filter((c) => c.status === "Resolved" || c.item?.status === "Resolved").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-800 dark:text-slate-100 transition-colors">
      <AdminNavbar />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Staff Control Station
              </span>
              <span className="text-xs text-slate-400">• Desk Officer: <span data-no-translate>{user?.name}</span></span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Admin & Handover Operations Desk
            </h1>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold shadow-sm hover:border-emerald-500 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Desk
          </button>
        </div>

        {/* Feedback alerts */}
        {msg && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-300 flex justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg("")} className="font-bold cursor-pointer">&times;</button>
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="font-bold cursor-pointer">&times;</button>
          </div>
        )}

        {/* Simple Stat Cards */}
        <div className="mt-6 grid grid-cols-3 gap-3 md:gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Claims Pending Review</span>
            <p className="text-2xl font-black text-amber-500 mt-1">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Verified (Ready for Pickup)</span>
            <p className="text-2xl font-black text-emerald-500 mt-1">{approvedCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Reunited & Handed Over</span>
            <p className="text-2xl font-black text-cyan-500 mt-1">{resolvedCount}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("claims")}
            className={`pb-3 text-xs font-bold border-b-2 cursor-pointer ${
              activeTab === "claims"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Claims & Handovers ({claims.length})
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`pb-3 text-xs font-bold border-b-2 cursor-pointer ${
              activeTab === "inventory"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Items Inventory ({items.length})
          </button>
        </div>

        {/* Content: Claims Tab */}
        {activeTab === "claims" && (
          <div className="mt-6 space-y-4">
            {claims.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400">No claims submitted yet.</p>
            ) : (
              claims.map((claim) => {
                const isPending = claim.status === "Pending";
                const isApproved = claim.status === "Approved" && claim.item?.status !== "Resolved";
                const isResolved = claim.status === "Resolved" || claim.item?.status === "Resolved";
                const isRejected = claim.status === "Rejected";

                return (
                  <div
                    key={claim._id}
                    className={`rounded-2xl border p-5 text-xs shadow-sm bg-white dark:bg-slate-900 ${
                      isApproved
                        ? "border-emerald-500/40"
                        : isResolved
                        ? "border-cyan-500/30"
                        : isRejected
                        ? "border-rose-500/30"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          <span data-no-translate>{claim.item?.title || "Item Title"}</span>
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                          Claimant: <strong data-no-translate className="text-slate-700 dark:text-slate-200">{claim.studentName}</strong> • Phone: <span data-no-translate>{claim.contact}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          {claim.claimCode || "NO-CODE"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-bold ${
                            isPending
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                              : isApproved
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                              : isResolved
                              ? "bg-cyan-500/10 text-cyan-600 border border-cyan-500/30"
                              : "bg-rose-500/10 text-rose-600 border border-rose-500/30"
                          }`}
                        >
                          {isPending
                            ? "🛡️ Verification Required"
                            : isApproved
                            ? "✅ Authenticated & Approved"
                            : isResolved
                            ? "🎉 Handed Over & Resolved"
                            : "❌ Claim Rejected"}
                        </span>
                      </div>
                    </div>

                    {/* Submitted Proof */}
                    <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                        Submitted Ownership Proof Markers:
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                        {claim.proofDescription}
                      </p>
                    </div>

                    {/* Pickup station / notes if approved */}
                    {claim.pickupStation && isApproved && (
                      <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                        <strong>Assigned Pickup Desk:</strong> {claim.pickupStation}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                      {isPending && (
                        <>
                          <button
                            onClick={() => {
                              setRejectingClaim(claim);
                              setRejectReason("");
                            }}
                            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 font-bold text-rose-600 hover:bg-rose-500/20 cursor-pointer"
                          >
                            Reject Claim
                          </button>
                          <button
                            onClick={() => openVerificationModal(claim)}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 px-4 py-1.5 font-bold text-white hover:from-amber-400 hover:to-emerald-500 cursor-pointer shadow-md shadow-emerald-950/20"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Verify & Authenticate Ownership
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <button
                          onClick={() => {
                            setHandoverClaim(claim);
                            setHandoverNotes(`Student ID verified for ${claim.studentName}. Item handed over at campus desk.`);
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 font-bold text-white hover:from-emerald-500 hover:to-teal-500 cursor-pointer shadow-md shadow-emerald-950/20"
                        >
                          <UserCheck className="h-4 w-4" />
                          Execute Physical Handover
                        </button>
                      )}

                      {isResolved && (
                        <>
                          <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Handover Completed & Archived
                          </span>
                          {claim.item?._id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(claim.item._id)}
                              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 font-bold text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Item
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Content: Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="mt-6 space-y-3">
            {items.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400">No items in catalog.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs shadow-sm flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.type === "Lost" ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-[10px] text-slate-400">({item.status})</span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mt-1 text-sm">                    <span data-no-translate>{item.title}</span></h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Location: <span data-no-translate>{item.location}</span> • Category: <span data-no-translate>{item.category}</span> • Date: <span data-no-translate>{item.date}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item._id)}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 font-bold text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Item
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* 1. LOST & FOUND DEPARTMENT VERIFICATION MODAL */}
      {verifyingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-xl rounded-[24px] border border-amber-500/40 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center text-white">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Lost & Found Department Ownership Verification
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Verify claimant's proof markers against the physical item in custody.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVerifyingClaim(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAuthorizeVerification} className="mt-4 space-y-4 text-xs">
              {/* Custody vs Proof Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    📦 Physical Item in Custody
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">
                    {verifyingClaim.item?.title}
                  </p>
                  <p className="text-slate-500 mt-1">
                    Found at: {verifyingClaim.item?.location} ({verifyingClaim.item?.date})
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 italic text-[11px]">
                    "{verifyingClaim.item?.description}"
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                    🔍 Student Proof Markers
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">
                    {verifyingClaim.studentName}
                  </p>
                  <p className="text-slate-500 mt-1">Contact: {verifyingClaim.contact}</p>
                  <p className="text-slate-700 dark:text-slate-200 mt-1 text-[11px] whitespace-pre-wrap">
                    "{verifyingClaim.proofDescription}"
                  </p>
                </div>
              </div>

              {/* Department Authentication Confirmation Checkbox */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={proofMatched}
                    onChange={(e) => setProofMatched(e.target.checked)}
                    className="rounded accent-emerald-600 h-4 w-4"
                  />
                  <span>I confirm the proof description matches the physical item in station custody.</span>
                </label>
              </div>

              {/* Pickup Station */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Designated Pickup Desk / Location
                </label>
                <input
                  type="text"
                  required
                  value={pickupStation}
                  onChange={(e) => setPickupStation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Instructions / Notes for student */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Officer Notes & Collection Instructions
                </label>
                <textarea
                  rows={2}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setVerifyingClaim(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!proofMatched || isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/30 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Authenticating..." : "Authorize Verification & Issue Digital Pass"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PHYSICAL HANDOVER MODAL */}
      {handoverClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-500" />
                Confirm Physical Handover
              </h3>
              <button onClick={() => setHandoverClaim(null)} className="text-slate-400 text-lg">&times;</button>
            </div>

            <form onSubmit={handleCompleteHandover} className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                <p><strong>Item:</strong> {handoverClaim.item?.title}</p>
                <p className="mt-1"><strong>Claimant:</strong> {handoverClaim.studentName} ({handoverClaim.contact})</p>
                <p className="mt-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Claim Code: {handoverClaim.claimCode}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Handover Remarks (e.g. Student ID verified):
                </label>
                <textarea
                  rows={2}
                  required
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHandoverClaim(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 font-bold text-white shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Confirming..." : "Confirm & Mark Handed Over"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CLAIM REJECTION MODAL */}
      {rejectingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-500" />
                Reject Claim Request
              </h3>
              <button onClick={() => setRejectingClaim(null)} className="text-slate-400 text-lg">&times;</button>
            </div>

            <form onSubmit={handleRejectClaim} className="mt-4 space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Rejecting claim by <strong>{rejectingClaim.studentName}</strong> for <strong>{rejectingClaim.item?.title}</strong>.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Reason for Rejection:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Identifying marks or serial number provided did not match item in custody."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingClaim(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-2 font-bold text-white shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
