use include_dir::{include_dir, Dir};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::{Read, Write},
    path::{Component, Path, PathBuf},
    sync::Mutex,
};
use tauri::{Manager, State};

static DEFAULTS: Dir = include_dir!("$CARGO_MANIFEST_DIR/../DefaultSnippets");
const MAX_FILE: u64 = 2_000_000;
struct Library {
    root: PathBuf,
    preferences: PathBuf,
    lock: Mutex<()>,
}
#[derive(Serialize)]
struct LibraryFile {
    path: String,
    content: String,
}
#[derive(Serialize)]
struct LibraryResult {
    files: Vec<LibraryFile>,
    errors: Vec<String>,
    folder: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Metadata {
    id: String,
    title: String,
    description: String,
    category: String,
    subcategory: Option<String>,
    tags: Vec<String>,
    java_version: u32,
    imports: Option<Vec<String>>,
    related: Option<Vec<String>>,
    dependency: Option<String>,
}

fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}
fn valid_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 180
        && id.split('-').all(|part| {
            !part.is_empty()
                && part
                    .bytes()
                    .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
        })
}
fn metadata(content: &str) -> Result<Metadata, String> {
    if content.len() as u64 > MAX_FILE {
        return Err("Snippet exceeds the 2 MB limit.".into());
    }
    let text = content.trim_start_matches('\u{feff}').replace("\r\n", "\n");
    let rest = text
        .strip_prefix("---\n")
        .ok_or("Missing YAML frontmatter.")?;
    let (yaml, body) = rest
        .split_once("\n---\n")
        .ok_or("Missing frontmatter closing delimiter.")?;
    let m: Metadata = serde_yaml::from_str(yaml).map_err(err)?;
    if !valid_id(&m.id)
        || m.title.trim().is_empty()
        || m.description.trim().is_empty()
        || m.category.trim().is_empty()
        || !(8..=99).contains(&m.java_version)
        || m.tags.iter().any(|t| t.trim().is_empty())
    {
        return Err("Invalid required metadata.".into());
    }
    if m.imports.as_ref().is_some_and(|v| {
        v.iter()
            .any(|x| x.trim().is_empty() || x.contains(['\n', '\r', ';']))
    }) || m
        .related
        .as_ref()
        .is_some_and(|v| v.iter().any(|x| x.trim().is_empty()))
    {
        return Err("Invalid imports or related snippets.".into());
    }
    let _ = (&m.subcategory, &m.dependency);
    let mut in_java = false;
    let mut in_other = false;
    let mut has_code = false;
    let mut block_has_code = false;
    let mut primary = false;
    let mut primary_count = 0;
    let mut block_count = 0;
    let mut first_has_code = None;
    let mut primary_has_code = None;
    for line in body.lines() {
        let line = line.trim_end();
        if line == "```" && (in_java || in_other) {
            if in_java {
                first_has_code.get_or_insert(block_has_code);
                if primary {
                    primary_has_code = Some(block_has_code);
                }
                block_count += 1;
                has_code |= block_has_code;
            }
            in_java = false;
            in_other = false;
        } else if !in_java && !in_other && line.starts_with("```") {
            let language = line
                .strip_prefix("```")
                .unwrap()
                .split_whitespace()
                .collect::<Vec<_>>();
            in_java = language == ["java"] || language == ["java", "primary"];
            in_other = !in_java;
            primary = language == ["java", "primary"];
            primary_count += u32::from(primary);
            block_has_code = false;
        } else if in_java && !line.trim().is_empty() {
            block_has_code = true;
        }
    }
    if in_java || primary_count > 1 {
        return Err("Close every Java fence and mark at most one block primary.".into());
    }
    if !has_code || block_count == 0 {
        return Err("A nonempty fenced Java block is required.".into());
    }
    if !primary_has_code.or(first_has_code).unwrap_or(false) {
        return Err("The primary Java code block cannot be empty.".into());
    }
    Ok(m)
}
// Restrict every operation to an ordinary, relative .md file under the library.
// Reject reparse points/symlinks in every existing path component, including root.
fn reject_links(path: &Path) -> Result<(), String> {
    let mut current = PathBuf::new();
    for part in path.components() {
        current.push(part);
        match fs::symlink_metadata(&current) {
            Ok(meta) => {
                if meta.file_type().is_symlink() {
                    return Err("Symbolic links are not supported in the library path.".into());
                }
                #[cfg(windows)]
                {
                    use std::os::windows::fs::MetadataExt;
                    if meta.file_attributes() & 0x400 != 0 {
                        return Err("Reparse points are not supported in the library path.".into());
                    }
                }
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => return Err(err(e)),
        }
    }
    Ok(())
}
fn safe_path(root: &Path, relative: &str) -> Result<PathBuf, String> {
    let path = Path::new(relative);
    if path
        .components()
        .any(|c| !matches!(c, Component::Normal(_)))
        || relative.contains(':')
        || path.extension().and_then(|x| x.to_str()) != Some("md")
    {
        return Err("Invalid library file path.".into());
    }
    let target = root.join(path);
    reject_links(&target)?;
    Ok(target)
}
fn read_text(path: &Path) -> Result<String, String> {
    let file = fs::File::open(path).map_err(err)?;
    if file.metadata().map_err(err)?.len() > MAX_FILE {
        return Err("File exceeds the 2 MB limit.".into());
    }
    let mut text = String::new();
    file.take(MAX_FILE + 1)
        .read_to_string(&mut text)
        .map_err(err)?;
    if text.len() as u64 > MAX_FILE {
        return Err("File exceeds the 2 MB limit.".into());
    }
    Ok(text)
}
fn atomic_write(path: &Path, content: &str, create_only: bool) -> Result<(), String> {
    let parent = path.parent().ok_or("Missing parent directory.")?;
    let mut temp = tempfile::NamedTempFile::new_in(parent).map_err(err)?;
    temp.write_all(content.as_bytes()).map_err(err)?;
    temp.as_file().sync_all().map_err(err)?;
    if create_only {
        temp.persist_noclobber(path).map_err(err)?;
    } else {
        temp.persist(path).map_err(err)?;
    }
    Ok(())
}
fn seed(dir: &Dir, root: &Path) -> Result<(), String> {
    for file in dir.files() {
        let target = root.join(file.path());
        reject_links(&target)?;
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent).map_err(err)?;
        }
        if !target.exists() {
            let content = file
                .contents_utf8()
                .ok_or("Default snippet is not UTF-8.")?;
            atomic_write(&target, content, true)?;
        }
    }
    for child in dir.dirs() {
        seed(child, root)?;
    }
    Ok(())
}
fn scan(root: &Path, dir: &Path, files: &mut Vec<LibraryFile>, errors: &mut Vec<String>) {
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(e) => {
            errors.push(format!("{}: {e}", dir.display()));
            return;
        }
    };
    for entry in entries {
        let entry = match entry {
            Ok(x) => x,
            Err(e) => {
                errors.push(err(e));
                continue;
            }
        };
        let path = entry.path();
        if let Err(e) = reject_links(&path) {
            errors.push(format!("{}: {e}", path.display()));
            continue;
        }
        if path.is_dir() {
            scan(root, &path, files, errors);
        } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
            let relative = match path.strip_prefix(root) {
                Ok(p) => p.to_string_lossy().replace('\\', "/"),
                Err(e) => {
                    errors.push(err(e));
                    continue;
                }
            };
            match read_text(&path) {
                Ok(content) => files.push(LibraryFile {
                    path: relative,
                    content,
                }),
                Err(e) => errors.push(format!("{}: {e}", path.display())),
            }
        }
    }
}
#[tauri::command]
fn load_library(state: State<Library>) -> Result<LibraryResult, String> {
    let _guard = state.lock.lock().map_err(err)?;
    reject_links(&state.root)?;
    let mut files = vec![];
    let mut errors = vec![];
    scan(&state.root, &state.root, &mut files, &mut errors);
    Ok(LibraryResult {
        files,
        errors,
        folder: state.root.to_string_lossy().into(),
    })
}
#[tauri::command]
fn save_snippet(
    state: State<Library>,
    content: String,
    path: Option<String>,
    expected: Option<String>,
) -> Result<String, String> {
    save_library_snippet(&state, content, path, expected)
}
fn save_library_snippet(
    state: &Library,
    content: String,
    path: Option<String>,
    expected: Option<String>,
) -> Result<String, String> {
    let _guard = state.lock.lock().map_err(err)?;
    let m = metadata(&content)?;
    let relative = path.clone().unwrap_or_else(|| format!("{}.md", m.id));
    let target = safe_path(&state.root, &relative)?;
    if path.is_some() && read_text(&target)? != expected.ok_or("Missing original file content.")? {
        return Err("This file changed outside the editor. Reload before saving.".into());
    }
    let mut files = vec![];
    let mut errors = vec![];
    scan(&state.root, &state.root, &mut files, &mut errors);
    if !errors.is_empty() {
        return Err(format!(
            "Could not check the entire library for duplicate IDs: {}",
            errors.join("; ")
        ));
    }
    for file in files {
        if file.path == relative.replace('\\', "/") {
            continue;
        }
        // Read just the YAML ID even if the rest of an existing snippet is invalid.
        let normalized = file.content.replace("\r\n", "\n");
        if let Some(front) = normalized
            .trim_start_matches('\u{feff}')
            .strip_prefix("---\n")
            .and_then(|s| s.split_once("\n---\n").map(|(yaml, _)| yaml))
        {
            if let Ok(value) = serde_yaml::from_str::<serde_yaml::Value>(front) {
                if value.get("id").and_then(|id| id.as_str()) == Some(m.id.as_str()) {
                    return Err(format!("Duplicate ID: {}", m.id));
                }
            }
        }
    }
    atomic_write(&target, &content, path.is_none())?;
    Ok(relative)
}
#[tauri::command]
fn delete_snippet(state: State<Library>, path: String, expected: String) -> Result<(), String> {
    delete_library_snippet(&state, path, expected)
}
fn delete_library_snippet(state: &Library, path: String, expected: String) -> Result<(), String> {
    let _guard = state.lock.lock().map_err(err)?;
    let target = safe_path(&state.root, &path)?;
    if read_text(&target)? != expected {
        return Err("File changed. Reload before deleting.".into());
    }
    fs::remove_file(target).map_err(err)
}
#[tauri::command]
fn load_preferences(state: State<Library>) -> Result<serde_json::Value, String> {
    let _guard = state.lock.lock().map_err(err)?;
    if !state.preferences.exists() {
        return Ok(serde_json::json!({}));
    }
    serde_json::from_str(&read_text(&state.preferences)?).map_err(err)
}
#[tauri::command]
fn save_preferences(state: State<Library>, preferences: serde_json::Value) -> Result<(), String> {
    let _guard = state.lock.lock().map_err(err)?;
    let text = serde_json::to_string_pretty(&preferences).map_err(err)?;
    if text.len() > 200_000 {
        return Err("Preferences are too large.".into());
    }
    reject_links(&state.preferences)?;
    atomic_write(&state.preferences, &text, false)
}
#[tauri::command]
fn open_library(state: State<Library>) -> Result<(), String> {
    reject_links(&state.root)?;
    #[cfg(windows)]
    {
        std::process::Command::new("explorer.exe")
            .arg(&state.root)
            .spawn()
            .map_err(err)?;
        Ok(())
    }
    #[cfg(not(windows))]
    {
        Err("Opening the library folder is supported on Windows.".into())
    }
}
#[tauri::command]
async fn export_snippet(content: String, id: String) -> Result<bool, String> {
    metadata(&content)?;
    if !valid_id(&id) {
        return Err("Invalid ID.".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        let path = rfd::FileDialog::new()
            .add_filter("Markdown", &["md"])
            .set_file_name(format!("{id}.md"))
            .save_file();
        if let Some(path) = path {
            reject_links(&path)?;
            atomic_write(&path, &content, false)?;
            Ok(true)
        } else {
            Ok(false)
        }
    })
    .await
    .map_err(err)?
}
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            let root = app.path().document_dir()?.join("Java Snippet Library");
            reject_links(&root).map_err(std::io::Error::other)?;
            fs::create_dir_all(&root)?;
            let config = app.path().app_config_dir()?;
            reject_links(&config).map_err(std::io::Error::other)?;
            fs::create_dir_all(&config)?;
            let marker = config.join("library-initialized-v1");
            if !marker.exists() {
                seed(&DEFAULTS, &root).map_err(std::io::Error::other)?;
                atomic_write(&marker, "1", true).map_err(std::io::Error::other)?;
            }
            app.manage(Library {
                root,
                preferences: config.join("preferences.json"),
                lock: Mutex::new(()),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_library,
            save_snippet,
            delete_snippet,
            load_preferences,
            save_preferences,
            open_library,
            export_snippet
        ])
        .run(tauri::generate_context!())
        .expect("Failed to start Java Snippet Library");
}

