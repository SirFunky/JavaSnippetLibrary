---
id: files-create-directories
title: Create nested directories
description: Create a directory and any missing parent directories.
category: Files & I/O
subcategory: Directories
tags:
  - directory
  - create
  - nio
javaVersion: 8
imports:
  - java.nio.file.Files
  - java.nio.file.Paths
  - java.nio.file.Path
---

```java
Path directory = Files.createDirectories(
    Paths.get("output", "reports", "daily")
);
```

## Notes

Throws IOException. Existing directories are accepted; an existing regular file at the target causes an error.
