---
id: json-write
title: Serialize a map to JSON
description: Create a formatted JSON document using Jackson.
category: Utilities
subcategory: JSON
tags:
  - json
  - jackson
  - serialize
javaVersion: 8
imports:
  - com.fasterxml.jackson.databind.ObjectMapper
  - java.util.LinkedHashMap
  - java.util.Map
dependency: Requires com.fasterxml.jackson.core:jackson-databind:2.17.3 (Java 8+).
---

```java
Map<String, Object> data = new LinkedHashMap<>();
data.put("name", "Ada");
data.put("active", true);
String json = new ObjectMapper()
    .writerWithDefaultPrettyPrinter()
    .writeValueAsString(data);
```

## Notes

Throws JsonProcessingException. A LinkedHashMap preserves field insertion order. Reuse ObjectMapper in production.
