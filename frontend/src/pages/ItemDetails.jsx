import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ArrowLeft, Calendar, MapPin, Tag } from "lucide-react";
import ItemMatchSuggestions from "../components/ItemMatchSuggestions";
import { apiUrl, getItemImageUrl } from "../utils/api";

const ItemDetails = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState("");

  useEffect(() => {
    const loadItem = async () => {
      setLoading(true);
      setError("");
      setMatches([]);
      setMatchesError("");
      setMatchesLoading(true);

      try {
        const response = await fetch(apiUrl(`/api/items/${id}`));
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Could not load this item.");
        }
        if (["Claimed", "Resolved"].includes(data.status)) {
          setMatchesLoading(false);
        }
        setItem(data);
      } catch (loadError) {
        setError(loadError.message || "Could not load this item.");
        setMatchesLoading(false);
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id]);

  useEffect(() => {
    if (!item) return undefined;
    if (["Claimed", "Resolved"].includes(item.status)) return undefined;

    const controller = new AbortController();
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const loadMatches = async () => {
      try {
        const response = await fetch(
          apiUrl(`/api/items/${item._id}/matches`),
          {
            credentials: "include",
            headers,
            signal: controller.signal,
          },
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Could not load possible matches.");
        }
        setMatches(data.matches || []);
      } catch (matchError) {
        if (matchError.name !== "AbortError") {
          setMatchesError(
            matchError.message || "Could not load possible matches.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setMatchesLoading(false);
      }
    };

    loadMatches();
    return () => controller.abort();
  }, [item]);

  const isClaimable =
    item?.type === "Found" ||
    (item?.type === "Lost" && item?.status === "Found");
  const isAvailable = !["Claimed", "Resolved"].includes(item?.status);
  const actionPath = isClaimable ? "/found" : "/lost";
  const actionLabel = isClaimable ? "Continue to claim item" : "I found this item";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#080d1a] dark:text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <Link
          to={isClaimable ? "/found" : "/lost"}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to items
        </Link>

        {loading && (
          <p className="mt-8 text-center text-sm text-slate-500">Loading item details...</p>
        )}

        {!loading && error && (
          <div role="alert" className="mt-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-600">
            {error}
          </div>
        )}

        {!loading && item && (
          <article className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {item.imageUrl && (
              <img
                src={getItemImageUrl(item.imageUrl)}
                alt={item.title}
                className="max-h-[480px] w-full bg-slate-100 object-contain dark:bg-slate-950"
              />
            )}

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    item.type === "Lost"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                  }`}
                >
                  {item.type}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {item.status}
                </span>
              </div>

              <h1 data-no-translate className="mt-4 text-3xl font-black text-slate-900 dark:text-white">
                {item.title}
              </h1>

              <div className="mt-5 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                <p className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-emerald-500" />
                  <span data-no-translate>{item.category}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  <span data-no-translate>{item.location}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  <span data-no-translate>{item.date}</span>
                </p>
              </div>

              {(item.color || item.brand) && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {item.color && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                      Color: <span data-no-translate>{item.color}</span>
                    </span>
                  )}
                  {item.brand && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                      Brand: <span data-no-translate>{item.brand}</span>
                    </span>
                  )}
                </div>
              )}

              <section className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Description
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {item.description ? (
                    <span data-no-translate>{item.description}</span>
                  ) : (
                    "No description provided."
                  )}
                </p>
              </section>

              {isAvailable ? (
                <Link
                  to={`${actionPath}?search=${encodeURIComponent(item.title)}`}
                  state={
                    isClaimable
                      ? { claimItemId: item._id }
                      : { foundItemId: item._id }
                  }
                  className="mt-7 inline-flex rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500"
                >
                  {actionLabel}
                </Link>
              ) : (
                <p className="mt-7 text-sm font-semibold text-slate-500">
                  This item is no longer available for a new request.
                </p>
              )}
            </div>
          </article>
        )}

        {!loading && item && (
          <ItemMatchSuggestions
            matches={matches}
            loading={matchesLoading}
            error={matchesError}
            emptyMessage="No similar reports are available yet. Check back when new lost or found items are reported."
          />
        )}
      </main>
    </div>
  );
};

export default ItemDetails;
