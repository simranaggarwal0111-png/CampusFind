import { Item } from "../models/Item.js";

const MATCH_THRESHOLD = 30;
const MAX_SUGGESTIONS = 6;

const weights = {
  title: 0.25,
  description: 0.2,
  category: 0.15,
  color: 0.1,
  brand: 0.1,
  location: 0.12,
  date: 0.08,
};

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const tokenSimilarity = (left, right) => {
  const normalizedLeft = normalize(left);
  const normalizedRight = normalize(right);
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;
  if (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  ) {
    return 0.85;
  }

  const leftTokens = new Set(normalizedLeft.split(/\s+/));
  const rightTokens = new Set(normalizedRight.split(/\s+/));
  const intersection = [...leftTokens].filter((token) =>
    rightTokens.has(token),
  ).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union ? intersection / union : 0;
};

const dateSimilarity = (left, right) => {
  if (!left || !right) return 0;
  const leftDate = new Date(left);
  const rightDate = new Date(right);
  if (
    Number.isNaN(leftDate.getTime()) ||
    Number.isNaN(rightDate.getTime())
  ) {
    return 0;
  }

  const daysApart = Math.abs(leftDate.getTime() - rightDate.getTime()) / 86400000;
  if (daysApart <= 1) return 1;
  if (daysApart <= 3) return 0.8;
  if (daysApart <= 7) return 0.6;
  if (daysApart <= 30) return 0.3;
  return 0;
};

export const getItemMatchPercentage = (left, right) => {
  let weightedScore = 0;
  let availableWeight = 0;

  for (const [field, weight] of Object.entries(weights)) {
    if (!left[field] || !right[field]) continue;
    availableWeight += weight;
    weightedScore +=
      weight *
      (field === "date"
        ? dateSimilarity(left[field], right[field])
        : tokenSimilarity(left[field], right[field]));
  }

  if (availableWeight === 0) return 0;
  return Math.round((weightedScore / availableWeight) * 100);
};

const toPublicMatch = (item, matchPercentage) => ({
  _id: item._id,
  title: item.title,
  type: item.type,
  category: item.category,
  color: item.color || "",
  brand: item.brand || "",
  location: item.location,
  date: item.date,
  description: item.description,
  imageUrl: item.imageUrl || "",
  status: item.status,
  matchPercentage,
});

export const findSimilarItems = async (item) => {
  if (
    !item ||
    !["Lost", "Found"].includes(item.type) ||
    ["Claimed", "Resolved"].includes(item.status)
  ) {
    return [];
  }

  const oppositeType = item.type === "Lost" ? "Found" : "Lost";
  const candidates = await Item.find({
    type: oppositeType,
    status: { $nin: ["Claimed", "Resolved"] },
    _id: { $ne: item._id },
  })
    .select(
      "title type category color brand location date description imageUrl status",
    )
    .lean();

  return candidates
    .map((candidate) => ({
      item: candidate,
      matchPercentage: getItemMatchPercentage(item, candidate),
    }))
    .filter(({ matchPercentage }) => matchPercentage >= MATCH_THRESHOLD)
    .sort((left, right) => right.matchPercentage - left.matchPercentage)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ item: candidate, matchPercentage }) =>
      toPublicMatch(candidate, matchPercentage),
    );
};
