---
id: sets-intersection
title: Find the intersection of two sets
description: Keep the values present in both input sets.
category: Collections
subcategory: Sets
tags:
  - set
  - intersection
javaVersion: 8
imports:
  - java.util.HashSet
  - java.util.Set
---

```java
Set<String> common = new HashSet<>(first);
common.retainAll(second);
```

## Notes

The input sets are unchanged. Iteration order of HashSet is unspecified.
