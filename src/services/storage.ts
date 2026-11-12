import { invoke, isTauri } from "@tauri-apps/api/core";
import {
  defaultPreferences,
  type Preferences,
  type LibraryResult,
  type LibraryFile,
} from "../models/snippet";
import { parseSnippet, frontmatterId } from "./markdown";
export const native = isTauri();
const LIBRARY = "jsl.library.v1",
  PREFS = "jsl.preferences.v1";
const defaults = import.meta.glob("../../DefaultSnippets/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
export function readBrowserPreferences(
  storage: Pick<Storage, "getItem"> = localStorage,
): Preferences {
  try {
    return normalizePreferences(JSON.parse(storage.getItem(PREFS) ?? "{}"));
  } catch {
    return { ...defaultPreferences };
  }
}
export function normalizePreferences(value: unknown): Preferences {
  const v = (
    value && typeof value === "object" ? value : {}
  ) as Partial<Preferences>;
  return {
    ...defaultPreferences,
    favorites: Array.isArray(v.favorites)
      ? v.favorites.filter((x) => typeof x === "string")
      : [],
    recent: Array.isArray(v.recent)
      ? v.recent.filter((x) => typeof x === "string").slice(0, 30)
      : [],
    theme: ["dark", "light", "system"].includes(v.theme ?? "")
      ? v.theme!
      : defaultPreferences.theme,
    category: typeof v.category === "string" ? v.category : "all",
    fontSize: Math.min(20, Math.max(11, Number(v.fontSize) || 13)),
    navWidth: Math.min(330, Math.max(185, Number(v.navWidth) || 232)),
    listWidth: Math.min(560, Math.max(280, Number(v.listWidth) || 370)),
    collapsed: !!v.collapsed,
  };
}
export function writeBrowserPreferences(
  p: Preferences,
  storage: Pick<Storage, "setItem"> = localStorage,
) {
  storage.setItem(PREFS, JSON.stringify(p));
}
function browserFiles(): LibraryFile[] {
  const saved = localStorage.getItem(LIBRARY);
  if (saved !== null) {
    const parsed = JSON.parse(saved);
    if (
      !Array.isArray(parsed) ||
      !parsed.every(
        (f) => typeof f.path === "string" && typeof f.content === "string",
      )
    )
      throw new Error(
        "Browser library is invalid. Export browser storage before resetting it.",
      );
    return parsed;
  }
  const files = Object.entries(defaults).map(([path, content]) => ({
    path: path.split("DefaultSnippets/")[1],
    content,
  }));
  localStorage.setItem(LIBRARY, JSON.stringify(files));
  return files;
}
export const loadLibrary = (): Promise<LibraryResult> =>
  native
    ? invoke("load_library")
    : Promise.resolve({
        files: browserFiles(),
        errors: [],
        folder: "Browser preview · stored in this browser only",
      });
export const loadPreferences = (): Promise<Preferences> =>
  native
    ? invoke("load_preferences").then(normalizePreferences)
    : Promise.resolve(readBrowserPreferences());
export const savePreferences = (preferences: Preferences): Promise<void> =>
  native
    ? invoke("save_preferences", { preferences })
    : Promise.resolve(writeBrowserPreferences(preferences));
export function validateSave(
  files: LibraryFile[],
  content: string,
  path: string | null,
) {
  const s = parseSnippet(content);
  if (
    files.some(
      (file) => file.path !== path && frontmatterId(file.content) === s.id,
    )
  )
    throw new Error(`Duplicate ID: ${s.id}`);
  return s;
}
export async function saveSnippet(
  content: string,
  path: string | null,
  expected: string | null,
): Promise<string> {
  if (native) return invoke("save_snippet", { content, path, expected });
  const files = browserFiles();
  const s = validateSave(files, content, path);
  if (path && files.find((f) => f.path === path)?.content !== expected)
    throw new Error(
      "This file changed outside the editor. Reload before saving.",
    );
  const target = path ?? `${s.id}.md`;
  if (!path && files.some((f) => f.path === target))
    throw new Error("A file with this name already exists.");
  localStorage.setItem(
    LIBRARY,
    JSON.stringify([
      ...files.filter((f) => f.path !== target),
      { path: target, content },
    ]),
  );
  return target;
}
export async function deleteSnippet(path: string, expected: string) {
  if (native) return invoke<void>("delete_snippet", { path, expected });
  const files = browserFiles();
  if (files.find((f) => f.path === path)?.content !== expected)
    throw new Error("File changed. Reload before deleting.");
  localStorage.setItem(
    LIBRARY,
    JSON.stringify(files.filter((f) => f.path !== path)),
  );
}
export async function exportSnippet(content: string, id: string) {
  if (native) return invoke<boolean>("export_snippet", { content, id });
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/markdown;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${id}.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
export async function openLibrary() {
  if (native) await invoke("open_library");
  else
    throw new Error(
      "Folder access is available in the desktop app. This preview stores snippets in your browser.",
    );
}
export async function copyText(text: string) {
  if (native) {
    const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
    await writeText(text);
  } else await navigator.clipboard.writeText(text);
}
