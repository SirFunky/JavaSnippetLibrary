---
id: basics-parse-int
title: Parse an integer safely
description: Handle invalid or out-of-range numeric input.
category: Java Basics
subcategory: Conversion
tags:
  - integer
  - parse
  - exception
javaVersion: 8
---

```java
try {
    int value = Integer.parseInt(text.trim());
    System.out.println(value);
} catch (NumberFormatException ex) {
    System.err.println("Please enter a valid integer.");
}
```

## Notes

Expects non-null text. This handles invalid numeric input and integer overflow, not null references.
