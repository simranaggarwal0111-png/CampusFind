import { useState } from "react";
import { Check, Copy, Download, QrCode, X } from "lucide-react";

const RecoveryQrModal = ({ item, qrCodeDataUrl, recoveryUrl, onClose }) => {
  const [copyMessage, setCopyMessage] = useState("");

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(recoveryUrl);
      setCopyMessage("Recovery link copied.");
    } catch {
      setCopyMessage("Could not copy the link. Copy it from the field below.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-qr-title"
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <QrCode className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Item recovery QR</span>
            </div>
            <h2 id="recovery-qr-title" className="mt-2 text-xl font-bold">
              {item.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR code dialog"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex justify-center rounded-2xl bg-white p-4">
          <img
            src={qrCodeDataUrl}
            alt={`Recovery QR code for ${item.title}`}
            className="h-64 w-64 max-w-full object-contain"
          />
        </div>
        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
          Print or share this code. Anyone who scans it can send you a recovery request.
        </p>

        <label className="mt-4 block text-xs font-semibold text-slate-500 dark:text-slate-400">
          Recovery link
          <input
            type="text"
            readOnly
            value={recoveryUrl}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
        </label>
        {copyMessage && (
          <p role="status" className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
            {copyMessage}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <a
            href={qrCodeDataUrl}
            download={`campusfind-${item.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-qr.png`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </a>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 hover:border-emerald-500 dark:border-slate-700 dark:text-slate-200"
          >
            {copyMessage === "Recovery link copied." ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copy link
          </button>
        </div>
      </section>
    </div>
  );
};

export default RecoveryQrModal;
