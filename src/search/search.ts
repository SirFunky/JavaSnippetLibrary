import Fuse from "fuse.js";
import type { Snippet } from "../models/snippet";
export interface Filters {
  category: string;
  tag: string;
  version: string;
  favorites: string[];
}
export function createSearch(snippets: Snippet[]) {
  const fuse = new Fuse(snippets, {
    keys: [
      { name: "title", weight: 5 },
      { name: "tags", weight: 4 },
      { name: "description", weight: 3 },
      { name: "category", weight: 2 },
      { name: "blocks", weight: 1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    includeMatches: true,
  });
  return (query: string, f: Filters) => {
    const results = query.trim()
      ? fuse.search(query.trim()).map((r) => r.item)
      : snippets;
    return results.filter(
      (s) =>
        (f.category === "all" ||
          f.category === "recent" ||
          (f.category === "favorites"
            ? f.favorites.includes(s.id)
            : `${s.category}/${s.subcategory ?? ""}` === f.category ||
              s.category === f.category)) &&
        (!f.tag || s.tags.includes(f.tag)) &&
        (!f.version || s.javaVersion <= Number(f.version)),
    );
  };
}
export function categoryTree(snippets: Snippet[]) {
  const tree = new Map<string, Set<string>>();
  for (const s of snippets) {
    if (!tree.has(s.category)) tree.set(s.category, new Set());
    if (s.subcategory) tree.get(s.category)!.add(s.subcategory);
  }
  return [...tree]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, children]) => ({
      name,
      children: [...children].sort(),
      count: snippets.filter((s) => s.category === name).length,
    }));
}
