---
id: jdbc-prepared
title: Query with a prepared statement
description: Bind a parameter and read matching rows safely.
category: SQL & JDBC
subcategory: Queries
tags:
  - jdbc
  - sql
  - prepared-statement
javaVersion: 8
imports:
  - java.sql.PreparedStatement
  - java.sql.ResultSet
dependency: A JDBC driver and configured database connection are required.
---

```java
String sql = "SELECT id, name FROM users WHERE email = ?";
try (PreparedStatement statement = connection.prepareStatement(sql)) {
    statement.setString(1, email);
    try (ResultSet results = statement.executeQuery()) {
        while (results.next()) {
            System.out.println(results.getLong("id") + ": "
                + results.getString("name"));
        }
    }
}
```

## Notes

Throws SQLException. connection must be open and the users table must exist. Parameters bind values, not table or column names.
