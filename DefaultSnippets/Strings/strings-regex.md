---
id: strings-regex
title: Extract numbers with a regular expression
description: Find each sequence of digits in a string.
category: Strings
subcategory: Regular expressions
tags:
  - regex
  - pattern
  - parsing
javaVersion: 8
imports:
  - java.util.regex.Pattern
  - java.util.regex.Matcher
---

```java
Pattern pattern = Pattern.compile("\\d+");
Matcher matcher = pattern.matcher(text);
while (matcher.find()) {
    System.out.println(matcher.group());
}
```

## Notes

Compile and reuse Pattern for repeated work. Matcher is mutable and is not thread safe.
