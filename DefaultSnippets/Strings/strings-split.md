---
id: strings-split
title: Split comma-separated text
description: Split text on commas and trim surrounding whitespace.
category: Strings
subcategory: Parsing
tags:
  - string
  - split
  - regex
javaVersion: 8
imports:
  - java.util.Arrays
  - java.util.List
  - java.util.stream.Collectors
---

```java
List<String> values = Arrays.stream(text.split(",", -1))
    .map(String::trim)
    .collect(Collectors.toList());
```

## Notes

The -1 argument preserves trailing empty values. This is not a CSV parser: quoted commas need a CSV library.
