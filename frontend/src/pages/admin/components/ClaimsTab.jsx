import React from "react";
import {
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  UserCheck,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Tag,
  FileCheck2,
} from "lucide-react";

const ClaimsTab = ({
  filteredClaims,
  claimSearch,
  setClaimSearch,
  claimStatusFilter,
  setClaimStatusFilter,
  loading,
  processingId,
  onOpenVerifyModal,
  onOpenHandoverModal,
  onOpenRejectModal,
}) => {
  return (
    <section className="mt-6 space-y-4">
      {/* Search and filter bar for claims */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search claims by Claim Code, Student Name, Item..."
            value={claimSearch}
            onChange={(e) => setClaimSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={claimStatusFilter}
            onChange={(e) => setClaimStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="All">All Claim Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Approved">Approved (Awaiting Pickup)</option>
            <option value="Resolved">Handed Over (Resolved)</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading claims...</div>
      ) : filteredClaims.length === 0 ? (
        <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-10 text-center text-slate-400">
          No claim records match your search criteria.
        </div>
      ) : (
        filteredClaims.map((claim) => {
          const isApproved =
            claim.status === "Approved" && claim.item?.status !== "Resolved";
          const isResolved =
            claim.status === "Resolved" || claim.item?.status === "Resolved";
          const isPending = claim.status === "Pending";
          const isRejected = claim.status === "Rejected";

          return (
            <article
              key={claim._id}
              className={`rounded-[24px] border p-6 transition-all shadow-md backdrop-blur-xl ${
                isApproved
                  ? "border-emerald-500/40 bg-white dark:bg-slate-900/90"
                  : isResolved
                  ? "border-cyan-500/30 bg-white/80 dark:bg-slate-900/80"
                  : isRejected
                  ? "border-rose-500/30 bg-white/80 dark:bg-slate-900/80"
                  : "border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      <span data-no-translate>{claim.item?.title || "Item details unavailable"}</span>
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isPending
                          ? "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                          : isApproved
                          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                          : isResolved
                          ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"
                          : "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                      }`}
                    >
                      {isPending
                        ? "🛡️ Authentication Required • Dept Review"
                        : isApproved
                        ? "✅ Authenticated • Digital Pass Issued"
                        : isResolved
                        ? "🎉 Handed Over & Reunited"
                        : "❌ Claim Rejected"}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      Code: {claim.claimCode || "N/A"}
                    </span>
                    {claim.item?.category && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        <span data-no-translate>{claim.item.category}</span>
                      </span>
                    )}
                    {claim.item?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        Found at: <span data-no-translate>{claim.item.location}</span>
                      </span>
                    )}
                    {claim.createdAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Submitted: {new Date(claim.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Handover Station Badge if approved */}
                {isApproved && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-right text-xs">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                      Pickup Station
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {claim.pickupStation || "Campus Security Desk"}
                    </span>
                  </div>
                )}
              </div>

              {/* Side by side: Claimant Details & Submitted Proof Markers */}
              <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/50 p-4 sm:grid-cols-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Claimant Credentials
                  </h4>
                  <div className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">
                    <p>
                      <strong>Name:</strong> <span data-no-translate>{claim.studentName}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <strong>Contact:</strong> <span data-no-translate>{claim.contact}</span>
                    </p>
                    {claim.studentEmail && (
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <strong>Email:</strong> <span data-no-translate>{claim.studentEmail}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                    Submitted Ownership Proof & Unique Identifiers
                  </h4>
                  <div className="mt-2 rounded-xl bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {claim.proofDescription}
                  </div>
                </div>
              </div>

              {/* Handover & Resolution Notes if existing */}
              {claim.notes && (
                <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-200">
                  <strong>Officer Notes / Instructions:</strong> {claim.notes}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenRejectModal(claim)}
                      disabled={Boolean(processingId)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject Claim
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenVerifyModal(claim)}
                      disabled={Boolean(processingId)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:from-amber-400 hover:to-emerald-500 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Authenticate Ownership & Issue Pass
                    </button>
                  </>
                )}

                {isApproved && (
                  <button
                    type="button"
                    onClick={() => onOpenHandoverModal(claim)}
                    disabled={Boolean(processingId)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer"
                  >
                    <UserCheck className="h-4 w-4" />
                    Execute Physical Handover & Mark Returned
                  </button>
                )}

                {isResolved && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Resolution logged: Item reunited with owner.
                  </span>
                )}
              </div>
            </article>
          );
        })
      )}
    </section>
  );
};

export default ClaimsTab;
