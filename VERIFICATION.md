# Verification — November 12, 2026

Verified on Windows 11 x64 with Node.js 22.15, Rust 1.100 (MSVC), Visual Studio 2022 C++ tools, Microsoft Edge and JDK 24.

- **25 frontend unit tests passed**: frontmatter parsing, metadata validation, multiple/primary blocks, duplicate IDs (including invalid existing files), fuzzy and code search, combined filters, generated categories, preference/favorites persistence, CRUD with edit conflict detection, lossless import/export, empty libraries and all bundled metadata.
- **7 Rust tests passed**: metadata/fences, path traversal rejection, atomic replacement without clobbering new files, first-run seeding that preserves edits, native CRUD, duplicate ID rejection and stale edit/delete detection. Filesystem tests run outside the execution sandbox because its Windows rename restrictions prevent atomic file replacement in temporary directories.
- **2 Edge end-to-end tests passed** against the production frontend: browsing, search, clipboard contents, persistent favorites/category after reload, editing/creation, Markdown import/export, deletion, invalid metadata, duplicate ID rejection, empty results, keyboard navigation/Escape, light/dark themes, font settings, collapsed navigation and minimum window layout.
- **TypeScript and production Vite build passed**. Java-only Shiki highlighting is bundled in a separate local chunk.
- **All 36 Java examples compiled with `javac --release` at their declared minimum version** (8, 11, 17 or 21). Jackson 2.17.3 and OpenJFX 17.0.12 examples compile against those exact dependencies.
- **Tauri Windows release and per-user NSIS installer built successfully**. The native executable was launched and visibly loaded all 36 snippets from the initialized Documents library.
- **npm audit reported zero known vulnerabilities** after updating the development test runner.

## Limits

The Edge tests exercise the browser storage adapter, not native dialogs or the Windows clipboard plugin. Rust tests cover actual disk persistence; the desktop launch is a separate visual smoke check. The installer is built but has not been installed over another release, and is unsigned. Windows 10 is a supported target but was not tested on a separate Windows 10 machine.

Java verification checks compilation, not live external services or every behavioral edge case. HTTP, JDBC and JavaFX examples need their documented runtime context in the consumer's project. The library never runs snippets. The app works offline; development dependency downloads and installing WebView2 on machines missing it require network access or separately supplied offline installers.

Notes are displayed as safe plain text. Library file changes refresh on focus/manual refresh or every eight seconds while visible. Symbolic links and Windows reparse points in library paths are unsupported. See README.md for storage, backup and build instructions.
