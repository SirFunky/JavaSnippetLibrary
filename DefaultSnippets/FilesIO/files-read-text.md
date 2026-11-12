---
id: files-read-text
title: Read a text file
description: Read an entire UTF-8 text file into a String.
category: Files & I/O
subcategory: Reading
tags:
  - file
  - read
  - nio
javaVersion: 11
imports:
  - java.nio.file.Files
  - java.nio.file.Path
  - java.nio.charset.StandardCharsets
related:
  - files-lines
  - files-write-text
---

```java
String content = Files.readString(
    Path.of("example.txt"),
    StandardCharsets.UTF_8
);
```

## Notes

Throws IOException. The surrounding method must handle or declare it. Loads the entire file into memory; use a buffered reader for large files.
