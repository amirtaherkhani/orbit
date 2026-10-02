import type { DataSourcePlugin } from "@/core/plugins/contracts"
import { jsonFrameProtocol } from "@/plugins/protocols/json-frame-protocol"

export const sqlGatewayPlugin: DataSourcePlugin = {
  manifest: {
    id: "datasource.sql-gateway",
    name: "SQL gateway",
    version: "1.0.0",
    kind: "datasource",
    description:
      "Queries approved SQL definitions through a server-side gateway",
  },
  capabilities: {
    query: true,
    stream: false,
    serverSideCredentials: true,
  },
  query: async (request) => {
    const response = await fetch("/api/datasources/sql/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceId: request.sourceId,
        datasetId: request.datasetId,
        metricId: request.metricId,
        timeRange: request.timeRange,
        parameters: request.parameters,
      }),
      signal: request.signal,
    })

    if (!response.ok) {
      throw new Error(`SQL gateway query failed with ${response.status}`)
    }

    return jsonFrameProtocol.decode(await response.json())
  },
}
