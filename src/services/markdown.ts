import { parse, stringify } from "yaml";
import type { Metadata, Snippet, LibraryFile } from "../models/snippet";
const required = ["id", "title", "description", "category"] as const;
export function validateMetadata(value: unknown): Metadata {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Metadata must be a YAML object.");
  const m = value as Record<string, unknown>;
  for (const key of required)
    if (typeof m[key] !== "string" || !(m[key] as string).trim())
      throw new Error(`${key} is required.`);
  if (
    (m.id as string).length > 180 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.id as string)
  )
    throw new Error(
      "ID must use lowercase letters, numbers and single hyphens (maximum 180 characters).",
    );
  if (
    !Number.isInteger(m.javaVersion) ||
    Number(m.javaVersion) < 8 ||
    Number(m.javaVersion) > 99
  )
    throw new Error("Minimum Java version must be an integer from 8 to 99.");
  if (
    !Array.isArray(m.tags) ||
    !m.tags.every((t) => typeof t === "string" && t.trim())
  )
    throw new Error("Tags must be a list of nonempty strings.");
  for (const key of ["imports", "related"])
    if (
      m[key] !== undefined &&
      (!Array.isArray(m[key]) ||
        !(m[key] as unknown[]).every((t) => typeof t === "string" && t.trim()))
    )
      throw new Error(`${key} must be a list of nonempty strings.`);
  for (const key of ["subcategory", "dependency"])
    if (m[key] !== undefined && typeof m[key] !== "string")
      throw new Error(`${key} must be text.`);
  if (
    m.imports &&
    (m.imports as string[]).some(
      (t) =>
        !/^(?:static )?[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*(?:\.\*)?$/.test(
          t,
        ),
    )
  )
    throw new Error(
      "Imports must be qualified Java names without import or semicolon.",
    );
  return m as unknown as Metadata;
}
export function parseSnippet(raw: string, path = ""): Snippet {
  if (new TextEncoder().encode(raw).length > 2_000_000)
    throw new Error("Snippet exceeds the 2 MB limit.");
  const normalized = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) throw new Error("Missing YAML frontmatter.");
  const metadata = validateMetadata(
    parse(match[1], { uniqueKeys: true, maxAliasCount: 0 }),
  );
  const body = normalized.slice(match[0].length);
  const matches = [
    ...body.matchAll(
      /^```java(?:[ \t]+(primary))?[ \t]*\n([\s\S]*?)^```[ \t]*$/gm,
    ),
  ];
  if (!matches.length || matches.every((m) => !m[2].trim()))
    throw new Error(
      "At least one nonempty fenced Java code block is required.",
    );
  if (matches.filter((m) => m[1]).length > 1)
    throw new Error("Only one Java block may be marked primary.");
  const primary = matches.find((m) => m[1]) ?? matches[0];
  if (!primary[2].trim())
    throw new Error("Primary code block cannot be empty.");
  const blocks = matches.map((m) => m[2].replace(/\n$/, ""));
  const notes = body
    .replace(/^```[^\n]*\n[\s\S]*?^```[ \t]*$/gm, "")
    .replace(/^##\s+Notes\s*$/m, "")
    .trim();
  return {
    ...metadata,
    code: primary[2].replace(/\n$/, ""),
    blocks,
    notes,
    raw,
    path,
  };
}
export function indexLibrary(files: LibraryFile[]) {
  const snippets: Snippet[] = [],
    errors: string[] = [],
    ids = new Set<string>();
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path)))
    try {
      const snippet = parseSnippet(file.content, file.path);
      if (ids.has(snippet.id)) throw new Error(`Duplicate ID: ${snippet.id}`);
      ids.add(snippet.id);
      snippets.push(snippet);
    } catch (error) {
      errors.push(`${file.path}: ${(error as Error).message}`);
    }
  snippets.sort((a, b) => a.title.localeCompare(b.title));
  return { snippets, errors };
}
/** Reserve IDs even when another field or a code block in the file is invalid. */
export function frontmatterId(raw: string): string | undefined {
  try {
    const match = raw
      .replace(/^\uFEFF/, "")
      .replace(/\r\n/g, "\n")
      .match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
    if (!match) return;
    const value = parse(match[1], { uniqueKeys: true, maxAliasCount: 0 });
    return typeof value?.id === "string" ? value.id : undefined;
  } catch {
    return;
  }
}
export function serializeSnippet(
  metadata: Metadata,
  code: string,
  notes = "",
): string {
  return `---\n${stringify(metadata, { lineWidth: 0 })}---\n\n\`\`\`java\n${code}\n\`\`\`\n${notes ? `\n## Notes\n\n${notes}\n` : ""}`;
}
export function withImports(s: Snippet) {
  return [
    ...(s.imports ?? []).map((i) => `import ${i};`),
    ...(s.imports?.length ? [""] : []),
    s.code,
  ].join("\n");
}