#[cfg(test)]
mod tests {
    use super::*;
    const SNIPPET:&str="---\nid: test-snippet\ntitle: Test\ndescription: Test snippet\ncategory: Utilities\ntags: []\njavaVersion: 8\n---\n\n```java\nint x = 1;\n```\n";
    #[test]
    fn validates_metadata() {
        assert!(metadata(SNIPPET).is_ok());
        assert!(metadata(&SNIPPET.replace("test-snippet", "../escape")).is_err());
    }
    #[test]
    fn validates_java_fences() {
        assert!(metadata(&SNIPPET.replace("```java", "```java   ")).is_ok());
        assert!(metadata(&SNIPPET.replace("\n```\n", "\n")).is_err());
        assert!(metadata(&format!(
            "{SNIPPET}\n```java primary\nint y=2;\n```\n```java primary\nint z=3;\n```\n"
        ))
        .is_err());
    }
    #[test]
    fn rejects_traversal() {
        let temp = tempfile::tempdir().unwrap();
        assert!(safe_path(temp.path(), "../other.md").is_err());
        assert!(safe_path(temp.path(), "C:\\other.md").is_err());
        assert!(safe_path(temp.path(), "snippet.txt").is_err());
    }
    #[test]
    fn atomic_replacement_and_no_clobber() {
        let temp = tempfile::tempdir().unwrap();
        let file = temp.path().join("test.md");
        atomic_write(&file, "original", true).unwrap();
        assert!(atomic_write(&file, "overwrite", true).is_err());
        assert_eq!(read_text(&file).unwrap(), "original");
        atomic_write(&file, "updated", false).unwrap();
        assert_eq!(read_text(&file).unwrap(), "updated");
    }
    #[test]
    fn seeds_preserve_edits() {
        let temp = tempfile::tempdir().unwrap();
        seed(&DEFAULTS, temp.path()).unwrap();
        let mut files = vec![];
        scan(temp.path(), temp.path(), &mut files, &mut vec![]);
        assert!(files.len() >= 30);
        let target = temp.path().join(&files[0].path);
        atomic_write(&target, "user edit", false).unwrap();
        seed(&DEFAULTS, temp.path()).unwrap();
        assert_eq!(read_text(&target).unwrap(), "user edit");
    }
    #[test]
    fn create_edit_duplicate_and_conflict() {
        let temp = tempfile::tempdir().unwrap();
        let state = Library {
            root: temp.path().to_owned(),
            preferences: temp.path().join("preferences.json"),
            lock: Mutex::new(()),
        };
        let path = save_library_snippet(&state, SNIPPET.into(), None, None).unwrap();
        assert!(save_library_snippet(&state, SNIPPET.into(), None, None).is_err());
        let other = SNIPPET.replace("test-snippet", "other-id");
        save_library_snippet(&state, other.clone(), None, None).unwrap();
        assert!(save_library_snippet(
            &state,
            SNIPPET.into(),
            Some("other-id.md".into()),
            Some(other)
        )
        .unwrap_err()
        .contains("Duplicate ID"));
        let updated = SNIPPET.replace("int x = 1;", "int x = 2;");
        save_library_snippet(
            &state,
            updated.clone(),
            Some(path.clone()),
            Some(SNIPPET.into()),
        )
        .unwrap();
        assert!(save_library_snippet(
            &state,
            SNIPPET.into(),
            Some(path.clone()),
            Some(SNIPPET.into())
        )
        .unwrap_err()
        .contains("changed outside"));
        assert!(delete_library_snippet(&state, path.clone(), SNIPPET.into()).is_err());
        delete_library_snippet(&state, path.clone(), updated).unwrap();
        assert!(!state.root.join(path).exists());
    }
    #[test]
    fn invalid_existing_file_still_reserves_id() {
        let temp = tempfile::tempdir().unwrap();
        let state = Library {
            root: temp.path().to_owned(),
            preferences: temp.path().join("preferences.json"),
            lock: Mutex::new(()),
        };
        fs::write(
            temp.path().join("broken.md"),
            SNIPPET.replace("```java", "```text"),
        )
        .unwrap();
        assert!(save_library_snippet(&state, SNIPPET.into(), None, None)
            .unwrap_err()
            .contains("Duplicate ID"));
    }
}
