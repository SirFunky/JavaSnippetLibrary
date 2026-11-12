---
id: maps-default
title: Read a map value with a default
description: Use a fallback when a map does not contain a key.
category: Collections
subcategory: Maps
tags:
  - map
  - default
javaVersion: 8
imports:
  - java.util.Map
---

```java
String value = settings.getOrDefault("theme", "dark");
```

## Notes

If the key exists with a null value, this returns null rather than the fallback.
