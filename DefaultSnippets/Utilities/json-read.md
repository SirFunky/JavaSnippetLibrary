---
id: json-read
title: Parse JSON with Jackson
description: Read a JSON document into a tree and access a field.
category: Utilities
subcategory: JSON
tags:
  - json
  - jackson
  - parse
javaVersion: 8
imports:
  - com.fasterxml.jackson.databind.ObjectMapper
  - com.fasterxml.jackson.databind.JsonNode
dependency: Requires com.fasterxml.jackson.core:jackson-databind:2.17.3 (Java 8+).
---

```java
ObjectMapper mapper = new ObjectMapper();
JsonNode root = mapper.readTree("{\"name\":\"Ada\"}");
String name = root.path("name").asText();
```

## Notes

readTree may throw JsonProcessingException. Reuse a configured ObjectMapper. Configure it before concurrent use.
