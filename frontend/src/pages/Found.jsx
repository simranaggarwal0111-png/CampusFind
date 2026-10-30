import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Search,
  MapPin,
  Calendar,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { apiUrl } from "../utils/api";

const Found = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [category, setCategory] = useState("All");

  const [selectedItem, setSelectedItem] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [contact, setContact] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [proofDescription, setProofDescription] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccessData, setClaimSuccessData] = useState(null);
  const [claimNotificationSent, setClaimNotificationSent] = useState(false);
  const [claimError, setClaimError] = useState("");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();

  // Fetch found items
  useEffect(() => {
    const fetchFoundItems = async () => {
      try {
        const [foundResponse, lostResponse] = await Promise.all([
          fetch(apiUrl("/api/items?type=Found")),
          fetch(apiUrl("/api/items?type=Lost")),
        ]);

        if (!foundResponse.ok || !lostResponse.ok) {
          throw new Error("Failed to fetch found items");
        }

        const [foundItems, lostItems] = await Promise.all([
          foundResponse.json(),
          lostResponse.json(),
        ]);
        const matchedLostItems = Array.isArray(lostItems)
          ? lostItems.filter((item) =>
              ["Found", "Claimed", "Resolved"].includes(item.status)
            )
          : [];
        setItems([
          ...(Array.isArray(foundItems) ? foundItems : []),
          ...matchedLostItems,
        ]);
      } catch (err) {
        console.error(err);
        setError("Unable to load found items from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchFoundItems();
  }, []);

  // Open claim form
  const handleOpenClaim = useCallback((item) => {
    setSelectedItem(item);
    setStudentName(user?.name || "");
    setContact("");
    setStudentEmail(user?.email || "");
    setProofDescription("");
    setClaimSuccessData(null);
    setClaimNotificationSent(false);
    setClaimError("");
  }, [user?.name, user?.email]);

  useEffect(() => {
    const claimItemId = location.state?.claimItemId;
    if (!claimItemId || loading) return;

    const itemToClaim = items.find((item) => item._id === claimItemId);
    if (!itemToClaim) return;

    handleOpenClaim(itemToClaim);
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [items, loading, location, navigate, handleOpenClaim]);

  // Submit claim to backend
  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setClaimLoading(true);
    setClaimSuccessData(null);
    setClaimError("");

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl("/api/claims"), {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          itemId: selectedItem._id,
          studentName,
          contact,
          studentEmail,
          proofDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit claim.");
      }

      setClaimSuccessData(data.claim);
      setClaimNotificationSent(data.notificationSent === true);
    } catch (err) {
      console.error(err);
      setClaimError(err.message || "Something went wrong.");
    } finally {
      setClaimLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q);

    const matchesCategory = category === "All" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              Campus Custody Catalog
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
              Found Items Awaiting Claim
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Discovered items waiting to be claimed by their rightful owners through our verified handover protocol.
            </p>
          </div>

          <Link
            to="/report-found"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-950/30 hover:from-emerald-500 hover:to-teal-500 transition-all hover:-translate-y-0.5"
          >
            Report An Item You Found
          </Link>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="flex flex-1 items-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-3.5 py-2.5 text-xs shadow-sm">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by title, location, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-2 w-full bg-transparent text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none shadow-sm"
          >
            <option value="All">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Bags">Bags</option>
            <option value="ID Cards">ID Cards</option>
            <option value="Books">Books</option>
            <option value="Clothing">Clothing</option>
            <option value="Keys">Keys</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <p className="mt-8 text-center text-xs text-slate-500">Loading found items...</p>
        )}

        {error && (
          <div role="alert" className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredItems.length === 0 && (
          <div className="mt-8 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-10 text-center">
            <p className="font-bold text-slate-800 dark:text-slate-200">No found items match your criteria.</p>
            <p className="mt-1 text-xs text-slate-400">Check back later or search for other items.</p>
          </div>
        )}

        {/* Item Cards */}
        <div className="mt-6 space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              role="link"
              tabIndex={0}
              aria-label={`View details for ${item.title}`}
              onClick={(event) => {
                if (!event.target.closest("a, button")) {
                  navigate(`/items/${item._id}`);
                }
              }}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  navigate(`/items/${item._id}`);
                }
              }}
              className="cursor-pointer rounded-[22px] border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/80 p-5 shadow-lg shadow-slate-200/40 dark:shadow-black/20 backdrop-blur-xl transition-all hover:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                    📦
                  </span>
                  <div>
                    <h2 data-no-translate className="text-lg font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h2>
                    <Link
                      to={`/items/${item._id}`}
                      className="mt-1 inline-flex text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                    >
                      View full details
                    </Link>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>Category: <strong data-no-translate className="text-slate-700 dark:text-slate-300">{item.category}</strong></span>
                      <span>Location: <strong data-no-translate className="text-slate-700 dark:text-slate-300">{item.location}</strong></span>
                      <span>Date: <strong data-no-translate className="text-slate-700 dark:text-slate-300">{item.date}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                      item.status === "Claimed"
                        ? "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                        : item.status === "Resolved"
                        ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"
                        : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                    }`}
                  >
                    {item.status === "Resolved" ? "Handed Over" : item.status === "Claimed" ? "Claimed • Ready for Pickup" : "Available to Claim"}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs md:text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 pt-3 leading-relaxed">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Description:</span> <span data-no-translate>{item.description}</span>
              </p>

              {item.status !== "Claimed" && item.status !== "Resolved" ? (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenClaim(item)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/30 hover:from-emerald-500 hover:to-teal-500 transition-all hover:-translate-y-0.5"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Claim This Item & Request Handover
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-xs font-medium text-slate-400 italic">
                  This item has already been matched and is undergoing handover.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Claim Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-lg rounded-[26px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Ownership Claim</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Claim: <span data-no-translate>{selectedItem.title}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            {claimSuccessData ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                  <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                    Claim Submitted Successfully!
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {claimNotificationSent
                      ? "Your claim has been logged and the admin has been notified."
                      : "Your claim has been saved, but the admin email could not be sent. Please contact the campus administrator."}
                  </p>

                  <div className="mt-4 rounded-xl bg-white dark:bg-slate-950 p-3 border border-emerald-500/30">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Your Handover Tracking Pass Code</p>
                    <p className="font-mono text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {claimSuccessData.claimCode}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Close
                  </button>
                  <Link
                    to="/my-activity"
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/40"
                  >
                    View in My Activity
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitClaim} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter your student name"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Campus Email
                    </label>
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="student@campus.edu"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Proof of Ownership & Unique Identifier
                  </label>
                  <textarea
                    rows={4}
                    required
                    minLength={5}
                    value={proofDescription}
                    onChange={(e) => setProofDescription(e.target.value)}
                    placeholder="Describe distinct markings, serial numbers, screen wallpaper, internal keychain, or specific contents to help staff verify that this item belongs to you..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Note: This proof will be reviewed privately by the Campus Station desk officer.
                  </p>
                </div>

                {claimError && (
                  <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
                    {claimError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    disabled={claimLoading}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimLoading}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
                  >
                    {claimLoading ? "Submitting Claim..." : "Submit Claim For Handover"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Found;
