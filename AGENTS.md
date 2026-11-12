# Java Snippet Library development

This is an offline Windows desktop app, not a hosted service. Keep runtime assets bundled. Do not add accounts, telemetry, network APIs, a database, Java execution, or a general frontend filesystem/shell interface.

## Architecture and conventions

- TypeScript strict mode; React function components and hooks; meaningful typed interfaces in `src/models`.
- UI orchestration lives in `src/App.tsx`. Extract new substantial UI sections into `src/components`; hooks go in `src/hooks`.
- `services/markdown.ts` owns metadata validation, Markdown parsing and serialization. Never assume pasted/imported content is valid. Treat code and notes as text. Shiki is the only trusted generated HTML.
- `search/search.ts` owns search weights and combined filters. Generate categories/tags from metadata. Java-version filtering means snippet minimum <= user's selected version.
- `services/storage.ts` switches between Tauri commands and a clearly labeled browser-local preview. Do not silently fall back from failed native storage to browser storage.
- Rust commands in `src-tauri/src/lib.rs` restrict access to the library and fixed configuration paths. Keep path traversal, symlink/reparse checks, file-size limits, duplicate ID validation, original-content conflict detection and atomic writes. Export destinations require the native save dialog.
- Favorites/history/preferences stay outside snippet content. First-run seeding must never overwrite user files or re-add deleted defaults on normal launches.
- Snippets are raw UTF-8 `.md` files. Preserve entire Markdown on edit/import/export and indentation on copy. Support multiple blocks and exactly one optional primary fence.
- Themes use CSS variables. Keep keyboard interactions, modal focus, accessible labels, visible focus, reduced motion and both themes working.
- Avoid broad refactors unrelated to the task. Do not regenerate defaults when editing an individual example. `scripts/seed-snippets.mjs` documents original generation; rerunning it overwrites bundled source examples.

## Required verification

Run `npm test` and `npm run build` for frontend changes. Run `npm run test:ui` for interaction changes (uses Edge). Run `cargo test --manifest-path src-tauri/Cargo.toml` for native changes, or `powershell -ExecutionPolicy Bypass -File scripts/desktop.ps1 test` for the ignored local Rust toolchain. Rustfmt changed Rust files. Do not claim native behavior was checked by browser tests.

For Java example changes run `node scripts/verify-java.mjs` with JDK 21+; add context variables there for new examples. This is compile-time verification at the declared minimum release, not integration testing against external services. Label all third-party dependencies and checked exceptions accurately.

`npm run installer` creates NSIS output under `src-tauri/target/release/bundle/nsis/`. The first package build requires network downloads. Don't install Rust globally if the existing `.tools/` toolchain is suitable. Never check in `.tools`, `node_modules`, `dist`, `target` or generated test artifacts. Commit both npm and Cargo lockfiles with dependency changes.
