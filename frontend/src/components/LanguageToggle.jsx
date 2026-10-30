import { useLanguage } from "../context/LanguageContext";

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label="Switch language / भाषा बदलें"
      title="Switch language / भाषा बदलें"
      className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-colors"
    >
      <span className={language === "en" ? "text-emerald-600 dark:text-emerald-400" : ""}>English</span>
      <span className="mx-1">/</span>
      <span className={language === "hi" ? "text-emerald-600 dark:text-emerald-400" : ""}>हिन्दी</span>
    </button>
  );
};

export default LanguageToggle;
