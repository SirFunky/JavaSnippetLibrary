import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Search,
  Plus,
  Code2,
  Layers,
  Star,
  Clock,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  Moon,
  Monitor,
  Copy,
  Check,
  ArrowUpRight,
  MoreHorizontal,
  Download,
  Upload,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  SlidersHorizontal,
  Command,
  AlertTriangle,
  FileCode2,
  Braces,
  Hash,
  Network,
  Database,
  Workflow,
  BookOpen,
} from "lucide-react";
import {
  defaultPreferences,
  type Preferences,
  type Snippet,
} from "./models/snippet";
import { indexLibrary, parseSnippet, withImports } from "./services/markdown";
import * as storage from "./services/storage";
import { categoryTree, createSearch } from "./search/search";
import CodeView from "./components/CodeView";
import Editor from "./components/Editor";
import { useModalFocus } from "./hooks/useModalFocus";
function Mark({ text, query }: { text: string; query: string }) {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return <>{text}</>;
  const regex = new RegExp(
    `(${words.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "ig",
  );
  return (
    <>
      {text
        .split(regex)
        .map((t, i) =>
          words.some((w) => t.toLowerCase() === w.toLowerCase()) ? (
            <mark key={i}>{t}</mark>
          ) : (
            t
          ),
        )}
    </>
  );
}
function categoryIcon(name: string) {
  const Icon = name.includes("SQL")
    ? Database
    : name.includes("Network")
      ? Network
      : name.includes("Concurr")
        ? Workflow
        : name.includes("File")
          ? Folder
          : name.includes("Basics")
            ? BookOpen
            : name.includes("String")
              ? Braces
              : Hash;
  return <Icon size={16} />;
}
export default function App() {
  const [snippets, setSnippets] = useState<Snippet[]>([]),
    [preferences, setPreferences] = useState<Preferences>(defaultPreferences),
    [ready, setReady] = useState(false),
    [loading, setLoading] = useState(true),
    [folder, setFolder] = useState(""),
    [errors, setErrors] = useState<string[]>([]),
    [showErrors, setShowErrors] = useState(false);
  const [query, setQuery] = useState(""),
    [tag, setTag] = useState(""),
    [version, setVersion] = useState(""),
    [selectedId, setSelectedId] = useState(""),
    [expanded, setExpanded] = useState<string[]>([
      "Collections",
      "Files & I/O",
    ]),
    [toast, setToast] = useState(""),
    [settings, setSettings] = useState(false),
    [menu, setMenu] = useState(false),
    [editor, setEditor] = useState<Snippet | null | undefined>(undefined),
    [deleting, setDeleting] = useState<Snippet | null>(null),
    [busy, setBusy] = useState(false),
    [tab, setTab] = useState<"code" | "imports">("code"),
    [copied, setCopied] = useState(""),
    [confirmError, setConfirmError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null),
    resultsRef = useRef<HTMLDivElement>(null),
    importRef = useRef<HTMLInputElement>(null),
    prefsQueue = useRef(Promise.resolve()),
    refreshing = useRef(false),
    knownErrors = useRef("");
  useModalFocus(
    editor !== undefined ||
      settings ||
      !!deleting ||
      (showErrors && errors.length > 0),
  );
  const notify = useCallback((text: string) => setToast(text), []);
  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const result = await storage.loadLibrary();
      const parsed = indexLibrary(result.files);
      setSnippets(parsed.snippets);
      setFolder(result.folder);
      const allErrors = [...result.errors, ...parsed.errors];
      setErrors(allErrors);
      const signature = allErrors.join("\n");
      if (signature && signature !== knownErrors.current) setShowErrors(true);
      knownErrors.current = signature;
    } catch (e) {
      notify((e as Error).message);
    } finally {
      refreshing.current = false;
      setLoading(false);
    }
  }, [notify]);
  useEffect(() => {
    void refresh();
    storage
      .loadPreferences()
      .then(setPreferences)
      .catch((e) => notify(`Could not load preferences: ${e.message}`))
      .finally(() => setReady(true));
  }, [refresh, notify]);
  useEffect(() => {
    if (!ready) return;
    // Browser storage is synchronous so a reload immediately after an action
    // cannot discard favorites or navigation state. Serialize native writes.
    if (!storage.native) {
      try {
        storage.writeBrowserPreferences(preferences);
      } catch (e) {
        notify(`Preferences could not be saved: ${(e as Error).message}`);
      }
      return;
    }
    prefsQueue.current = prefsQueue.current
      .catch(() => {})
      .then(() => storage.savePreferences(preferences))
      .catch((e) => notify(`Preferences could not be saved: ${e.message}`));
  }, [preferences, ready, notify]);
  useEffect(() => {
    const update = () => {
      document.documentElement.dataset.theme =
        preferences.theme === "system"
          ? matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : preferences.theme;
    };
    update();
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [preferences.theme]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 8000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(timer);
    };
  }, [refresh]);
  const updatePrefs = (p: Partial<Preferences>) =>
    setPreferences((old) => ({ ...old, ...p }));
  const search = useMemo(() => createSearch(snippets), [snippets]);
  const results = useMemo(() => {
    const filtered = search(query, {
      category: preferences.category,
      tag,
      version,
      favorites: preferences.favorites,
    });
    return preferences.category === "recent"
      ? filtered
          .filter((s) => preferences.recent.includes(s.id))
          .sort(
            (a, b) =>
              preferences.recent.indexOf(a.id) -
              preferences.recent.indexOf(b.id),
          )
      : filtered;
  }, [
    search,
    query,
    tag,
    version,
    preferences.category,
    preferences.favorites,
    preferences.recent,
  ]);
  const selected = results.find((s) => s.id === selectedId) ?? results[0];
  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected.id);
    setPreferences((p) =>
      p.recent[0] === selected.id
        ? p
        : {
            ...p,
            recent: [
              selected.id,
              ...p.recent.filter((id) => id !== selected.id),
            ].slice(0, 30),
          },
    );
    setTab("code");
    setMenu(false);
  }, [selected?.id]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editor !== undefined || deleting || settings) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setEditor(null);
      }
      if (e.key === "Escape") {
        if (query) setQuery("");
        else resultsRef.current?.focus();
        setMenu(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [query, editor, deleting, settings]);
  const tree = useMemo(() => categoryTree(snippets), [snippets]),
    tags = useMemo(
      () => [...new Set(snippets.flatMap((s) => s.tags))].sort(),
      [snippets],
    );
  const favorite = (id: string) =>
    setPreferences((p) => ({
      ...p,
      favorites: p.favorites.includes(id)
        ? p.favorites.filter((x) => x !== id)
        : [...p.favorites, id],
    }));
  function chooseCategory(category: string) {
    updatePrefs({ category });
    setQuery("");
    setTag("");
  }
  async function copy(imports = false) {
    if (!selected) return;
    try {
      await storage.copyText(imports ? withImports(selected) : selected.code);
      setCopied(imports ? "imports" : "code");
      setTimeout(() => setCopied(""), 1800);
      notify(
        imports
          ? "Code and imports copied to clipboard"
          : "Code copied to clipboard",
      );
    } catch (e) {
      notify(`Copy failed: ${(e as Error).message}`);
    }
  }
  async function importFiles(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    let count = 0;
    const failures: string[] = [];
    try {
      for (const file of Array.from(files)) {
        try {
          if (file.size > 2_000_000)
            throw new Error("File exceeds the 2 MB limit.");
          const raw = await file.text();
          parseSnippet(raw);
          await storage.saveSnippet(raw, null, null);
          count++;
        } catch (e) {
          failures.push(`${file.name}: ${(e as Error).message}`);
        }
      }
      await refresh();
      notify(
        `Imported ${count} snippet${count === 1 ? "" : "s"}${failures.length ? `. ${failures.join(" · ")}` : ""}`,
      );
    } finally {
      setBusy(false);
      if (importRef.current) importRef.current.value = "";
    }
  }
  function resize(kind: "navWidth" | "listWidth", event: React.PointerEvent) {
    const start = event.clientX,
      initial = preferences[kind];
    event.currentTarget.setPointerCapture(event.pointerId);
    const el = event.currentTarget;
    const move = (e: Event) => {
      const p = e as PointerEvent;
      setPreferences((old) => ({
        ...old,
        [kind]: Math.min(
          kind === "navWidth" ? 330 : 560,
          Math.max(
            kind === "navWidth" ? 185 : 280,
            initial + p.clientX - start,
          ),
        ),
      }));
    };
    const stop = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", stop);
      el.removeEventListener("pointercancel", stop);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", stop);
  }
  function resizeKey(kind: "navWidth" | "listWidth", e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      updatePrefs({
        [kind]: Math.max(
          kind === "navWidth" ? 185 : 280,
          Math.min(
            kind === "navWidth" ? 330 : 560,
            preferences[kind] + (e.key === "ArrowRight" ? 10 : -10),
          ),
        ),
      });
    }
  }
  const activeFilters = !!(
    query ||
    tag ||
    version ||
    preferences.category !== "all"
  );
  const sectionName =
    preferences.category === "all"
      ? "All snippets"
      : preferences.category === "favorites"
        ? "Favorites"
        : preferences.category === "recent"
          ? "Recently viewed"
          : preferences.category.split("/").at(-1);
  return (
    <div
      className="app-shell"
      style={
        {
          "--nav-width": `${preferences.collapsed ? 64 : preferences.navWidth}px`,
          "--list-width": `${preferences.listWidth}px`,
        } as CSSProperties
      }
    >
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Code2 size={23} />
          </div>
          <span>
            Java <strong>Snippet Library</strong>
          </span>
          <span className="version-label">v1.0</span>
        </div>
        <div className="header-actions">
          <span className="local-badge">
            <i />
            {storage.native ? "Local library" : "Browser preview"}
          </span>
          <span className="header-divider" />
          <button
            title="Settings"
            aria-label="Settings"
            onClick={() => setSettings(true)}
          >
            <Settings size={18} />
          </button>
          <button
            className="primary new-button"
            onClick={() => setEditor(null)}
          >
            <Plus size={16} />
            New snippet<kbd>Ctrl N</kbd>
          </button>
        </div>
      </header>
      <div className="workspace">
        <aside
          className={`navigation ${preferences.collapsed ? "collapsed" : ""}`}
          aria-label="Library navigation"
        >
          <div className="nav-top">
            <span className="section-label">WORKSPACE</span>
            <button
              aria-label={
                preferences.collapsed
                  ? "Expand navigation"
                  : "Collapse navigation"
              }
              onClick={() => updatePrefs({ collapsed: !preferences.collapsed })}
            >
              {preferences.collapsed ? (
                <PanelLeftOpen size={17} />
              ) : (
                <PanelLeftClose size={17} />
              )}
            </button>
          </div>
          <nav>
            <button
              title="All snippets"
              className={`nav-item ${preferences.category === "all" ? "active" : ""}`}
              onClick={() => chooseCategory("all")}
            >
              <Layers size={17} />
              <span>All snippets</span>
              <em>{snippets.length}</em>
            </button>
            <button
              title="Favorites"
              className={`nav-item ${preferences.category === "favorites" ? "active" : ""}`}
              onClick={() => chooseCategory("favorites")}
            >
              <Star size={17} />
              <span>Favorites</span>
              <em>
                {
                  snippets.filter((s) => preferences.favorites.includes(s.id))
                    .length
                }
              </em>
            </button>
            <button
              title="Recently viewed"
              className={`nav-item ${preferences.category === "recent" ? "active" : ""}`}
              onClick={() => chooseCategory("recent")}
            >
              <Clock size={17} />
              <span>Recently viewed</span>
            </button>
            <div className="nav-section section-label">
              CATEGORIES <span>{tree.length}</span>
            </div>
            <div className="category-scroll">
              {tree.map((c) => (
                <div key={c.name}>
                  <div className="category-row">
                    <button
                      title={c.name}
                      className={`nav-item category ${preferences.category === c.name ? "active" : ""}`}
                      onClick={() => chooseCategory(c.name)}
                    >
                      {categoryIcon(c.name)}
                      <span>{c.name}</span>
                    </button>
                    {c.children.length > 0 && (
                      <button
                        className="tree-toggle"
                        aria-label={`${expanded.includes(c.name) ? "Collapse" : "Expand"} ${c.name}`}
                        aria-expanded={expanded.includes(c.name)}
                        onClick={() =>
                          setExpanded((p) =>
                            p.includes(c.name)
                              ? p.filter((x) => x !== c.name)
                              : [...p, c.name],
                          )
                        }
                      >
                        {expanded.includes(c.name) ? (
                          <ChevronDown size={13} />
                        ) : (
                          <ChevronRight size={13} />
                        )}
                      </button>
                    )}
                  </div>
                  {expanded.includes(c.name) && (
                    <div className="subcategories">
                      {c.children.map((child) => (
                        <button
                          key={child}
                          className={
                            preferences.category === `${c.name}/${child}`
                              ? "active"
                              : ""
                          }
                          onClick={() => chooseCategory(`${c.name}/${child}`)}
                        >
                          <span className="tree-dot" />
                          {child}
                          <em>
                            {
                              snippets.filter(
                                (s) =>
                                  s.category === c.name &&
                                  s.subcategory === child,
                              ).length
                            }
                          </em>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>
          <div className="nav-bottom">
            <button
              title="Import Markdown"
              disabled={busy}
              onClick={() => importRef.current?.click()}
            >
              <Upload size={16} />
              <span>Import snippets</span>
            </button>
            <button
              title={folder}
              onClick={() =>
                void storage.openLibrary().catch((e) => notify(e.message))
              }
            >
              <FolderOpen size={16} />
              <span>Open library folder</span>
              <ArrowUpRight size={13} />
            </button>
            <div className="offline-note">
              <span className="status-dot" />
              All yours. Always offline.
            </div>
          </div>
        </aside>
        <div
          className="resize-handle nav-resize"
          role="separator"
          aria-label="Navigation width"
          aria-orientation="vertical"
          tabIndex={0}
          onKeyDown={(e) => resizeKey("navWidth", e)}
          onPointerDown={(e) => resize("navWidth", e)}
        />
        <section className="results-panel" aria-label="Snippet search">
          <div className="results-heading">
            <div>
              <div className="eyebrow">YOUR CODE, WITHIN REACH</div>
              <h1>{sectionName}</h1>
            </div>
            <button
              title="Refresh library"
              aria-label="Refresh library"
              onClick={() => void refresh()}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="search-area">
            <div className="search-box">
              <Search size={17} />
              <input
                ref={searchRef}
                aria-label="Search snippets"
                placeholder="Search your snippets…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    resultsRef.current?.focus();
                  }
                }}
              />
              {query ? (
                <button aria-label="Clear search" onClick={() => setQuery("")}>
                  <X size={14} />
                </button>
              ) : (
                <kbd>Ctrl K</kbd>
              )}
            </div>
            <div className="filters">
              <SlidersHorizontal size={14} />
              <select
                aria-label="Filter by tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              >
                <option value="">All tags</option>
                {tags.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <select
                aria-label="Filter by Java version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              >
                <option value="">Any Java version</option>
                {[8, 11, 17, 21, 25].map((v) => (
                  <option value={v} key={v}>
                    Java {v} compatible
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="results-count">
            <span>
              {results.length} snippet{results.length === 1 ? "" : "s"}
              {query ? " found" : ""}
            </span>
            {activeFilters ? (
              <button
                onClick={() => {
                  setQuery("");
                  setTag("");
                  setVersion("");
                  chooseCategory("all");
                }}
              >
                Clear filters
              </button>
            ) : (
              <span className="sort-label">A — Z</span>
            )}
          </div>
          <div
            className="result-list"
            ref={resultsRef}
            role="listbox"
            aria-label="Snippet results"
            aria-activedescendant={
              selected ? `result-${selected.id}` : undefined
            }
            tabIndex={0}
            onKeyDown={(e) => {
              if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const i = results.findIndex((s) => s.id === selected?.id);
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? results.length - 1
                      : Math.max(
                          0,
                          Math.min(
                            results.length - 1,
                            i + (e.key === "ArrowDown" ? 1 : -1),
                          ),
                        );
                if (results[next]) {
                  setSelectedId(results[next].id);
                  document
                    .getElementById(`result-${results[next].id}`)
                    ?.scrollIntoView({ block: "nearest" });
                }
              }
            }}
          >
            {loading ? (
              <div className="empty-state">
                <RefreshCw size={28} />
                <h3>Opening your library…</h3>
              </div>
            ) : results.length ? (
              results.map((s) => (
                <div
                  role="option"
                  aria-selected={selected?.id === s.id}
                  id={`result-${s.id}`}
                  key={s.id}
                  className={`result-card ${selected?.id === s.id ? "selected" : ""}`}
                  onClick={() => setSelectedId(s.id)}
                >
                  <div className="result-title">
                    <FileCode2 size={16} />
                    <h3>
                      <Mark text={s.title} query={query} />
                    </h3>
                    {preferences.favorites.includes(s.id) && (
                      <Star size={13} className="star-filled" />
                    )}
                    <span className="java-badge">{s.javaVersion}+</span>
                  </div>
                  <p>
                    <Mark text={s.description} query={query} />
                  </p>
                  <div className="result-meta">
                    <span>{s.subcategory ?? s.category}</span>
                    <div>
                      {s.tags.slice(0, 2).map((t) => (
                        <span className="tag" key={t}>
                          <Mark text={t} query={query} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Search size={30} />
                <h3>
                  {snippets.length
                    ? "No matching snippets"
                    : "Your next idea starts here"}
                </h3>
                <p>
                  {snippets.length
                    ? "Try another search or clear your filters."
                    : "Create a snippet or import Markdown to start your library."}
                </p>
                <button
                  onClick={() => {
                    if (snippets.length) {
                      setQuery("");
                      setTag("");
                      setVersion("");
                      chooseCategory("all");
                    } else setEditor(null);
                  }}
                >
                  {snippets.length ? "Clear all filters" : "Create a snippet"}
                </button>
              </div>
            )}
          </div>
          <div className="results-footer">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> to navigate
            </span>
            <span>{snippets.length} in library</span>
          </div>
        </section>
        <div
          className="resize-handle"
          role="separator"
          aria-label="Results width"
          aria-orientation="vertical"
          tabIndex={0}
          onKeyDown={(e) => resizeKey("listWidth", e)}
          onPointerDown={(e) => resize("listWidth", e)}
        />
        <main className="preview-panel">
          {selected ? (
            <>
              <div className="preview-toolbar">
                <div className="breadcrumb">
                  <Code2 size={15} />
                  <span>{selected.category}</span>
                  <ChevronRight size={12} />
                  <span>{selected.subcategory ?? "Snippet"}</span>
                </div>
                <div className="preview-actions">
                  <button
                    title="Edit snippet"
                    aria-label="Edit snippet"
                    onClick={() => setEditor(selected)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    title="Export snippet"
                    aria-label="Export snippet"
                    onClick={() =>
                      void storage
                        .exportSnippet(selected.raw, selected.id)
                        .then((ok) => ok && notify("Snippet exported"))
                        .catch((e) => notify(e.message))
                    }
                  >
                    <Download size={16} />
                  </button>
                  <div className="menu-anchor">
                    <button
                      aria-label="More snippet actions"
                      aria-expanded={menu}
                      onClick={() => setMenu(!menu)}
                    >
                      <MoreHorizontal size={19} />
                    </button>
                    {menu && (
                      <div className="dropdown">
                        <button
                          className="danger-text"
                          onClick={() => {
                            setDeleting(selected);
                            setConfirmError("");
                            setMenu(false);
                          }}
                        >
                          <Trash2 size={15} />
                          Delete snippet
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="preview-scroll">
                <div className="snippet-heading">
                  <div className="snippet-kind">
                    <span className="small-java">J</span> JAVA SNIPPET{" "}
                    <span>
                      /
                      {selected.dependency
                        ? " EXTERNAL DEPENDENCY"
                        : " STANDARD LIBRARY"}
                    </span>
                  </div>
                  <h2>{selected.title}</h2>
                  <p>{selected.description}</p>
                  <div className="snippet-badges">
                    <span className="compatibility">
                      <span className="status-dot" />
                      Java {selected.javaVersion}+
                    </span>
                    <span className="badge-separator" />
                    {selected.tags.map((t) => (
                      <button className="tag" key={t} onClick={() => setTag(t)}>
                        # {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="copy-actions">
                  <button className="primary" onClick={() => void copy()}>
                    {copied === "code" ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}{" "}
                    {copied === "code" ? "Copied!" : "Copy code"}
                  </button>
                  <button className="secondary" onClick={() => void copy(true)}>
                    {copied === "imports" ? (
                      <Check size={15} />
                    ) : (
                      <Copy size={15} />
                    )}
                    Copy with imports
                  </button>
                  <button
                    className={`favorite-button ${preferences.favorites.includes(selected.id) ? "is-favorite" : ""}`}
                    title={
                      preferences.favorites.includes(selected.id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                    aria-label={
                      preferences.favorites.includes(selected.id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                    onClick={() => favorite(selected.id)}
                  >
                    <Star size={18} />
                  </button>
                </div>
                <section className="code-container">
                  <div className="code-tabs">
                    <button
                      className={tab === "code" ? "active" : ""}
                      onClick={() => setTab("code")}
                    >
                      <Code2 size={14} />
                      Snippet.java
                    </button>
                    <button
                      className={tab === "imports" ? "active" : ""}
                      onClick={() => setTab("imports")}
                    >
                      Imports <span>{selected.imports?.length ?? 0}</span>
                    </button>
                    <span className="code-language">JAVA</span>
                  </div>
                  {tab === "code" ? (
                    <CodeView
                      code={selected.code}
                      fontSize={preferences.fontSize}
                    />
                  ) : selected.imports?.length ? (
                    <CodeView
                      code={selected.imports
                        .map((i) => `import ${i};`)
                        .join("\n")}
                      fontSize={preferences.fontSize}
                    />
                  ) : (
                    <p className="no-imports">This snippet needs no imports.</p>
                  )}
                  <div className="code-bottom">
                    <span>
                      {tab === "code"
                        ? selected.code.split("\n").length
                        : (selected.imports?.length ?? 0)}{" "}
                      lines
                    </span>
                    <span>
                      UTF-8 <span>·</span> Java
                    </span>
                  </div>
                </section>
                {selected.blocks.length > 1 && (
                  <section className="detail-section">
                    <div className="section-label">ADDITIONAL EXAMPLES</div>
                    {selected.blocks
                      .filter((code) => code !== selected.code)
                      .map((code, i) => (
                        <CodeView
                          key={i}
                          code={code}
                          fontSize={preferences.fontSize}
                        />
                      ))}
                  </section>
                )}
                {selected.dependency && (
                  <section className="dependency-note">
                    <AlertTriangle size={18} />
                    <div>
                      <h3>Dependency required</h3>
                      <p>{selected.dependency}</p>
                    </div>
                  </section>
                )}
                {selected.notes && (
                  <section className="detail-section usage-notes">
                    <div className="detail-icon">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <h3>Usage notes</h3>
                      <p className="notes-text">{selected.notes}</p>
                    </div>
                  </section>
                )}
                <section className="detail-section requirements">
                  <h3>At a glance</h3>
                  <div>
                    <span>Minimum version</span>
                    <strong>Java {selected.javaVersion}</strong>
                  </div>
                  <div>
                    <span>Category</span>
                    <strong>
                      {selected.category}
                      {selected.subcategory ? ` / ${selected.subcategory}` : ""}
                    </strong>
                  </div>
                  <div>
                    <span>Source</span>
                    <strong title={selected.path}>{selected.path}</strong>
                  </div>
                </section>
                {(selected.related?.length ?? 0) > 0 && (
                  <section className="detail-section">
                    <div className="section-label">RELATED SNIPPETS</div>
                    {selected.related?.map((id) => {
                      const s = snippets.find((x) => x.id === id);
                      return s ? (
                        <button
                          className="related"
                          key={id}
                          onClick={() => {
                            chooseCategory("all");
                            setVersion("");
                            setSelectedId(id);
                          }}
                        >
                          <FileCode2 size={16} />
                          {s.title}
                          <ArrowUpRight size={14} />
                        </button>
                      ) : null;
                    })}
                  </section>
                )}
                <div className="preview-end">
                  <Braces size={16} />
                  <span>A little less searching. A little more building.</span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state preview-empty">
              <Code2 size={42} />
              <h2>A place for your best Java</h2>
              <p>Select a snippet to see the details.</p>
            </div>
          )}
        </main>
      </div>
      <footer className="status-bar">
        <span>
          <span className="status-dot" />
          {storage.native ? "Library ready" : "Preview mode"}
          <span className="status-path" title={folder}>
            {folder}
          </span>
        </span>
        <div>
          {errors.length > 0 && (
            <button
              className="warning"
              onClick={() => setShowErrors(!showErrors)}
            >
              <AlertTriangle size={12} />
              {errors.length} library issue{errors.length === 1 ? "" : "s"}
            </button>
          )}
          <span>
            <Command size={11} /> Ctrl K to search
          </span>
          <span>Java Snippet Library</span>
        </div>
      </footer>
      <input
        hidden
        type="file"
        accept=".md,.markdown,text/markdown"
        multiple
        ref={importRef}
        onChange={(e) => void importFiles(e.target.files)}
      />
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {showErrors && errors.length > 0 && (
        <div className="modal-backdrop">
          <section
            className="modal compact-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="issues-title"
          >
            <header>
              <h2 id="issues-title">Library issues</h2>
              <button
                aria-label="Close library issues"
                onClick={() => setShowErrors(false)}
              >
                <X size={19} />
              </button>
            </header>
            <p>
              These files were skipped. Fix them in your library folder, then
              refresh. Valid snippets remain available.
            </p>
            <ul className="issue-list">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
      {editor !== undefined && (
        <Editor
          key={editor?.id ?? "new"}
          snippet={editor}
          onClose={() => setEditor(undefined)}
          onSave={async (raw) => {
            const saved = parseSnippet(raw);
            await storage.saveSnippet(
              raw,
              editor?.path ?? null,
              editor?.raw ?? null,
            );
            await refresh();
            setQuery("");
            setTag("");
            setVersion("");
            updatePrefs({ category: "all" });
            setSelectedId(saved.id);
            setEditor(undefined);
            notify("Snippet saved to your library");
          }}
        />
      )}
      {deleting && (
        <div className="modal-backdrop">
          <section
            className="modal compact-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <header>
              <h2 id="delete-title">Delete this snippet?</h2>
            </header>
            <p>
              “{deleting.title}” will be permanently removed from your library.
              Export a copy first if you want to keep it.
            </p>
            {confirmError && (
              <p className="error-inline" role="alert">
                {confirmError}
              </p>
            )}
            <footer>
              <button disabled={busy} onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button
                className="danger"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await storage.deleteSnippet(deleting.path, deleting.raw);
                    setDeleting(null);
                    await refresh();
                    notify("Snippet deleted");
                  } catch (e) {
                    setConfirmError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Deleting…" : "Delete snippet"}
              </button>
            </footer>
          </section>
        </div>
      )}
      {settings && (
        <div className="modal-backdrop">
          <section
            className="modal compact-modal settings"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            <header>
              <div>
                <div className="eyebrow">MAKE YOURSELF AT HOME</div>
                <h2 id="settings-title">Settings</h2>
              </div>
              <button
                aria-label="Close settings"
                onClick={() => setSettings(false)}
              >
                <X size={20} />
              </button>
            </header>
            <label>Appearance</label>
            <div className="theme-options">
              {(["dark", "light", "system"] as const).map((t) => {
                const Icon =
                  t === "dark" ? Moon : t === "light" ? Sun : Monitor;
                return (
                  <button
                    className={preferences.theme === t ? "active" : ""}
                    key={t}
                    onClick={() => updatePrefs({ theme: t })}
                  >
                    <Icon size={19} />
                    {t}
                  </button>
                );
              })}
            </div>
            <label htmlFor="font-size">
              Code font size <span>{preferences.fontSize}px</span>
            </label>
            <input
              id="font-size"
              type="range"
              min="11"
              max="20"
              value={preferences.fontSize}
              onChange={(e) =>
                updatePrefs({ fontSize: Number(e.target.value) })
              }
            />
            <label>Keyboard shortcuts</label>
            <div className="shortcut-list">
              <span>
                Search library<kbd>Ctrl K</kbd>
              </span>
              <span>
                New snippet<kbd>Ctrl N</kbd>
              </span>
              <span>
                Save in editor<kbd>Ctrl S</kbd>
              </span>
              <span>
                Navigate results<kbd>↑ / ↓</kbd>
              </span>
              <span>
                Clear search / focus results<kbd>Esc</kbd>
              </span>
            </div>
            <label>Library location</label>
            <p className="folder-location">{folder}</p>
            <button
              className="secondary"
              onClick={() =>
                void storage.openLibrary().catch((e) => notify(e.message))
              }
            >
              <FolderOpen size={15} />
              Open library folder
            </button>
            <p className="settings-note">
              Snippets stay on your device. No accounts, telemetry, or network
              services.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
