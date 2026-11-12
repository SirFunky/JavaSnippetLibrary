---
id: javafx-button
title: Handle a JavaFX button click
description: Attach an action handler to a JavaFX button.
category: JavaFX
subcategory: Events
tags:
  - javafx
  - button
  - event
javaVersion: 17
imports:
  - javafx.scene.control.Button
dependency: Requires OpenJFX 17+ (org.openjfx:javafx-controls:17.0.12), platform libraries and module-path setup.
---

```java
Button button = new Button("Say hello");
button.setOnAction(event -> {
    System.out.println("Hello from JavaFX!");
});
```

## Notes

Create controls and update the UI on the JavaFX application thread after toolkit initialization. Add the button to a Scene to display it.
