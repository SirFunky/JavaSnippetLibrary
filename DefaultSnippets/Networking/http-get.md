---
id: http-get
title: Send an HTTP GET request
description: Fetch a resource using the built-in HTTP client.
category: Networking
subcategory: HTTP
tags:
  - http
  - request
  - client
javaVersion: 11
imports:
  - java.net.URI
  - java.net.http.HttpClient
  - java.net.http.HttpRequest
  - java.net.http.HttpResponse
  - java.time.Duration
---

```java
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(10))
    .build();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://example.com"))
    .timeout(Duration.ofSeconds(20))
    .GET()
    .build();
HttpResponse<String> response = client.send(
    request, HttpResponse.BodyHandlers.ofString()
);
System.out.println(response.statusCode());
System.out.println(response.body());
```

## Notes

Requires network access when used in your own project. send() blocks and throws IOException or InterruptedException. Check status codes before consuming the body; do not block a UI thread.
