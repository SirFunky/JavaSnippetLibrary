---
id: lists-deduplicate
title: Remove duplicate list values
description: Preserve encounter order while removing duplicates.
category: Collections
subcategory: Lists
tags:
  - list
  - distinct
  - deduplicate
javaVersion: 8
imports:
  - java.util.ArrayList
  - java.util.LinkedHashSet
  - java.util.List
---

```java
List<String> unique = new ArrayList<>(new LinkedHashSet<>(names));
```

## Notes

Values must implement consistent equals() and hashCode(). The resulting list is mutable.
