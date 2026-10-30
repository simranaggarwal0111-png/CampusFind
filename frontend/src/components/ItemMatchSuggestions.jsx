import React from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Tag } from "lucide-react";
import { getItemImageUrl } from "../utils/api";

const ItemMatchSuggestions = ({
  matches = [],
  loading = false,
  error = "",
  emptyMessage = "No possible matches found yet. We’ll keep checking as new reports arrive.",
}) => (
  <section className="mt-8">
    <div className="mb-4">
      <h2 className="text-xl font-black text-slate-900 dark:text-white">
        Possible matches
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Similar reports are ranked using item details, location, and date.
      </p>
    </div>

    {loading && (
      <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        Checking for similar reports...
      </p>
    )}

    {error && (
      <p
        role="alert"
        className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-300"
      >
        {error}
      </p>
    )}

    {!loading && !error && matches.length === 0 && (
      <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        {emptyMessage}
      </p>
    )}

    {!loading && matches.length > 0 && (
      <div className="grid gap-4 sm:grid-cols-2">
        {matches.map((match) => (
          <article
            key={match._id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            {match.imageUrl ? (
              <img
                src={getItemImageUrl(match.imageUrl)}
                alt={match.title}
                className="h-40 w-full bg-slate-100 object-cover dark:bg-slate-950"
              />
            ) : (
              <div className="flex h-40 items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-slate-950">
                No photo available
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 data-no-translate className="font-bold text-slate-900 dark:text-white">
                  {match.title}
                </h3>
                <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {match.matchPercentage}% match
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <p className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-emerald-500" />
                  <span data-no-translate>
                    {match.category}
                    {match.color ? ` · ${match.color}` : ""}
                    {match.brand ? ` · ${match.brand}` : ""}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  <span data-no-translate>{match.location}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                  <span data-no-translate>{match.date}</span>
                </p>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <span data-no-translate>{match.description}</span>
              </p>
              <Link
                to={`/items/${match._id}`}
                className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
              >
                View Details
              </Link>
            </div>
          </article>
        ))}
      </div>
    )}
  </section>
);

export default ItemMatchSuggestions;
