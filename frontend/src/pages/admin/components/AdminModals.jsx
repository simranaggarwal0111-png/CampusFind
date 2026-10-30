import React from "react";
import {
  ShieldCheck,
  Check,
  UserCheck,
  XCircle,
  Edit3,
} from "lucide-react";

const AdminModals = ({
  // Verification Modal
  verifyModalClaim,
  setVerifyModalClaim,
  verifyPickupStation,
  setVerifyPickupStation,
  verifyNotes,
  setVerifyNotes,
  checklist,
  setChecklist,
  onVerifySubmit,

  // Handover Modal
  handoverModalClaim,
  setHandoverModalClaim,
  handoverNotes,
  setHandoverNotes,
  onExecuteHandover,

  // Rejection Modal
  rejectModalClaim,
  setRejectModalClaim,
  rejectNotes,
  setRejectNotes,
  onRejectSubmit,

  // Edit Item Modal
  editingItem,
  setEditingItem,
  editFormData,
  setEditFormData,
  onSaveItemEdit,

  processingId,
}) => {
  return (
    <>
      {/* 1. Department Verification & Handover Pass Issuance Modal */}
      {verifyModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl rounded-[26px] border border-amber-500/40 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Lost & Found Department Ownership Verification
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Authenticate proof markers against item custody before activating the digital handover pass.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifyModalClaim(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={onVerifySubmit} className="mt-4 space-y-4">
              {/* Side-by-side comparison: Custody Item vs Submitted Proof */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Physical item in custody */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-3.5 text-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    📦 Physical Property In Custody
                  </span>
                  <p className="mt-1 font-bold text-slate-900 dark:text-white text-sm">
                    <span data-no-translate>{verifyModalClaim.item?.title}</span>
                  </p>
                  <div className="mt-2 space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                    <p>
                      <strong>Category:</strong> <span data-no-translate>{verifyModalClaim.item?.category || "General"}</span>
                    </p>
                    <p>
                      <strong>Found Location:</strong> <span data-no-translate>{verifyModalClaim.item?.location}</span>
                    </p>
                    <p>
                      <strong>Date Logged:</strong> <span data-no-translate>{verifyModalClaim.item?.date}</span>
                    </p>
                    <p className="mt-1.5 text-slate-500 italic border-t border-slate-200 dark:border-slate-800 pt-1.5">
                      "<span data-no-translate>{verifyModalClaim.item?.description}</span>"
                    </p>
                  </div>
                </div>

                {/* Claimant Proof */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
                    🔍 Student Claim & Proof Markers
                  </span>
                  <p className="mt-1 font-bold text-slate-900 dark:text-white text-sm">
                    <span data-no-translate>{verifyModalClaim.studentName}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Contact: <span data-no-translate>{verifyModalClaim.contact}</span>{" "}
                    {verifyModalClaim.studentEmail ? <span data-no-translate>• {verifyModalClaim.studentEmail}</span> : ""}
                  </p>
                  <div className="mt-2 rounded-xl bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    <span data-no-translate>{verifyModalClaim.proofDescription}</span>
                  </div>
                </div>
              </div>

              {/* Department Verification Authentication Checklist */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  Lost & Found Department Authentication Checklist
                </span>
                <div className="mt-2.5 space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={checklist.proofMatch}
                      onChange={(e) =>
                        setChecklist({ ...checklist, proofMatch: e.target.checked })
                      }
                      className="rounded accent-emerald-600 h-4 w-4"
                    />
                    <span>Proof description and identifying markers match physical property in custody.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={checklist.serialOrContents}
                      onChange={(e) =>
                        setChecklist({ ...checklist, serialOrContents: e.target.checked })
                      }
                      className="rounded accent-emerald-600 h-4 w-4"
                    />
                    <span>Unique contents, serial number, or security password verified with student.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={checklist.credentialsChecked}
                      onChange={(e) =>
                        setChecklist({ ...checklist, credentialsChecked: e.target.checked })
                      }
                      className="rounded accent-emerald-600 h-4 w-4"
                    />
                    <span>Student registered status authenticated for safe return.</span>
                  </label>
                </div>
              </div>

              {/* Station pickup location */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Designated Physical Handover Station
                </label>
                <input
                  type="text"
                  required
                  value={verifyPickupStation}
                  onChange={(e) => setVerifyPickupStation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Notes / Instructions for student */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Department Officer Verification Notes & Collection Instructions
                </label>
                <textarea
                  rows={2}
                  required
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setVerifyModalClaim(null)}
                  disabled={Boolean(processingId)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(processingId) || !checklist.proofMatch}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {processingId
                    ? "Authorizing..."
                    : "Authorize Verification & Issue Digital Handover Pass"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Handover Execution Modal */}
      {handoverModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-[26px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-500" />
                Confirm Physical Handover
              </h3>
              <button
                type="button"
                onClick={() => setHandoverModalClaim(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={onExecuteHandover} className="mt-4 space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs">
                <p>
                  <strong>Item:</strong> {handoverModalClaim.item?.title}
                </p>
                <p className="mt-1">
                  <strong>Claimant:</strong> {handoverModalClaim.studentName} (
                  {handoverModalClaim.contact})
                </p>
                <p className="mt-1 font-mono text-emerald-600 dark:text-emerald-400">
                  <strong>Verification Code:</strong> {handoverModalClaim.claimCode}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Handover Verification Notes:
                </label>
                <textarea
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="e.g. Student ID verified, item unlocked and delivered to claimant..."
                  rows={3}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setHandoverModalClaim(null)}
                  disabled={Boolean(processingId)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(processingId)}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 cursor-pointer"
                >
                  {processingId ? "Recording..." : "Confirm & Mark Returned"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Claim Rejection Modal */}
      {rejectModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-[26px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <XCircle className="h-5 w-5 text-rose-500" />
                Reject Claim Request
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalClaim(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={onRejectSubmit} className="mt-4 space-y-4">
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-300">
                You are rejecting the claim by <strong>{rejectModalClaim.studentName}</strong> for{" "}
                <strong>{rejectModalClaim.item?.title}</strong>.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Reason for Rejection:
                </label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="e.g. Serial number provided did not match item in custody..."
                  rows={3}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalClaim(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(processingId)}
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-rose-950/40 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 cursor-pointer"
                >
                  {processingId ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-[26px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-emerald-500" />
                Edit Item Details
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={onSaveItemEdit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Item Title
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Type
                  </label>
                  <select
                    value={editFormData.type}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, type: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Lost">Lost</option>
                    <option value="Found">Found</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.location}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, location: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, date: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Contact Information
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.contact}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, contact: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Found">Found (Matched)</option>
                  <option value="Claimed">Claimed</option>
                  <option value="Resolved">Resolved (Handed Over)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 font-bold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminModals;
