---
id: maps-group
title: Group items by their first character
description: Build a map of names grouped by starting character.
category: Collections
subcategory: Maps
tags:
  - map
  - group
  - stream
javaVersion: 8
imports:
  - java.util.List
  - java.util.Map
  - java.util.stream.Collectors
---

```java
Map<Character, List<String>> grouped = names.stream()
    .filter(name -> name != null && !name.isEmpty())
    .collect(Collectors.groupingBy(name -> name.charAt(0)));
```

## Notes

Grouping uses the first UTF-16 code unit. Supplementary Unicode characters require codePointAt().
