---
name: vercel-react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering. Use when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel React Best Practices

Comprehensive performance optimization guide for React and Next.js applications, maintained by Vercel. Contains 70 rules across 8 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

## Key Rules

### 1. Eliminating Waterfalls (CRITICAL)
- `async-parallel` — Use `Promise.all()` for independent operations
- `async-suspense-boundaries` — Use Suspense to stream content
- `async-defer-await` — Move await into branches where actually used
- `async-cheap-condition-before-await` — Check cheap conditions before awaiting

### 2. Bundle Size Optimization (CRITICAL)
- `bundle-barrel-imports` — Import directly, avoid barrel files
- `bundle-dynamic-imports` — Use `next/dynamic` for heavy components
- `bundle-analyzable-paths` — Prefer statically analyzable import paths
- `bundle-defer-third-party` — Load analytics/logging after hydration

### 3. Server-Side Performance (HIGH)
- `server-cache-react` — Use `React.cache()` for per-request deduplication
- `server-parallel-fetching` — Restructure components to parallelize fetches
- `server-serialization` — Minimize data passed to client components
- `server-after-nonblocking` — Use `after()` for non-blocking operations

### 4. Re-render Optimization (MEDIUM)
- `rerender-memo` — Extract expensive work into memoized components
- `rerender-derived-state` — Derive state during render, not effects
- `rerender-transitions` — Use `startTransition` for non-urgent updates
- `rerender-use-deferred-value` — Defer expensive renders
- `rerender-no-inline-components` — Don't define components inside components

### 5. Rendering Performance (MEDIUM)
- `rendering-content-visibility` — Use `content-visibility` for long lists
- `rendering-hoist-jsx` — Extract static JSX outside components
- `rendering-activity` — Use Activity component for show/hide

### 6. JavaScript Performance (LOW-MEDIUM)
- `js-set-map-lookups` — Use Set/Map for O(1) lookups
- `js-batch-dom-css` — Group CSS changes via classes or cssText
- `js-early-exit` — Return early from functions
- `js-hoist-regexp` — Hoist RegExp creation outside loops

## How to Use

For the complete guide with all 70 rules expanded, see the original source at `https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices`
