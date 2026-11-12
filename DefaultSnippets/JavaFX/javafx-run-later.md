---
id: javafx-run-later
title: Update JavaFX from a background task
description: Schedule a UI update on the JavaFX application thread.
category: JavaFX
subcategory: Threading
tags:
  - javafx
  - thread
  - ui
javaVersion: 17
imports:
  - javafx.application.Platform
dependency: Requires OpenJFX 17+ (org.openjfx:javafx-controls:17.0.12), platform libraries and module-path setup.
---

```java
Platform.runLater(() -> {
    label.setText("Task complete");
});
```

## Notes

label is an existing javafx.scene.control.Label. The JavaFX runtime must already be initialized. Avoid flooding the event queue.
