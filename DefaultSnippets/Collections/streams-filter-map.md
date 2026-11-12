---
id: streams-filter-map
title: Filter and transform a stream
description: Keep nonempty names and convert them to uppercase.
category: Collections
subcategory: Streams
tags:
  - stream
  - filter
  - map
javaVersion: 8
imports:
  - java.util.List
  - java.util.Locale
  - java.util.stream.Collectors
---

```java
List<String> uppercase = names.stream()
    .filter(name -> name != null && !name.isEmpty())
    .map(name -> name.toUpperCase(Locale.ROOT))
    .collect(Collectors.toList());
```

## Notes

Locale.ROOT avoids machine-specific casing. Streams can be consumed only once.
