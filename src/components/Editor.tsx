import { useMemo, useState } from "react";
import { X, Save, Code2, AlertCircle } from "lucide-react";
import type { Snippet } from "../models/snippet";
import { parseSnippet, serializeSnippet } from "../services/markdown";
import CodeView from "./CodeView";
export default function Editor({
  snippet,
  onSave,
  onClose,
}: {
  snippet: Snippet | null;
  onSave: (raw: string) => Promise<void>;
  onClose: () => void;
}) {
  const initial =
    snippet?.raw ??
    serializeSnippet(
      {
        id: "my-new-snippet",
        title: "My new snippet",
        description: "Describe what this snippet does.",
        category: "Utilities",
        tags: ["example"],
        javaVersion: 8,
      },
      'System.out.println("Hello, Java!");',
    );
  const [raw, setRaw] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [discard, setDiscard] = useState(false);
  const parsed = useMemo(() => {
    try {
      return { snippet: parseSnippet(raw), error: "" };
    } catch (e) {
      return { snippet: null, error: (e as Error).message };
    }
  }, [raw]);
  async function save() {
    setBusy(true);
    setError("");
    try {
      await onSave(raw);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        className="editor modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <header>
          <div>
            <div className="eyebrow">LIBRARY EDITOR</div>
            <h2 id="editor-title">
              {snippet ? "Edit snippet" : "Create a snippet"}
            </h2>
          </div>
          <button
            aria-label="Close editor"
            disabled={busy}
            onClick={() => (raw !== initial ? setDiscard(true) : onClose())}
          >
            <X size={20} />
          </button>
        </header>
        <div className="editor-hint">
          Edit YAML metadata and Markdown. Use <code>```java primary</code> to
          choose a primary block. Imports are qualified names without
          semicolons.
        </div>
        <div className="editor-grid">
          <div className="source-editor">
            <div className="section-label">MARKDOWN SOURCE</div>
            <textarea
              aria-label="Snippet Markdown"
              autoFocus
              spellCheck={false}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                  e.preventDefault();
                  if (!parsed.error && !busy) void save();
                }
                if (e.key === "Tab") {
                  e.preventDefault();
                  const t = e.currentTarget,
                    p = t.selectionStart;
                  setRaw(raw.slice(0, p) + "    " + raw.slice(t.selectionEnd));
                  requestAnimationFrame(() => {
                    t.selectionStart = t.selectionEnd = p + 4;
                  });
                }
              }}
            />
          </div>
          <div className="editor-preview">
            <div className="section-label">
              <Code2 size={14} /> LIVE JAVA PREVIEW
            </div>
            {parsed.snippet ? (
              <>
                <h3>{parsed.snippet.title}</h3>
                <p>{parsed.snippet.description}</p>
                <CodeView code={parsed.snippet.code} />
                {parsed.snippet.notes && (
                  <p className="notes-text">{parsed.snippet.notes}</p>
                )}
              </>
            ) : (
              <p className="error-inline">
                <AlertCircle size={16} />
                {parsed.error}
              </p>
            )}
          </div>
        </div>
        {error && (
          <p className="error-inline" role="alert">
            {error}
          </p>
        )}
        <footer>
          <span className={parsed.error ? "invalid" : "valid"}>
            {parsed.error || "Metadata valid · formatting preserved"}
          </span>
          <button
            className="primary"
            onClick={() => void save()}
            disabled={busy || !!parsed.error}
          >
            <Save size={16} />
            {busy ? "Saving…" : "Save snippet"}
          </button>
        </footer>
        {discard && (
          <div className="discard-bar">
            <span>Discard your unsaved changes?</span>
            <button onClick={() => setDiscard(false)}>Keep editing</button>
            <button className="danger" onClick={onClose}>
              Discard changes
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
