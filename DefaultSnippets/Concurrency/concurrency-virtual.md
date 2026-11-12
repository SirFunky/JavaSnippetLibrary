---
id: concurrency-virtual
title: Use a virtual thread executor
description: Run blocking tasks on lightweight virtual threads.
category: Concurrency
subcategory: Executors
tags:
  - concurrency
  - virtual-thread
  - java21
javaVersion: 21
imports:
  - java.util.concurrent.Executors
  - java.util.concurrent.Future
---

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    Future<String> result = executor.submit(() -> "Task complete");
    System.out.println(result.get());
}
```

## Notes

Requires Java 21. Closing waits for tasks to finish. Virtual threads help blocking I/O workloads, not CPU throughput. get() can throw InterruptedException or ExecutionException.
