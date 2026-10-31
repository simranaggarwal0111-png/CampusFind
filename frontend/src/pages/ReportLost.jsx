import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { Send, MapPin, Calendar, Tag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import ItemMatchSuggestions from "../components/ItemMatchSuggestions";
import { apiUrl, getItemImageUrl } from "../utils/api";

const ReportLost = () => {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();

  const initialFormData = {
    title: "",
    category: "Bags",
    color: "",
    brand: "",
    location: "",
    date: "",
    description: "",
    contact: user?.email || "",
    imageUrl: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [matches, setMatches] = useState([]);
  const [matchingWarning, setMatchingWarning] = useState("");

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Please choose an image smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    setError("");
    try {
      const uploadData = new FormData();
      uploadData.append("image", file);
      const res = await fetch(apiUrl("/api/items/upload-image"), {
        method: "POST",
        credentials: "include",
        body: uploadData,
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setFormData((previous) => ({
          ...previous,
          imageUrl: data.imageUrl,
        }));
        return;
      }
    } catch {
      // Fallback to local data URL if upload fails
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((previous) => ({
        ...previous,
        imageUrl: reader.result,
      }));
    };
    reader.onerror = () => setError("Could not read the selected image.");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");
    setMatches([]);
    setMatchingWarning("");

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl("/api/items"), {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          type: "Lost",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit report");
      }

      setFormData(initialFormData);
      setMessage(
        data.message || "Lost item reported successfully! Track it under My Activity.",
      );
      setMatches(data.matches || []);
      setMatchingWarning(data.matchingWarning || "");
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        <Link
          to="/lost"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-500 mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Lost Catalog
        </Link>

        <div className="relative overflow-hidden rounded-[26px] border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/80 p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/40 backdrop-blur-2xl">
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Report a Lost Item
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Provide details about the item you misplaced on campus so community finders and campus staff can notify you.
            </p>
          </div>

          {/* Success Message */}
          {message && (
            <div
              role="status"
              className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center justify-between"
            >
              <span>{message}</span>
              <Link to="/my-activity" className="font-bold underline ml-2">
                View My Items
              </Link>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400"
            >
              {error}
            </div>
          )}

          {matchingWarning && (
            <p
              role="status"
              className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300"
            >
              {matchingWarning}
            </p>
          )}

          <form onSubmit={handleSubmit} className="relative mt-6 space-y-4 text-xs">
            {/* Item Title */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px] mb-1">
                Item Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Blue HP Laptop Bag with Charger"
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px] mb-1">
                  Color (Optional)
                </label>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="e.g., navy blue"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px] mb-1">
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="e.g., HP"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Category and Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px] mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                >
                  <option value="Bags">Bags</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Documents">Documents</option>
                  <option value="Keys">Keys</option>
                  <option value="Books">Books</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px] mb-1">
                  Date Lost
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px] mb-1">
                Last Known Location
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Campus Central Library 2nd Floor or Cafeteria"
                value={formData.location}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px] mb-1">
                Item Description
              </label>
              <textarea
                required
                rows={4}
                placeholder="Color, brand, keychains, distinguishing stickers or tags..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Optional item photo */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px] mb-1">
                Item Photo (Optional)
              </label>
              <input
                type="url"
                placeholder="Paste an image URL"
                value={formData.imageUrl.startsWith("data:image/") ? "" : formData.imageUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    imageUrl: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
              <p className="my-2 text-center text-[10px] text-slate-400">or choose a file (max 3 MB)</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-700 dark:text-slate-300 dark:file:text-emerald-300"
              />
              {formData.imageUrl && (
                <img
                  src={getItemImageUrl(formData.imageUrl)}
                  alt="Selected item"
                  className="mt-3 h-32 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                />
              )}
            </div>

            {/* Contact */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[10px] mb-1">
                Your Contact Information
              </label>
              <input
                type="text"
                required
                placeholder="Phone number or campus email"
                value={formData.contact}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {loading ? "Broadcasting Report..." : "Submit Lost Report"}
            </button>
          </form>
        </div>

        {message && (
          <ItemMatchSuggestions
            matches={matches}
            emptyMessage="No similar found reports are available yet. We’ll keep checking as new reports arrive."
          />
        )}
      </div>
    </div>
  );
};

export default ReportLost;