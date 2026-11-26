# tasa-del-dia-app- — AGENTS.md

App React Native (Expo) de tasas del día (dólar/BCV/etc. para Venezuela). Se publica APK vía
GitHub Releases (`release-automatic.yml`: tag → release).

## Comandos

```bash
npm ci && npm test && npx expo start
```

## Grafo de conocimiento (understand-anything)

Este repo tiene un grafo de conocimiento listo en `.ua/knowledge-graph.json`: nodos (files,
endpoints, tables, flows de negocio), aristas y dominios. **Para entender el código, lee primero
el grafo** — no el árbol completo. Uso y regeneración: `../GRAFOS-CODIGO.md` (raíz del workspace).
En Hermes hay skills `understand-*` listas. El `.ua/` no se commitea (regenerable).

## Trampas

- Cambios de modelo/stack solo con OK del dueño.
- Rama con trabajo sin commitear: revisar `git status` antes de tocar.
