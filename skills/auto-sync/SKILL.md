---
name: auto-sync
description: Use after completing any code change, bug fix, or feature implementation in the tasa-del-dia-app project. Automates git commit, push, and AI_HANDOFF.md updates so the repo and handoff doc stay in sync.
---

# Auto-Sync

## Workflow

After every code change — bug fix, feature, refactor, docs — run this sequence:

### 1. Update AI_HANDOFF.md

Append or update the "Últimos Cambios" section with:
- What changed (feature, bug fix, refactor)
- Files modified
- Tests result

### 2. Verify tests

```bash
# Mobile
cd tasa-del-dia && npx jest

# Desktop
cd tasa-del-dia-desktop && pytest
```

### 3. Commit and push

```bash
git add -A
git commit -m "tipo: descripción concisa del cambio"
git push
```

## Template

```
## feature: [nombre]

| Archivo | Cambio |
|---------|--------|
| `path/to/file.js` | qué se hizo |

Tests: [N]/[N] passing
```

## When NOT to auto-sync

- Exploratory changes not ready for commit
- Changes that break tests (fix tests first)
- Experimental branches not yet pushed
