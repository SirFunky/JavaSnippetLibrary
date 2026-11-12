# Java Snippet Library

A local-first Windows 10/11 desktop workbench for reusable Java. Tauri 2, React, TypeScript, Vite, Tailwind CSS, Fuse.js and a bundled Shiki Java highlighter. No server, account, database, telemetry, CDN or network dependency at runtime.

## Launch

Install the generated `Java Snippet Library_1.0.0_x64-setup.exe` from `src-tauri/target/release/bundle/nsis/`, then launch **Java Snippet Library** from the Start menu. The unpackaged `src-tauri/target/release/java-snippet-library.exe` also runs directly. Java and Node are **not** required to run the app.

Microsoft Edge WebView2 Runtime is required. Most Windows 10/11 installations already have it; the installer downloads it if missing. For installation on a disconnected machine, install Microsoft's offline Evergreen WebView2 installer first. The app itself works completely offline.

## Your library

On first desktop launch, the app copies 36 bundled Markdown examples into **Documents\Java Snippet Library** (the OS-resolved Documents folder). It records initialization separately and does not overwrite edits or restore intentionally deleted examples on subsequent launches.

Preferences, favorites, recent history and panel widths live separately in `%APPDATA%\dev.javasnippets.library\preferences.json`. The window-state plugin also stores placement in the app configuration directory. Uninstalling or updating the program does not require deleting your Markdown library. Back up the library folder to back up your content.

Use **New snippet** or **Ctrl+N** to create a snippet. The integrated Markdown editor validates YAML metadata and provides a syntax-highlighted Java preview. **Ctrl+S** saves. Edit the metadata arrays to add/remove tags or assign categories and subcategories; the navigation tree updates automatically. Edit, export and delete controls are above the preview. Deletion requires confirmation. **Import snippets** accepts one or more Markdown files; each valid file imports independently, and failures are reported. Duplicate IDs are rejected, including during edits and imports.

You can also place or edit `.md` files directly in the library, including nested folders. The app reloads on window focus, with **Refresh**, and every eight seconds while visible. Invalid/unreadable files are listed as library issues; valid files remain available. If a file changes while its editor is open, saving is refused so you can reload it. Writes use a temporary file, flush and atomic replacement. Symlinks and Windows reparse points inside the library path are deliberately refused; use an ordinary Documents/library directory. Files must be UTF-8 and no larger than 2 MB.

## Markdown format

````markdown
---
id: files-read-text
title: Read a text file
description: Read UTF-8 text into a String.
category: Files & I/O
subcategory: Reading
tags: [file, read, nio]
javaVersion: 11
imports:
  - java.nio.file.Files
  - java.nio.file.Path
related: [files-lines]
---

```java
String content = Files.readString(Path.of("example.txt"));
```

## Notes

Throws IOException. Handle or declare it. Loads the entire file into memory.
````

Required fields: `id`, `title`, `description`, `category`, `tags` (may be empty), and integer `javaVersion` (8–99). IDs use lowercase letters, digits and single hyphens, maximum 180 characters. Optional: `subcategory`, `imports`, `related` (IDs), and `dependency` (text describing third-party requirements). Imports contain qualified Java names without the `import` keyword or semicolon; static imports use `static package.Class.member`.

Use fenced `java` blocks. The first block is copied by default; mark one fence as **`java primary`** to explicitly choose it. Additional Java blocks appear separately in the preview. Copy code preserves indentation and omits imports. Copy with imports adds frontmatter imports above the primary block. Notes render as safe plain text, preserving Markdown source text and line breaks rather than executing HTML.

## Search and controls

- **Ctrl+K** focuses search; search spans title, tags, description, category and all Java code blocks, with weights in that order.
- Filter by category, tag, favorites or maximum supported Java version. For example, Java 11 compatible includes snippets requiring Java 8 or 11.
- Arrow keys, Home and End navigate focused results; Arrow Down in search moves focus into results. Escape clears search or returns focus to results.
- Star snippets to save favorites; Recently viewed keeps the last 30 IDs.
- Drag panel dividers to resize, or focus a divider and use left/right arrows. Collapse navigation with its upper-right control.
- Settings offers dark/light/system appearance and code font size. Theme changes apply immediately.

## Development

Prerequisites: Node.js 22.12+ with npm, stable Rust (MSVC target), Visual Studio 2022 C++ desktop build tools and Windows SDK, and WebView2. A JDK 21+ is only needed to verify the Java examples. Install packages once with network access:

```powershell
npm ci
npm run desktop
```

This workspace also contains a project-local Rust toolchain under ignored `.tools/`. To use it without changing your system PATH:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/desktop.ps1 dev
```

`npm run dev` starts a **browser preview** at `http://127.0.0.1:1420`. It uses browser localStorage for a separate demo library, and downloads exported files through the browser. It does not read the desktop library. Folder access is available in the desktop app. The production desktop build embeds all frontend assets and default Markdown files.

## Verification

```powershell
npm test                              # parser, validation, search, filters, persistence, CRUD, import/export
npm run build                         # strict TypeScript + production frontend
npm run test:ui                       # Edge end-to-end browser interactions
cargo test --manifest-path src-tauri/Cargo.toml
node scripts/verify-java.mjs           # javac --release at each declared minimum
```

Or run the Rust tests through `scripts/desktop.ps1 test`. Browser tests use installed Microsoft Edge. `verify-java.mjs` downloads the exact documented Jackson/OpenJFX jars into ignored `artifacts/` on its first run; it compiles all 36 snippets with explicit context variables. It does not execute external HTTP calls, SQL statements or JavaFX windows. Runtime database behavior requires your own JDBC driver/schema; network and UI examples require their normal external environment. Java examples compile but are never executed by the library application.

## Build a Windows installer

```powershell
npm run installer
# With this workspace's local Rust toolchain:
powershell -ExecutionPolicy Bypass -File scripts/desktop.ps1 build
```

Output: `src-tauri/target/release/bundle/nsis/`. The first build needs network access for Rust crates, NSIS and WebView2 packaging tools. Subsequent offline builds require those tools and dependencies to be cached. Release installers are unsigned; Windows may display SmartScreen until you sign releases with your own certificate. The installer is per user and does not require administrator access in the usual configuration.

## Architecture

- `src/models/`: snippet and preference types.
- `src/services/`: safe YAML/Markdown parsing and platform storage adapter.
- `src/search/`: weighted Fuse index, filters and metadata-derived category tree.
- `src/components/`: shared Shiki code viewer and live Markdown editor.
- `src/hooks/`: keyboard focus containment for modals.
- `src/App.tsx`, `src/styles/`: three-panel interface, navigation and interactions.
- `src-tauri/`: library-scoped filesystem commands, atomic persistence, native export dialog, clipboard and window-state integration. No general filesystem or shell plugin is exposed to the frontend.
- `DefaultSnippets/`: 36 individually editable bundled Markdown examples. These are compiled into the executable and copied only during initialization.
- `tests/`, `scripts/`: automated verification and packaging helpers.

Offline syntax highlighting includes only Java and two themes, using Shiki's JavaScript regex engine. Notes are intentionally plain text. Search is in memory; the eight-second refresh rebuilds the index after external changes. The app is intended for a single local user/library, not collaborative editing or network shares.
