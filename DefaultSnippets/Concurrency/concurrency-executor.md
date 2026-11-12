---
id: concurrency-executor
title: Run tasks in a thread pool
description: Submit a task and shut down the executor reliably.
category: Concurrency
subcategory: Executors
tags:
  - concurrency
  - executor
  - thread
javaVersion: 8
imports:
  - java.util.concurrent.ExecutorService
  - java.util.concurrent.Executors
  - java.util.concurrent.Future
---

```java
ExecutorService executor = Executors.newFixedThreadPool(2);
try {
    Future<Integer> result = executor.submit(() -> 6 * 7);
    System.out.println(result.get());
} finally {
    executor.shutdown();
}
```

## Notes

get() blocks and may throw InterruptedException or ExecutionException. shutdown() accepts no new tasks but lets existing work finish.
