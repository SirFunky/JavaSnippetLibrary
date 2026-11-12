---
id: strings-blank
title: Check for blank text
description: Check whether text is empty or contains only whitespace.
category: Strings
subcategory: Validation
tags:
  - string
  - blank
  - validation
javaVersion: 11
imports:
  - java.lang.String
---

```java
boolean blank = text == null || text.isBlank();
```

## Notes

The null check is intentional. String.isBlank() was introduced in Java 11.
