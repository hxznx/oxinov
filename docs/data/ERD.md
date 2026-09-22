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

This is the logical model; see [DATA-MODEL.md](DATA-MODEL.md) for ownership and [DATABASE-DESIGN.md](DATABASE-DESIGN.md) for physical constraints. Add detailed cardinality with the first migration.
