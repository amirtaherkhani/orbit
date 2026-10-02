# Orbit v1 Architecture

Orbit is a dashboard runtime with registered plugins around a stable dashboard document. The React UI composes plugins; it does not own connector or transformation logic.

## Runtime

```text
Dashboard UI
    ↓
Dashboard document + panel model
    ↓
Plugin registry
    ├── Panel plugins
    ├── Data source plugins
    ├── Filter plugins
    ├── Protocol plugins
    ├── Transform plugins
    └── Export plugins
    ↓
Query runtime
    ↓
Datasource gateway / live stream
```

The query path is intentionally ordered:

```text
Read → Decode → Filter → Clean → Downsample → Format → Render
```

`src/core/plugins/contracts.ts` is the extension boundary. Built-ins are assembled in `src/plugins/builtins.ts`; UI modules consume the registry instead of maintaining independent lists.

## v1 Plugins

| Kind | Built-in | Responsibility |
|---|---|---|
| Panel | Line, bar, area, donut, gauge, stat, table, logs, alerts | Visualization metadata and selection |
| Datasource | Catalog, live stream, SQL gateway | Query normalized data frames |
| Protocol | JSON frame | Validate/decode connector payloads |
| Filter | Time window | Reduce frames before visualization |
| Transform | Cleanup, bucket downsampling, value formatting | Normalize and bound data |
| Exporter | Dashboard JSON | Portable versioned dashboard documents |

## Data Sources

The browser-facing datasource contract returns normalized `DataFrame` values. SQL connections must run through `/api/datasources/sql/query`; database credentials, raw connection strings, and unrestricted SQL never belong in the browser. The gateway should enforce authenticated datasource IDs, approved query definitions, parameter binding, row/time limits, cancellation, and audit logs.

Live adapters use one external store per stream and a bounded ring buffer. React panels subscribe with `useSyncExternalStore`, so streaming updates do not rerender the full dashboard. Production WebSocket/SSE adapters should add reconnect backoff, sequence IDs, stale-state reporting, and server-side aggregation.

## Persistence

Dashboard files use `schemaVersion: 1` and contain dashboard identity, time range, panels, and grid positions. The loader migrates the previous unversioned local-storage snapshot. Import validates the document before applying it; export produces portable JSON.

## Performance Boundaries

- Keep a maximum point count per live series.
- Downsample before rendering dense time series.
- Subscribe only panels that use a stream.
- Cancel superseded queries with `AbortSignal`.
- Deduplicate identical in-flight queries in the query runtime.
- Keep panels independent so heavy visualizations can be lazy-loaded later.

## Next Production Slices

1. Implement the authenticated SQL/query gateway and datasource provisioning API.
2. Replace the demo stream producer with WebSocket/SSE transport plugins.
3. Add dashboard CRUD, ownership, RBAC, folders, and revision history.
4. Add query inspection, panel errors, stale data, and datasource health.
5. Add alert rule editing and server-side evaluation; the current alert panel is a viewer.
6. Split chart plugins into lazy chunks and virtualize long log/table panels.
