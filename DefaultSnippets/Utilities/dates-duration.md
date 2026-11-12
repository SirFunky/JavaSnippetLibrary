---
id: dates-duration
title: Measure elapsed time
description: Use a monotonic clock to measure code execution.
category: Utilities
subcategory: Date & time
tags:
  - time
  - duration
  - benchmark
javaVersion: 8
imports:
  - java.util.concurrent.TimeUnit
---

```java
long started = System.nanoTime();
// Run the operation to measure here.
long elapsedMillis = TimeUnit.NANOSECONDS.toMillis(
    System.nanoTime() - started
);
```

## Notes

nanoTime is for elapsed time, not timestamps. Use JMH for reliable microbenchmarks.
