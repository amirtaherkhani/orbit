import type { DashboardExporterPlugin } from "@/core/plugins/contracts"

export const jsonDashboardExporter: DashboardExporterPlugin = {
  manifest: {
    id: "exporter.dashboard-json",
    name: "Dashboard JSON",
    version: "1.0.0",
    kind: "exporter",
    description: "Portable, versioned Orbit dashboard document",
  },
  mediaType: "application/json",
  extension: "json",
  serialize: (document) => JSON.stringify(document, null, 2),
  deserialize: (value) => JSON.parse(value) as unknown,
}
