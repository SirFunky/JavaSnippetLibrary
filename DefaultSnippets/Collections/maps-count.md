---
id: maps-count
title: Count occurrences in a map
description: Accumulate how often each word appears.
category: Collections
subcategory: Maps
tags:
  - map
  - count
  - merge
javaVersion: 8
imports:
  - java.util.HashMap
  - java.util.Map
---

```java
Map<String, Integer> counts = new HashMap<>();
for (String word : words) {
    counts.merge(word, 1, Integer::sum);
}
```

## Notes

HashMap is not thread safe. Keys may be null; merge values must be non-null.
