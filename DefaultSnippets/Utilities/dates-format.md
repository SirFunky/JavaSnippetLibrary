---
id: dates-format
title: Format a date
description: Format today using the immutable date and time API.
category: Utilities
subcategory: Date & time
tags:
  - date
  - format
  - time
javaVersion: 8
imports:
  - java.time.LocalDate
  - java.time.format.DateTimeFormatter
---

```java
String formatted = LocalDate.now().format(
    DateTimeFormatter.ISO_LOCAL_DATE
);
```

## Notes

LocalDate.now() uses the system time zone. DateTimeFormatter is immutable and thread safe.
