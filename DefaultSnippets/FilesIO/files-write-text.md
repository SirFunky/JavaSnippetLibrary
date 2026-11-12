---
id: files-write-text
title: Write a text file
description: Write UTF-8 text, creating or replacing a file.
category: Files & I/O
subcategory: Writing
tags:
  - file
  - write
  - nio
javaVersion: 11
imports:
  - java.nio.file.Files
  - java.nio.file.Path
  - java.nio.charset.StandardCharsets
---

```java
Files.writeString(
    Path.of("output.txt"),
    "Hello, Java!",
    StandardCharsets.UTF_8
);
```

## Notes

Throws IOException. Replaces existing content. Parent directories must already exist.
