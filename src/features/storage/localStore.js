export const LOCAL_REVIEWS_KEY = "portfolio_local_reviews";
export const LOCAL_PROJECTS_KEY = "portfolio_local_projects";

export function getLocalItems(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalItems(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(0, 100)));
  } catch {
    // ignore localStorage write failures
  }
}

export function mergeByKey(remoteItems = [], localItems = [], makeKey) {
  const map = new Map();
  [...remoteItems, ...localItems].forEach((item) => {
    const key = item.id || makeKey(item);
    map.set(key, { ...item, id: item.id || key });
  });
  return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
