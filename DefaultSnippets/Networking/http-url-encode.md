---
id: http-url-encode
title: Encode a query parameter
description: Encode a value for a URL query string.
category: Networking
subcategory: URLs
tags:
  - url
  - encode
  - query
javaVersion: 8
imports:
  - java.net.URLEncoder
  - java.nio.charset.StandardCharsets
---

```java
String encoded = URLEncoder.encode(
    "Java & coffee", StandardCharsets.UTF_8.name()
);
```

## Notes

Throws UnsupportedEncodingException, although UTF-8 is always supported. Encodes form-style query values (spaces become +); not a whole URL or path segment.
