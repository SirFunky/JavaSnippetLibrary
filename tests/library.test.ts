import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  parseSnippet,
  serializeSnippet,
  indexLibrary,
  withImports,
  validateMetadata,
} from "../src/services/markdown";
import { createSearch, categoryTree } from "../src/search/search";
import { defaultPreferences, type LibraryFile } from "../src/models/snippet";
import {
  validateSave,
  readBrowserPreferences,
  writeBrowserPreferences,
  saveSnippet,
  deleteSnippet,
  loadLibrary,
  exportSnippet,
} from "../src/services/storage";
const metadata = {
  id: "files-read",
  title: "Read text file",
  description: "Load UTF-8 text from disk.",
  category: "Files & I/O",
  subcategory: "Reading",
  tags: ["file", "read"],
  javaVersion: 11,
  imports: ["java.nio.file.Files"],
};
const raw = serializeSnippet(
  metadata,
  "String content = Files.readString(path);",
  "Throws IOException.",
);
const other = serializeSnippet(
  {
    ...metadata,
    id: "strings-join",
    title: "Join names",
    category: "Strings",
    tags: ["string"],
    javaVersion: 8,
  },
  'String text = String.join(",", names);',
);
class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  clear() {
    this.data.clear();
  }
}
beforeEach(() => {
  vi.stubGlobal("localStorage", new MemoryStorage());
});
describe("Markdown parsing and validation", () => {
  it("round trips imports, notes and indentation", () => {
    const s = parseSnippet(raw, "file.md");
    expect(s.id).toBe("files-read");
    expect(s.code).toBe("String content = Files.readString(path);");
    expect(s.notes).toBe("Throws IOException.");
    expect(withImports(s)).toBe(
      "import java.nio.file.Files;\n\nString content = Files.readString(path);",
    );
  });
  it("supports BOM and Windows newlines", () =>
    expect(parseSnippet("\uFEFF" + raw.replace(/\n/g, "\r\n")).title).toBe(
      metadata.title,
    ));
  it("selects a marked primary block", () => {
    const s = parseSnippet(raw + "\n```java primary\nint x = 2;\n```\n");
    expect(s.code).toBe("int x = 2;");
    expect(s.blocks).toHaveLength(2);
  });
  it("rejects multiple primary blocks", () =>
    expect(() =>
      parseSnippet(
        raw +
          "\n```java primary\nint x=1;\n```\n```java primary\nint y=1;\n```\n",
      ),
    ).toThrow("Only one"));
  it.each(["title", "description", "category", "id", "tags", "javaVersion"])(
    "requires %s",
    (key) => {
      const m = { ...metadata } as Record<string, unknown>;
      delete m[key];
      expect(() => validateMetadata(m)).toThrow();
    },
  );
  it("rejects invalid versions, imports and unsafe IDs", () => {
    for (const patch of [
      { javaVersion: 7 },
      { javaVersion: 8.5 },
      { id: "../escape" },
      { imports: ["import x;"] },
      { tags: [""] },
    ])
      expect(() => validateMetadata({ ...metadata, ...patch })).toThrow();
  });
  it("rejects malformed YAML, duplicate YAML keys and missing code", () => {
    expect(() => parseSnippet("no frontmatter")).toThrow();
    expect(() =>
      parseSnippet(raw.replace("id: files-read", "id: a\nid: b")),
    ).toThrow();
    expect(() => parseSnippet(raw.replace("```java", "```text"))).toThrow(
      "Java",
    );
  });
  it("reports invalid files while keeping valid files", () => {
    const r = indexLibrary([
      { path: "bad.md", content: "bad" },
      { path: "ok.md", content: raw },
    ]);
    expect(r.snippets).toHaveLength(1);
    expect(r.errors[0]).toContain("bad.md");
  });
  it("reports duplicate IDs", () => {
    const r = indexLibrary([
      { path: "a.md", content: raw },
      { path: "b.md", content: raw },
    ]);
    expect(r.snippets).toHaveLength(1);
    expect(r.errors[0]).toContain("Duplicate ID");
  });
});
describe("Search and filters", () => {
  const snippets = [parseSnippet(raw), parseSnippet(other)];
  const search = createSearch(snippets);
  const filter = {
    category: "all",
    tag: "",
    version: "",
    favorites: [] as string[],
  };
  it("finds typos and code content", () => {
    expect(search("reed text file", filter)[0].id).toBe("files-read");
    expect(search("String.join", filter)[0].id).toBe("strings-join");
  });
  it("prioritizes title matches", () =>
    expect(search("read", filter)[0].id).toBe("files-read"));
  it("combines category, tags, version and favorites", () => {
    expect(
      search("", {
        ...filter,
        category: "Files & I/O/Reading",
        tag: "file",
        version: "11",
      }),
    ).toHaveLength(1);
    expect(search("", { ...filter, version: "8" }).map((s) => s.id)).toEqual([
      "strings-join",
    ]);
    expect(
      search("", {
        ...filter,
        category: "favorites",
        favorites: ["files-read"],
      }),
    ).toHaveLength(1);
    expect(search("", { ...filter, category: "Files" })).toHaveLength(0);
    expect(search("", { ...filter, tag: "missing" })).toHaveLength(0);
  });
  it("generates categories from metadata", () =>
    expect(
      categoryTree(snippets).find((c) => c.name === "Files & I/O")?.children,
    ).toEqual(["Reading"]));
});
describe("Persistence and library management", () => {
  it("reserves IDs in files with invalid code blocks", () => {
    expect(() =>
      validateSave(
        [{ path: "broken.md", content: raw.replace("```java", "```text") }],
        raw,
        null,
      ),
    ).toThrow("Duplicate ID");
  });
  it("persists favorites separately and handles malformed preferences", () => {
    const s = new MemoryStorage();
    writeBrowserPreferences(
      { ...defaultPreferences, favorites: ["files-read"] },
      s,
    );
    expect(readBrowserPreferences(s).favorites).toEqual(["files-read"]);
    s.setItem("jsl.preferences.v1", "bad");
    expect(readBrowserPreferences(s).favorites).toEqual([]);
  });
  it("blocks duplicate IDs when creating or editing", () => {
    const files = [
      { path: "one.md", content: raw },
      { path: "two.md", content: other },
    ];
    expect(() => validateSave(files, raw, null)).toThrow("Duplicate");
    expect(() => validateSave(files, raw, "two.md")).toThrow("Duplicate");
    expect(validateSave(files, raw, "one.md").id).toBe("files-read");
  });
  it("creates, edits and deletes while checking stale changes", async () => {
    await loadLibrary();
    const content = serializeSnippet(
      { ...metadata, id: "test-create" },
      "int value = 1;",
    );
    const path = await saveSnippet(content, null, null);
    await expect(saveSnippet(content, null, null)).rejects.toThrow("Duplicate");
    const update = content.replace("int value = 1", "int value = 2");
    await saveSnippet(update, path, content);
    await expect(saveSnippet(content, path, content)).rejects.toThrow(
      "changed",
    );
    await expect(deleteSnippet(path, content)).rejects.toThrow("changed");
    await deleteSnippet(path, update);
    expect((await loadLibrary()).files.some((f) => f.path === path)).toBe(
      false,
    );
  });
  it("imports and exports losslessly", async () => {
    localStorage.setItem("jsl.library.v1", "[]");
    const path = await saveSnippet(raw, null, null);
    const file = (await loadLibrary()).files.find((f) => f.path === path)!;
    expect(file.content).toBe(raw);
    let blob: Blob | undefined;
    vi.stubGlobal("URL", {
      createObjectURL: (b: Blob) => {
        blob = b;
        return "blob:test";
      },
      revokeObjectURL: vi.fn(),
    });
    const click = vi.fn();
    vi.stubGlobal("document", { createElement: () => ({ click }) });
    await exportSnippet(file.content, "files-read");
    expect(click).toHaveBeenCalled();
    expect(await blob!.text()).toBe(raw);
  });
  it("does not reseed an intentionally empty library", async () => {
    localStorage.setItem("jsl.library.v1", "[]");
    expect((await loadLibrary()).files).toEqual([]);
  });
});
describe("Bundled collection", () => {
  it("has at least 30 valid, unique snippets across the requested categories", () => {
    function files(dir: string): LibraryFile[] {
      return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory()
          ? files(join(dir, e.name))
          : [
              {
                path: join(dir, e.name),
                content: readFileSync(join(dir, e.name), "utf8"),
              },
            ],
      );
    }
    const result = indexLibrary(files("DefaultSnippets"));
    expect(result.errors).toEqual([]);
    expect(result.snippets.length).toBeGreaterThanOrEqual(30);
    expect(categoryTree(result.snippets)).toHaveLength(11);
    expect(
      result.snippets.filter((s) => s.dependency).length,
    ).toBeGreaterThanOrEqual(4);
  });
});
