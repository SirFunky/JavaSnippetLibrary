---
id: lists-sort
title: Sort a list of strings
description: Sort strings without changing the source list.
category: Collections
subcategory: Lists
tags:
  - list
  - sort
javaVersion: 8
imports:
  - java.util.ArrayList
  - java.util.Collections
  - java.util.List
---

```java
List<String> sorted = new ArrayList<>(names);
Collections.sort(sorted);
```

## Notes

Natural String order is Unicode lexicographic order, not locale aware. Null values are not supported by this comparator.
