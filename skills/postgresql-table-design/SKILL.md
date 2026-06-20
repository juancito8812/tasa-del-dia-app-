---
name: postgresql-table-design
description: Use this skill when designing or reviewing a PostgreSQL-specific schema. Covers best-practices, data types, indexing, constraints, performance patterns, and advanced features.
---

# PostgreSQL Table Design

## Core Rules

- Define a **PRIMARY KEY** for reference tables. Prefer `BIGINT GENERATED ALWAYS AS IDENTITY`; use `UUID` only when global uniqueness/opacity is needed.
- **Normalize first (to 3NF)**; denormalize only for measured, high-ROI reads.
- Add **NOT NULL** everywhere semantically required; use **DEFAULT**s for common values.
- Create **indexes for access paths you query**: PK/unique (auto), **FK columns (manual!)**, frequent filters/sorts, join keys.
- Prefer **TIMESTAMPTZ** for event time; **NUMERIC** for money; **TEXT** for strings; **BIGINT** for integers.

## Data Types

- **IDs**: `BIGINT GENERATED ALWAYS AS IDENTITY` preferred; `UUID` for distributed/federated systems
- **Strings**: prefer `TEXT`; use `CHECK (LENGTH(col) <= n)` instead of `VARCHAR(n)`
- **Money**: `NUMERIC(p,s)` — never float
- **Time**: `TIMESTAMPTZ` for timestamps, `DATE` for date-only, `INTERVAL` for durations
- **JSONB**: preferred over JSON; index with **GIN**. Only for optional/semi-structured attrs
- **DO NOT use**: `timestamp`, `char(n)`, `varchar(n)`, `money`, `timetz`, `serial`

## Indexing

- **B-tree**: default for equality/range (`=`, `<`, `>`, `BETWEEN`, `ORDER BY`)
- **Composite**: order matters — most selective/filtered column first
- **Covering**: `CREATE INDEX ON tbl (id) INCLUDE (name, email)`
- **Partial**: for hot subsets (`WHERE status = 'active'`)
- **GIN**: JSONB containment (`@>`), arrays, full-text search
- **GiST**: ranges, geometry, exclusion constraints
- **BRIN**: very large, naturally ordered data (time-series)

## Table Types

- **Regular**: default, fully durable
- **TEMPORARY**: session-scoped, auto-dropped
- **UNLOGGED**: persistent but not crash-safe — faster writes

## Partitioning

- For very large tables (>100M rows) where queries filter on partition key
- **RANGE**: time-series (`PARTITION BY RANGE (created_at)`)
- **LIST**: discrete values (`PARTITION BY LIST (region)`)
- **HASH**: even distribution (`PARTITION BY HASH (user_id)`)
- Prefer declarative partitioning. Do NOT use table inheritance.

## Constraints

- **PK**: implicit UNIQUE + NOT NULL; creates B-tree index
- **FK**: specify `ON DELETE/UPDATE`; add explicit index on referencing column
- **UNIQUE**: allows multiple NULLs unless `NULLS NOT DISTINCT` (PG15+)
- **CHECK**: row-local; NULL passes (three-valued logic) — combine with `NOT NULL`
- **EXCLUDE**: prevents overlapping values (double-booking prevention)

## PostgreSQL Gotchas

- Unquoted identifiers → lowercased. Use `snake_case`.
- FK columns are **not** auto-indexed — add them.
- Sequences/identity have gaps (normal — don't "fix").
- Heap storage: no clustered PK by default.
- MVCC: updates/deletes leave dead tuples — vacuum handles them.
