---
id: patterns-singleton
title: Create a lazy singleton
description: Use the initialization-on-demand holder idiom.
category: Design Patterns
subcategory: Creational
tags:
  - pattern
  - singleton
  - lazy
javaVersion: 8
---

```java
public final class AppConfig {
    private AppConfig() {}

    private static class Holder {
        private static final AppConfig INSTANCE = new AppConfig();
    }

    public static AppConfig getInstance() {
        return Holder.INSTANCE;
    }
}
```

## Notes

Save as AppConfig.java. Class initialization safely publishes the instance. Mutable state inside the singleton still needs its own concurrency policy.
