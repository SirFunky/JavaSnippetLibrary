---
id: streams-sum
title: Sum integer values
description: Calculate an integer total from a collection.
category: Collections
subcategory: Streams
tags:
  - stream
  - sum
  - integer
javaVersion: 8
---

```java
int total = numbers.stream()
    .mapToInt(Integer::intValue)
    .sum();
```

## Notes

Null elements cause NullPointerException. Integer sums can overflow; use mapToLong for a wider result.
