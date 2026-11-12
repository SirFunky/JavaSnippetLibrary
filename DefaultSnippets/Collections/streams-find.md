---
id: streams-find
title: Find the first matching item
description: Safely handle a stream that may have no matching value.
category: Collections
subcategory: Streams
tags:
  - stream
  - optional
  - find
javaVersion: 8
imports:
  - java.util.Optional
---

```java
Optional<String> match = names.stream()
    .filter(name -> name != null && name.startsWith("A"))
    .findFirst();
match.ifPresent(System.out::println);
```

## Notes

Avoid Optional.get() without checking presence. Encounter order is preserved for ordered streams.
