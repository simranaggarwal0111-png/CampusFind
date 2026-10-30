import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Search,
  MapPin,
  Calendar,
  Tag,
  X,
  CheckCircle,
  QrCode,
  Sparkles,
} from "lucide-react";
import RecoveryQrModal from "../components/RecoveryQrModal";
import { apiUrl } from "../utils/api";

const Lost = () => {
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [searchParams] = useSearchParams();

  // Search and filter values
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("");

  // Found report form
  const [selectedItem, setSelectedItem] = useState(null);

  const [foundData, setFoundData] = useState({
    foundLocation: "",
    foundDate: "",
    foundDescription: "",
    foundContact: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recoveryQr, setRecoveryQr] = useState(null);
  const [recoveryQrLoadingId, setRecoveryQrLoadingId] = useState("");
  const [recoveryQrError, setRecoveryQrError] = useState("");

  const handleShowRecoveryQr = async (item) => {
    setRecoveryQrLoadingId(item._id);
    setRecoveryQrError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        apiUrl(`/api/items/${item._id}/recovery-qr`),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not load this recovery QR code.");
      }
      setRecoveryQr({ item, ...data });
    } catch (requestError) {
      setRecoveryQrError(
        requestError.message || "Could not load this recovery QR code.",
      );
    } finally {
      setRecoveryQrLoadingId("");
    }
  };

  // Get lost items from the backend
  const fetchLostItems = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/api/items?type=Lost"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch lost items");
      }

      const data = await response.json();

      // Show only active lost items
      setItems(
        data.filter(
          (item) => item.type === "Lost" && item.status === "Active"
        )
      );
    } catch (err) {
      console.error(err);
      setError("Unable to load lost items from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLostItems();
  }, []);

  useEffect(() => {
    const foundItemId = routeLocation.state?.foundItemId;
    if (!foundItemId || loading) return;

    const itemToReport = items.find((item) => item._id === foundItemId);
    if (!itemToReport) return;

    setSelectedItem(itemToReport);
    setError("");
    setSuccess("");
    navigate(`${routeLocation.pathname}${routeLocation.search}`, {
      replace: true,
      state: null,
    });
  }, [items, loading, routeLocation, navigate]);

  // Search and filter items
  const filteredItems = items.filter((item) => {
    const searchText = search.toLowerCase().trim();
    const locationText = location.toLowerCase().trim();

    const matchesSearch = [
      item.title,
      item.description,
      item.category,
      item.location,
      item.date,
    ].some((value) => value?.toLowerCase().includes(searchText));

    const matchesCategory =
      category === "All" || item.category === category;

    const matchesLocation =
      !locationText || item.location?.toLowerCase().includes(locationText);

    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Update the found report form
  const handleFoundChange = (e) => {
    setFoundData({
      ...foundData,
      [e.target.name]: e.target.value,
    });
  };

  // Submit a found report
  const handleFoundSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        apiUrl(`/api/items/${selectedItem._id}/found`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(foundData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit found report");
      }

      setSuccess("Thank you! The item has been marked as found and handover coordination has begun.");

      // Remove the item from the active lost list
      setItems((previousItems) =>
        previousItems.filter((item) => item._id !== selectedItem._id)
      );

      // Clear the form
      setFoundData({
        foundLocation: "",
        foundDate: "",
        foundDescription: "",
        foundContact: "",
      });

      setTimeout(() => {
        setSelectedItem(null);
        setSuccess("");
      }, 1800);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {/* Page heading */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
              <Sparkles className="h-3.5 w-3.5" />
              Community Search Active
            </div>
            {recoveryQrError && (
              <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                {recoveryQrError}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
              Reported Lost Items
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Browse items misplaced around campus. If you find one, click "I Found This" to trigger safe handover.
            </p>
          </div>

          <Link
            to="/report-lost"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-950/30 transition-all hover:from-emerald-500 hover:to-teal-500 hover:-translate-y-0.5 md:mt-0"
          >
            + Report Lost Item
          </Link>
        </div>

        {/* Search and filters */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search lost items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-emerald-500 shadow-sm"
            />
          </div>

          {/* Category dropdown */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none shadow-sm"
          >
            <option value="All">All Categories</option>
            <option value="Bags">Bags</option>
            <option value="Books">Books</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Accessories">Accessories</option>
            <option value="Documents">Documents</option>
            <option value="Keys">Keys</option>
            <option value="Other">Other</option>
          </select>

          {/* Location filter */}
          <div className="relative flex-1">
            <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-emerald-500 shadow-sm"
            />
          </div>
        </div>

        {/* Loading message */}
        {loading && (
          <p className="mt-8 text-center text-xs text-slate-500">
            Loading lost items...
          </p>
        )}

        {/* Error message */}
        {error && !selectedItem && (
          <p className="mt-6 text-xs text-rose-500">{error}</p>
        )}

        {/* No results message */}
        {!loading && !error && filteredItems.length === 0 && (
          <div className="mt-8 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-10 text-center">
            <p className="font-bold text-slate-800 dark:text-slate-200">
              No active lost items found.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Try another search keyword, category, or location.
            </p>
          </div>
        )}

        {/* Lost item cards */}
        {!loading && filteredItems.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                className="cursor-pointer rounded-[22px] border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/80 p-5 shadow-lg shadow-slate-200/40 dark:shadow-black/20 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-300">
                    Lost
                  </span>

                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Tag className="h-3.5 w-3.5" />
                    <span data-no-translate>{item.category}</span>
                  </span>
                </div>

                <h3 data-no-translate className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <Link
                  to={`/items/${item._id}`}
                  className="mt-1 inline-flex text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                >
                  View full details
                </Link>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  <span data-no-translate>{item.description}</span>
                </p>

                <div className="mt-4 space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                    <span data-no-translate>{item.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                    <span data-no-translate>{item.date}</span>
                  </div>
                </div>

                {item.isOwner && item.qrCodeEnabled && (
                  <button
                    type="button"
                    onClick={() => handleShowRecoveryQr(item)}
                    disabled={recoveryQrLoadingId === item._id}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-300"
                  >
                    <QrCode className="h-4 w-4" />
                    {recoveryQrLoadingId === item._id ? "Loading QR..." : "Show Recovery QR"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(item);
                    setError("");
                    setSuccess("");
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-950/30 transition-all hover:from-emerald-500 hover:to-teal-500"
                >
                  <CheckCircle className="h-4 w-4" />
                  I Found This Item
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Found report modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[26px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Found Item Report
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Provide details to coordinate safe handover with the owner.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedItem(null);
                  setError("");
                  setSuccess("");
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Target Lost Item
              </span>
              <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                {selectedItem.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Last reported location: {selectedItem.location} • Date: {selectedItem.date}
              </p>
            </div>

            <form onSubmit={handleFoundSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Where did you spot / find it?
                </label>
                <input
                  type="text"
                  name="foundLocation"
                  value={foundData.foundLocation}
                  onChange={handleFoundChange}
                  required
                  placeholder="e.g. Science Library Room 204 or Campus Desk"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  When did you find it?
                </label>
                <input
                  type="date"
                  name="foundDate"
                  value={foundData.foundDate}
                  onChange={handleFoundChange}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Describe how/where it is kept for handover
                </label>
                <textarea
                  name="foundDescription"
                  value={foundData.foundDescription}
                  onChange={handleFoundChange}
                  required
                  rows={3}
                  placeholder="e.g. Deposited at Central Security Desk (Room 102) or kept with desk proctor..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Your Contact Information
                </label>
                <input
                  type="text"
                  name="foundContact"
                  value={foundData.foundContact}
                  onChange={handleFoundChange}
                  required
                  placeholder="Phone or campus email"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}
              {recoveryQr && (
                <RecoveryQrModal
                  item={recoveryQr.item}
                  qrCodeDataUrl={recoveryQr.qrCodeDataUrl}
                  recoveryUrl={recoveryQr.recoveryUrl}
                  onClose={() => setRecoveryQr(null)}
                />
              )}

              {success && (
                <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Found Report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lost;
