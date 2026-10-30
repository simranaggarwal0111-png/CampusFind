import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Package,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  ExternalLink,
  Trash2,
  PlusCircle,
  ShieldCheck,
  QrCode,
  ArrowRight,
  Sparkles,
  Search,
} from "lucide-react";
import { apiUrl, getItemImageUrl } from "../utils/api";

const getProfilePictureUrl = (picture) =>
  picture?.startsWith("http") ? picture : apiUrl(picture || "");

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState(() =>
    new URLSearchParams(location.search).get("tab") === "recovery"
      ? "recovery"
      : "claims",
  );
  const [claims, setClaims] = useState([]);
  const [items, setItems] = useState([]);
  const [recoveryReports, setRecoveryReports] = useState([]);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryUpdateId, setRecoveryUpdateId] = useState("");
  const [expandedRecoveryId, setExpandedRecoveryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [selectedPicture, setSelectedPicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState("");
  const [pictureLoading, setPictureLoading] = useState(false);
  const [pictureError, setPictureError] = useState("");
  const [pictureMessage, setPictureMessage] = useState("");
  const picturePreviewUrl = useRef("");

  useEffect(() => {
    return () => {
      if (picturePreviewUrl.current) {
        URL.revokeObjectURL(picturePreviewUrl.current);
      }
    };
  }, []);

  const clearSelectedPicture = () => {
    if (picturePreviewUrl.current) {
      URL.revokeObjectURL(picturePreviewUrl.current);
      picturePreviewUrl.current = "";
    }
    setPicturePreview("");
    setSelectedPicture(null);
  };

  const handlePictureSelection = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPictureError("Choose a JPG, PNG, or WebP image.");
      clearSelectedPicture();
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPictureError("Profile pictures must be 2 MB or smaller.");
      clearSelectedPicture();
      return;
    }

    setPictureError("");
    setPictureMessage("");
    clearSelectedPicture();
    picturePreviewUrl.current = URL.createObjectURL(file);
    setPicturePreview(picturePreviewUrl.current);
    setSelectedPicture(file);
  };

  const syncUpdatedUser = (updatedUser) => {
    const nextUser = { ...user, ...updatedUser };
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
    window.dispatchEvent(new Event("storage"));
  };

  const handlePictureUpload = async () => {
    if (!selectedPicture) return;

    setPictureLoading(true);
    setPictureError("");
    setPictureMessage("");
    try {
      const formData = new FormData();
      formData.append("profilePicture", selectedPicture);
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/api/auth/profile-picture"), {
        method: "POST",
        headers: token ? { Authorization: "Bear" + "er " + token } : {},
        credentials: "include",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not upload profile picture.");

      syncUpdatedUser(data.user);
      clearSelectedPicture();
      setPictureMessage(data.message);
    } catch (error) {
      setPictureError(error.message || "Could not upload profile picture.");
    } finally {
      setPictureLoading(false);
    }
  };

  const handlePictureRemoval = async () => {
    setPictureLoading(true);
    setPictureError("");
    setPictureMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/api/auth/profile-picture"), {
        method: "DELETE",
        headers: token ? { Authorization: "Bear" + "er " + token } : {},
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not remove profile picture.");

      syncUpdatedUser(data.user);
      clearSelectedPicture();
      setPictureMessage(data.message);
    } catch (error) {
      setPictureError(error.message || "Could not remove profile picture.");
    } finally {
      setPictureLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      // 1. Fetch user claims
      const claimsRes = await fetch(apiUrl("/api/claims/my-claims"), {
        headers: authHeaders,
        credentials: "include",
      });
      if (claimsRes.ok) {
        const claimsData = await claimsRes.json();
        setClaims(Array.isArray(claimsData) ? claimsData : []);
      }

      // 2. Fetch user reported items
      const itemsRes = await fetch(apiUrl("/api/items/my-items"), {
        headers: authHeaders,
        credentials: "include",
      });
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(Array.isArray(itemsData) ? itemsData : []);
      }

      const recoveryRes = await fetch(apiUrl("/api/recovery/my-reports"), {
        headers: authHeaders,
        credentials: "include",
      });
      if (recoveryRes.ok) {
        const recoveryData = await recoveryRes.json();
        setRecoveryReports(Array.isArray(recoveryData) ? recoveryData : []);
        setRecoveryError("");
      } else {
        const recoveryData = await recoveryRes.json().catch(() => ({}));
        setRecoveryError(
          recoveryData.message || "Unable to load QR recovery requests.",
        );
      }
    } catch (err) {
      console.error("Error loading user dashboard:", err);
      setError("Unable to sync some dashboard records. Refresh to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRecoveryStatus = async (report, status) => {
    setRecoveryUpdateId(report._id);
    setRecoveryError("");
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        apiUrl(`/api/recovery/${report._id}/status`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ status }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not update this recovery request.");
      }
      setMessage(data.message);
      await fetchData();
    } catch (requestError) {
      setRecoveryError(
        requestError.message || "Could not update this recovery request.",
      );
    } finally {
      setRecoveryUpdateId("");
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [user, navigate, fetchData]);

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to remove this item report?")) return;

    setDeletingId(itemId);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/items/${itemId}`), {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete item.");

      setMessage("Item report deleted successfully.");
      setItems((prev) => prev.filter((it) => it._id !== itemId));
    } catch (err) {
      setError(err.message || "Could not delete item.");
    } finally {
      setDeletingId("");
    }
  };

  // Counts
  const pendingClaims = claims.filter((c) => c.status === "Pending").length;
  const approvedClaims = claims.filter((c) => c.status === "Approved" && c.item?.status !== "Resolved").length;
  const resolvedClaims = claims.filter((c) => c.item?.status === "Resolved" || c.status === "Resolved").length;
  const activeReportedItems = items.filter((i) => i.status === "Active").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {/* Profile / Header Banner */}
        <section className="relative overflow-hidden rounded-[26px] border border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/80 p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/40 backdrop-blur-xl">
          <div className="absolute top-0 right-0 -z-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -z-0 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-black text-white shadow-lg shadow-emerald-500/25">
                {picturePreview || user?.profilePicture ? (
                  <img
                    src={picturePreview || getProfilePictureUrl(user.profilePicture)}
                    alt={`${user?.name || "User"} profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.name ? user.name[0].toUpperCase() : "U"
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white md:text-3xl tracking-tight">
                    {user?.name || "Campus Student"}
                  </h1>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                    {user?.role || "student"}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {user?.email} • Track your claims, items, and physical handover passes
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                to="/lost"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all hover:-translate-y-0.5"
              >
                <Search className="h-4 w-4" />
                Browse & Filter Items
              </Link>
              <Link
                to="/report-lost"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 hover:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold shadow-md transition-all hover:-translate-y-0.5"
              >
                <PlusCircle className="h-4 w-4 text-emerald-400" />
                Report Lost
              </Link>
              <Link
                to="/report-found"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 transition-all hover:-translate-y-0.5"
              >
                <Sparkles className="h-4 w-4" />
                Report Found
              </Link>
            </div>
          </div>

          <div className="relative z-10 mt-6 border-t border-slate-200 dark:border-slate-800 pt-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Profile picture
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Choose a JPG, PNG, or WebP image up to 2 MB.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500">
                {user?.profilePicture ? "Change photo" : "Choose photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={handlePictureSelection}
                  className="sr-only"
                />
              </label>
              {selectedPicture && (
                <button
                  type="button"
                  onClick={handlePictureUpload}
                  disabled={pictureLoading}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {pictureLoading ? "Saving..." : "Save photo"}
                </button>
              )}
              {user?.profilePicture && (
                <button
                  type="button"
                  onClick={handlePictureRemoval}
                  disabled={pictureLoading}
                  className="rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-600 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
              {pictureError && (
                <p role="alert" className="w-full text-xs text-rose-600">{pictureError}</p>
              )}
              {pictureMessage && (
                <p role="status" className="w-full text-xs text-emerald-600">{pictureMessage}</p>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/50 p-4 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Handover Passes</span>
                <QrCode className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {approvedClaims}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ready for pickup</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/50 p-4 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Review</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
                {pendingClaims}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Awaiting verification</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/50 p-4 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">My Reports</span>
                <Package className="h-4 w-4 text-cyan-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-cyan-600 dark:text-cyan-400">
                {items.length}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{activeReportedItems} active</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/50 p-4 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Reunited Items</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-800 dark:text-white">
                {resolvedClaims}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Handover completed</p>
            </div>
          </div>
        </section>

        {/* Alerts */}
        {message && (
          <div role="status" className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600 dark:text-emerald-300">
            {message}
          </div>
        )}
        {error && (
          <div role="alert" className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-medium text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-8 flex border-b border-slate-200 dark:border-slate-800 gap-3 md:gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("claims")}
            className={`flex items-center gap-2 pb-3.5 text-sm font-bold transition-all relative ${
              activeTab === "claims"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FileCheck2 className="h-4 w-4" />
            My Claims & Handover Passes
            {approvedClaims > 0 && (
              <span className="ml-1.5 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {approvedClaims} Ready
              </span>
            )}
            {activeTab === "claims" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={`flex items-center gap-2 pb-3.5 text-sm font-bold transition-all relative ${
              activeTab === "items"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Package className="h-4 w-4" />
            My Reported Items ({items.length})
            {activeTab === "items" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("guide")}
            className={`flex items-center gap-2 pb-3.5 text-sm font-bold transition-all relative ${
              activeTab === "guide"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Handover Instructions & Stations
            {activeTab === "guide" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recovery")}
            className={`flex items-center gap-2 pb-3.5 text-sm font-bold transition-all relative ${
              activeTab === "recovery"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <QrCode className="h-4 w-4" />
            QR Recovery Requests ({recoveryReports.length})
            {activeTab === "recovery" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Tab 1: Claims & Handover Passes */}
        {activeTab === "claims" && (
          <section className="mt-6 space-y-5">
            {loading ? (
              <div className="py-12 text-center text-slate-500">Loading your claims...</div>
            ) : claims.length === 0 ? (
              <div className="rounded-[24px] border border-slate-200 dark:border-slate-800/90 bg-white/70 dark:bg-slate-900/60 p-10 text-center backdrop-blur-md">
                <FileCheck2 className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
                <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">No Claims Submitted Yet</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  If you lost an item and spot it in the Found section, submit a claim with your proof of ownership. Once verified, your digital Handover Pass will appear right here!
                </p>
                <Link
                  to="/found"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/40"
                >
                  Browse Found Items
                </Link>
              </div>
            ) : (
              claims.map((claim) => {
                const isApproved = claim.status === "Approved" && claim.item?.status !== "Resolved";
                const isResolved = claim.item?.status === "Resolved" || claim.status === "Resolved";
                const isPending = claim.status === "Pending";
                const isRejected = claim.status === "Rejected";

                return (
                  <article
                    key={claim._id}
                    className={`rounded-[24px] border p-6 transition-all shadow-xl backdrop-blur-xl ${
                      isApproved
                        ? "border-emerald-500/50 bg-gradient-to-b from-emerald-500/5 to-transparent dark:from-emerald-950/20 dark:border-emerald-500/40 bg-white dark:bg-slate-900/90 shadow-emerald-500/10"
                        : "border-slate-200 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 shadow-slate-200/50 dark:shadow-black/25"
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            <span data-no-translate>{claim.item?.title || "Item details unavailable"}</span>
                          </h3>
                          <span
                            className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                              isApproved
                                ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                                : isResolved
                                ? "border border-cyan-500/40 bg-cyan-500/15 text-cyan-600 dark:text-cyan-300"
                                : isRejected
                                ? "border border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-300"
                                : "border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300"
                            }`}
                          >
                            {isApproved ? "Approved • Ready for Pickup" : isResolved ? "Handover Completed" : claim.status}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>Category: <strong data-no-translate className="text-slate-700 dark:text-slate-300">{claim.item?.category || "N/A"}</strong></span>
                          <span>Found At: <strong data-no-translate className="text-slate-700 dark:text-slate-300">{claim.item?.location || "N/A"}</strong></span>
                          <span>Claimed On: <strong className="text-slate-700 dark:text-slate-300">{new Date(claim.createdAt).toLocaleDateString()}</strong></span>
                        </div>
                      </div>

                      {/* Claim Code Badge */}
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950/70 px-4 py-2 text-right">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Claim Code</p>
                          <p className="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                            {claim.claimCode || "CF-" + claim._id.substring(claim._id.length - 6).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stepper of Handover Lifecycle */}
                    <div className="mt-6 border-t border-slate-100 dark:border-slate-800/80 pt-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Handover Progression
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {/* Step 1 */}
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">1. Claim Submitted</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Proof received</p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className={`flex items-center gap-3 rounded-xl border p-3 ${
                          !isPending
                            ? isRejected
                              ? "border-rose-500/30 bg-rose-500/10"
                              : "border-emerald-500/30 bg-emerald-500/10"
                            : "border-amber-500/30 bg-amber-500/10"
                        }`}>
                          {isPending ? (
                            <Clock className="h-5 w-5 text-amber-500 shrink-0 animate-pulse" />
                          ) : isRejected ? (
                            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          )}
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">2. Dept. Authentication</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {isPending ? "Inspecting proof" : isRejected ? "Authentication failed" : "Authenticated & verified"}
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className={`flex items-center gap-3 rounded-xl border p-3 ${
                          isApproved || isResolved
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/30 opacity-60"
                        }`}>
                          <QrCode className={`h-5 w-5 shrink-0 ${isApproved || isResolved ? "text-emerald-500" : "text-slate-400"}`} />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">3. Handover Pass</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {isApproved ? "Ready for desk visit" : isResolved ? "Pass redeemed" : "Pending approval"}
                            </p>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className={`flex items-center gap-3 rounded-xl border p-3 ${
                          isResolved
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/30 opacity-60"
                        }`}>
                          <CheckCircle2 className={`h-5 w-5 shrink-0 ${isResolved ? "text-emerald-500" : "text-slate-400"}`} />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">4. Physical Handover</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {isResolved ? "Reunited with owner" : "At campus station"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Digital Handover Pass if Approved */}
                    {isApproved && (
                      <div className="mt-6 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 p-5 md:p-6 shadow-lg shadow-emerald-500/10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                              <ShieldCheck className="h-4 w-4" />
                              Official Campus Handover Pass
                            </div>
                            <h4 className="mt-2 text-lg font-black text-slate-900 dark:text-white">
                              Your Claim Is Approved! Please Collect Your Item.
                            </h4>
                            <p className="mt-1 text-xs md:text-sm text-slate-600 dark:text-slate-300">
                              Please visit the campus station with your <strong>Student ID</strong> and present this pass code:
                            </p>
                          </div>

                          <div className="text-center rounded-xl bg-white dark:bg-slate-900 p-4 border border-emerald-500/30 shadow-md">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Verification Code</p>
                            <p className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                              {claim.claimCode || "CF-" + claim._id.substring(claim._id.length - 6).toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 border-t border-emerald-500/20 pt-4 text-xs text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span>Pickup Location: <strong>{claim.pickupStation || "Campus Security Desk - Building B, Room 102"}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span>Station Hours: <strong>Mon - Fri • 9:00 AM - 5:00 PM</strong></span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Proof Details Accordion */}
                    <div className="mt-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Submitted Proof of Ownership:</span>
                      <p className="mt-1 text-slate-800 dark:text-slate-300 whitespace-pre-wrap">{claim.proofDescription}</p>
                    </div>

                    {/* Handover note if resolved */}
                    {isResolved && (
                      <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 text-xs text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-500" />
                        <span>
                          Handover completed on {claim.handoverDate ? new Date(claim.handoverDate).toLocaleString() : "record"}. {claim.handoverNotes || "Item was inspected and safely returned."}
                        </span>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>
        )}

        {/* Tab 2: My Reported Items */}
        {activeTab === "items" && (
          <section className="mt-6 space-y-4">
            {loading ? (
              <div className="py-12 text-center text-slate-500">Loading your items...</div>
            ) : items.length === 0 ? (
              <div className="rounded-[24px] border border-slate-200 dark:border-slate-800/90 bg-white/70 dark:bg-slate-900/60 p-10 text-center backdrop-blur-md">
                <Package className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
                <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">No Items Reported Yet</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Have you misplaced something or found an item on campus? Report it right away to activate the campus network.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <Link
                    to="/report-lost"
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-emerald-500"
                  >
                    Report Lost
                  </Link>
                  <Link
                    to="/report-found"
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/40"
                  >
                    Report Found
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/80 p-5 shadow-lg shadow-slate-200/50 dark:shadow-black/20 backdrop-blur-xl transition-all hover:border-emerald-500/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              item.type === "Lost"
                                ? "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                                : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                            }`}
                          >
                            {item.type}
                          </span>
                          <span className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-2.5 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            Status: {item.status}
                          </span>
                        </div>
                        <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                          <span data-no-translate>{item.title}</span>
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item._id)}
                        disabled={deletingId === item._id}
                        title="Delete this report"
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <p>Category: <strong data-no-translate className="text-slate-700 dark:text-slate-300">{item.category}</strong></p>
                      <p>Location: <strong data-no-translate className="text-slate-700 dark:text-slate-300">{item.location}</strong></p>
                      <p>Date: <strong className="text-slate-700 dark:text-slate-300">{item.date}</strong></p>
                    </div>

                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                      <span data-no-translate>{item.description}</span>
                    </p>

                    {item.foundLocation && (
                      <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                        <p className="font-bold">Finder Update:</p>
                        <p>Found at: {item.foundLocation} on {item.foundDate}</p>
                        <p>Finder contact: {item.foundContact}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "recovery" && (
          <section className="mt-6 space-y-4">
            {recoveryError && (
              <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400">
                {recoveryError}
              </p>
            )}
            {loading ? (
              <div className="py-12 text-center text-slate-500">
                Loading QR recovery requests...
              </div>
            ) : recoveryReports.length === 0 ? (
              <div className="rounded-[24px] border border-slate-200 bg-white/70 p-10 text-center dark:border-slate-800 dark:bg-slate-900/60">
                <QrCode className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
                <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                  No QR Recovery Requests
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  When someone scans the QR code on one of your lost-item reports,
                  their recovery details will appear here.
                </p>
              </div>
            ) : (
              recoveryReports.map((report) => (
                <article
                  key={report._id}
                  className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        {report.itemId?.title || "Lost item"}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        Finder: {report.finderName}
                      </h3>
                    </div>
                    <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                      {report.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                    <p>Email: <a className="text-emerald-700 underline dark:text-emerald-300" href={`mailto:${report.finderEmail}`}>{report.finderEmail}</a></p>
                    <p>Phone: {report.finderPhone || "Not provided"}</p>
                    <p>Found at: {report.foundLocation}</p>
                    <p>Found date: {new Date(report.foundDate).toLocaleDateString()}</p>
                    <p>Submitted: {new Date(report.createdAt).toLocaleString()}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRecoveryId((current) =>
                        current === report._id ? "" : report._id,
                      )
                    }
                    className="mt-3 text-sm font-semibold text-emerald-700 underline dark:text-emerald-300"
                  >
                    {expandedRecoveryId === report._id ? "Hide details" : "View details"}
                  </button>
                  {expandedRecoveryId === report._id && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
                      <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {report.description}
                      </p>
                      {report.imageUrl && (
                        <img
                          src={getItemImageUrl(report.imageUrl)}
                          alt={`Finder image for ${report.itemId?.title || "recovered item"}`}
                          className="mt-3 max-h-64 rounded-xl object-contain"
                        />
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {report.status === "Pending" && (
                      <>
                        <button
                          type="button"
                          disabled={recoveryUpdateId === report._id}
                          onClick={() => handleRecoveryStatus(report, "Accepted")}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          Accept Request
                        </button>
                        <button
                          type="button"
                          disabled={recoveryUpdateId === report._id}
                          onClick={() => handleRecoveryStatus(report, "Rejected")}
                          className="rounded-xl border border-rose-500/40 px-4 py-2 text-xs font-bold text-rose-600 disabled:opacity-50 dark:text-rose-300"
                        >
                          Reject Request
                        </button>
                      </>
                    )}
                    {report.status === "Accepted" && (
                      <button
                        type="button"
                        disabled={recoveryUpdateId === report._id}
                        onClick={() => {
                          if (window.confirm("Confirm that you received this item?")) {
                            handleRecoveryStatus(report, "Completed");
                          }
                        }}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Confirm Item Received
                      </button>
                    )}
                    {recoveryUpdateId === report._id && (
                      <span role="status" className="self-center text-xs text-slate-500">
                        Updating...
                      </span>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {/* Tab 3: Handover Instructions & Stations */}
        {activeTab === "guide" && (
          <section className="mt-6 space-y-6">
            <div className="rounded-[24px] border border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/80 p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/25 backdrop-blur-xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Campus Handover Protocol: Step-by-Step
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                How items move from discovery to safe return at the University Station.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-black text-emerald-600 dark:text-emerald-400">
                    1
                  </span>
                  <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Report & Log</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Finder deposits the item at the Campus Station or reports it online. The item is labeled with a secure tracking ID.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-black text-emerald-600 dark:text-emerald-400">
                    2
                  </span>
                  <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Ownership Proof</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Owner submits a claim with specific identifiers (lock screen, markings, serials, internal contents) not shown publicly.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-black text-emerald-600 dark:text-emerald-400">
                    3
                  </span>
                  <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Pass Generation</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Station Admin reviews the claim. Once verified, a digital Handover Pass with a unique verification code is issued.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-black text-emerald-600 dark:text-emerald-400">
                    4
                  </span>
                  <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Physical Handover</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Owner visits the Campus Station with their Student ID Card, collects their item, and the handover is logged as Resolved.
                  </p>
                </div>
              </div>

              {/* Station Info Card */}
              <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/15 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Primary Campus Handover Station
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Campus Central Security Desk • Building B, Room 102 (Opposite Main Library)
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>🕒 Mon – Fri: 9:00 AM – 5:00 PM</span>
                      <span>📞 Extension: +1 (555) 019-2831</span>
                      <span>📧 help@campusfind.edu</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
