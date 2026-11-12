---
id: concurrency-future
title: Run work asynchronously
description: Transform a result using CompletableFuture.
category: Concurrency
subcategory: Futures
tags:
  - concurrency
  - future
  - async
javaVersion: 8
imports:
  - java.util.concurrent.CompletableFuture
---

```java
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> "hello")
    .thenApply(String::toUpperCase);
System.out.println(future.join());
```

## Notes

Uses the common ForkJoinPool. join() blocks and wraps failures in CompletionException. Supply a dedicated executor for blocking workloads.
