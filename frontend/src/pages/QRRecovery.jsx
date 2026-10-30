import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import { apiUrl, getItemImageUrl } from "../utils/api";

const QRRecovery = () => {
  const { token } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [image, setImage] = useState(null);
  const [formData, setFormData] = useState({
    finderName: "",
    finderEmail: "",
    finderPhone: "",
    foundLocation: "",
    foundDate: "",
    description: "",
  });

  useEffect(() => {
    let active = true;
    const fetchItem = async () => {
      try {
        const response = await fetch(
          apiUrl(`/api/items/recover/${encodeURIComponent(token || "")}`),
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "This recovery link is unavailable.");
        }
        if (active) setItem(data.item);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Could not load this recovery link.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchItem();
    return () => {
      active = false;
    };
  }, [token]);

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setImage(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Images must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }
    setError("");
    setImage(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => body.append(key, value));
      if (image) body.append("image", image);

      const response = await fetch(
        apiUrl(`/api/items/recover/${encodeURIComponent(token || "")}`),
        { method: "POST", body },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not submit recovery details.");
      }
      setSuccess(data.message);
      setFormData({
        finderName: "",
        finderEmail: "",
        finderPhone: "",
        foundLocation: "",
        foundDate: "",
        description: "",
      });
      setImage(null);
    } catch (requestError) {
      setError(requestError.message || "Could not submit recovery details.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#080d1a] dark:text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/80 md:p-8">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              CampusFind secure recovery
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            Help return a lost item
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Send the owner information about where and when you found this item.
            Your contact details will only be shared with the item owner.
          </p>

          {loading && (
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking this recovery link...
            </div>
          )}
          {!loading && error && !item && (
            <div role="alert" className="mt-6 rounded-xl bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {item && (
            <>
              <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                {item.imageUrl && (
                  <img
                    src={getItemImageUrl(item.imageUrl)}
                    alt={item.title}
                    className="max-h-72 w-full bg-slate-100 object-contain dark:bg-slate-950"
                  />
                )}
                <div className="p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    {item.category}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Last reported near {item.location} on {item.date}
                  </p>
                </div>
              </article>

              {success ? (
                <div role="status" className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold">Recovery details sent</p>
                    <p className="mt-1">{success}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {error && (
                    <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400">
                      {error}
                    </p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Your name *
                      <input
                        name="finderName"
                        required
                        maxLength={100}
                        value={formData.finderName}
                        onChange={handleChange}
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Your email *
                      <input
                        name="finderEmail"
                        type="email"
                        required
                        maxLength={254}
                        value={formData.finderEmail}
                        onChange={handleChange}
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Phone (optional)
                      <input
                        name="finderPhone"
                        type="tel"
                        maxLength={25}
                        pattern="[+()0-9.\\-\\s]{7,25}"
                        value={formData.finderPhone}
                        onChange={handleChange}
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Date found *
                      <input
                        name="foundDate"
                        type="date"
                        required
                        max={new Date().toISOString().slice(0, 10)}
                        value={formData.foundDate}
                        onChange={handleChange}
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Where did you find it? *
                    <input
                      name="foundLocation"
                      required
                      maxLength={200}
                      value={formData.foundLocation}
                      onChange={handleChange}
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Additional details *
                    <textarea
                      name="description"
                      required
                      maxLength={2000}
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Item photo (optional, max 2 MB)
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      onChange={handleImageChange}
                      className="mt-1 block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-700 dark:file:text-emerald-300"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {submitting ? "Sending..." : "Send recovery details"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default QRRecovery;
