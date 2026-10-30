import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "./translations";
import { apiUrl } from "../utils/api";

const STORAGE_KEY = "campusfind_language";
const LanguageContext = createContext(null);
const originalText = new WeakMap();
const originalAttributes = new WeakMap();

const isLanguage = (value) => value === "en" || value === "hi";

const translateText = (value, language) => {
  const text = value.trim();
  if (!text) return value;
  const dictionary = translations[language];
  if (dictionary[text]) return value.replace(text, dictionary[text]);
  if (language === "en") {
    const english = Object.entries(translations.hi).find(([, hindi]) => hindi === text)?.[0];
    if (english) return value.replace(text, english);
  }
  return value;
};

function applyTranslations(root, language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    if (node.parentElement?.closest("[data-no-translate],script,style,textarea,code,pre")) return;
    const currentText = node.nodeValue || "";
    const sourceText = originalText.has(node) ? originalText.get(node) : currentText;
    const translated = translateText(sourceText, language);
    if (translated !== currentText) node.nodeValue = translated;
    if (translated !== sourceText) originalText.set(node, sourceText);
    else originalText.delete(node);
  });

  root.querySelectorAll("input[placeholder],textarea[placeholder],[aria-label],[title]").forEach((element) => {
    if (element.closest("[data-no-translate]")) return;
    ["placeholder", "aria-label", "title"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return;
      let original = originalAttributes.get(element);
      if (!original) {
        original = new Map();
        originalAttributes.set(element, original);
      }
      const sourceValue = original.has(attribute) ? original.get(attribute) : value;
      const translated = translateText(sourceValue, language);
      if (translated !== value) element.setAttribute(attribute, translated);
      if (translated !== sourceValue) original.set(attribute, sourceValue);
      else original.delete(attribute);
    });
  });
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isLanguage(saved) ? saved : "en";
  });

  const setLanguage = useCallback((nextLanguage) => {
    if (!isLanguage(nextLanguage)) return;
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new CustomEvent("campusfind-language-change", { detail: nextLanguage }));

    const token = localStorage.getItem("token");
    if (token) {
      fetch(apiUrl("/api/auth/language"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ preferredLanguage: nextLanguage }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Could not save language preference.");
          }
          return response.json();
        })
        .then(({ user }) => {
          if (user) {
            localStorage.setItem("user", JSON.stringify(user));
            window.dispatchEvent(new Event("storage"));
          }
        })
        .catch((error) => console.error("Language preference could not be saved:", error));
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "hi" : "en");
  }, [language, setLanguage]);

  useEffect(() => {
    const apply = () => {
      document.documentElement.lang = language === "hi" ? "hi" : "en";
      applyTranslations(document.body, language);
    };
    apply();

    const observer = new MutationObserver(() => applyTranslations(document.body, language));
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  useEffect(() => {
    const syncLanguage = (event) => {
      const nextLanguage = event.detail;
      if (isLanguage(nextLanguage)) {
        setLanguageState(nextLanguage);
        localStorage.setItem(STORAGE_KEY, nextLanguage);
      }
    };
    window.addEventListener("campusfind-language-change", syncLanguage);
    const syncUserPreference = () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (isLanguage(user?.preferredLanguage)) {
          setLanguageState(user.preferredLanguage);
          localStorage.setItem(STORAGE_KEY, user.preferredLanguage);
        }
      } catch (error) {
        console.error("Could not read the saved language preference:", error);
      }
    };
    window.addEventListener("storage", syncUserPreference);
    return () => {
      window.removeEventListener("campusfind-language-change", syncLanguage);
      window.removeEventListener("storage", syncUserPreference);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(apiUrl("/api/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (isLanguage(data.user?.preferredLanguage)) {
          setLanguageState(data.user.preferredLanguage);
          localStorage.setItem(STORAGE_KEY, data.user.preferredLanguage);
        }
      })
      .catch((error) => console.error("Could not load language preference:", error));
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t: (text) => translateText(text, language) }),
    [language, setLanguage, toggleLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};
