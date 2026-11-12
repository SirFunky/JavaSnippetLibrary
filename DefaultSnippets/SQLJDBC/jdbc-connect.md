---
id: jdbc-connect
title: Open a JDBC connection
description: Connect to a database and close the connection automatically.
category: SQL & JDBC
subcategory: Connections
tags:
  - jdbc
  - sql
  - connection
javaVersion: 8
imports:
  - java.sql.Connection
  - java.sql.DriverManager
dependency: A JDBC driver for your database is required at runtime.
---

```java
try (Connection connection = DriverManager.getConnection(
        jdbcUrl, username, password)) {
    System.out.println("Connected: " + !connection.isClosed());
}
```

## Notes

Throws SQLException. Supply a JDBC URL, credentials, and a compatible driver on the classpath. Keep credentials outside source code.
