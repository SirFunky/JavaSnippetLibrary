---
id: strings-join
title: Join strings with a delimiter
description: Combine a list of values into one readable string.
category: Strings
subcategory: Formatting
tags:
  - string
  - join
javaVersion: 8
imports:
  - java.util.List
---

```java
String joined = String.join(", ", names);
```

## Notes

names is an Iterable of strings. Null elements become the literal text "null".
