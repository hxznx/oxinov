# Entity relationships

```mermaid
erDiagram
  TENANT ||--o{ TENANT_MEMBERSHIP : has
  USER_PROFILE ||--o{ TENANT_MEMBERSHIP : joins
  TENANT ||--o{ COURSE : owns
  COURSE ||--o{ COURSE_VERSION : versions
  COURSE_VERSION ||--o{ LESSON : contains
  COURSE ||--o{ ENROLLMENT : enrolls
  USER_PROFILE ||--o{ ENROLLMENT : studies
  ENROLLMENT ||--o{ EXAM_ATTEMPT : takes
  EXAM_ATTEMPT ||--|| EXAM_RESULT : yields
  ENROLLMENT ||--o{ ENTITLEMENT : justified_by
  TENANT ||--o{ PAYMENT : records
```

This is the logical model; see [DATA-MODEL.md](../../05-data/data-model.md) for ownership and [DATABASE-DESIGN.md](../../05-data/database-design.md) for physical constraints. Add detailed cardinality with the first migration.
