---
id: files-lines
title: Process a file line by line
description: Stream UTF-8 lines without loading the entire file.
category: Files & I/O
subcategory: Reading
tags:
  - file
  - lines
  - stream
javaVersion: 8
imports:
  - java.nio.file.Files
  - java.nio.file.Paths
  - java.nio.charset.StandardCharsets
  - java.util.stream.Stream
---

```java
try (Stream<String> lines = Files.lines(
        Paths.get("example.txt"), StandardCharsets.UTF_8)) {
    lines.filter(line -> !line.trim().isEmpty())
        .forEach(System.out::println);
}
```

## Notes

Throws IOException when opening the file and may throw UncheckedIOException during traversal. Always close the stream.
