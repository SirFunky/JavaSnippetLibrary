---
id: lists-remove
title: Remove matching list elements
description: Remove blank values from a mutable list.
category: Collections
subcategory: Lists
tags:
  - list
  - remove
  - filter
javaVersion: 11
---

```java
names.removeIf(name -> name == null || name.isBlank());
```

## Notes

The list must support removal. Arrays.asList() and List.of() do not support this operation.
