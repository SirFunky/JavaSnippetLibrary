---
id: files-list-directory
title: List files in a directory
description: List immediate regular files and close the directory stream.
category: Files & I/O
subcategory: Directories
tags:
  - directory
  - list
  - files
javaVersion: 8
imports:
  - java.nio.file.Files
  - java.nio.file.Paths
  - java.nio.file.Path
  - java.util.stream.Stream
---

```java
try (Stream<Path> entries = Files.list(Paths.get("."))) {
    entries.filter(Files::isRegularFile)
        .forEach(System.out::println);
}
```

## Notes

Does not recurse into subdirectories. isRegularFile follows symbolic links by default. Throws IOException; iteration can throw UncheckedIOException.
