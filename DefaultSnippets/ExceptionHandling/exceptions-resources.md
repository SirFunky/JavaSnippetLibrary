---
id: exceptions-resources
title: Close resources automatically
description: Use try-with-resources for a buffered UTF-8 reader.
category: Exception Handling
subcategory: Resources
tags:
  - exception
  - resource
  - file
javaVersion: 8
imports:
  - java.nio.file.Files
  - java.nio.file.Paths
  - java.nio.charset.StandardCharsets
  - java.io.BufferedReader
  - java.io.IOException
---

```java
try (BufferedReader reader = Files.newBufferedReader(
        Paths.get("example.txt"), StandardCharsets.UTF_8)) {
    System.out.println(reader.readLine());
} catch (IOException ex) {
    System.err.println("Could not read file: " + ex.getMessage());
}
```

## Notes

The reader closes even when an exception occurs. readLine() returns null at end of file. Choose an error handling policy appropriate to your application.
