import type { DataFrame, ProtocolPlugin } from "@/core/plugins/contracts"
import type { DataPoint } from "@/types/dashboard"

function isDataPoint(value: unknown): value is DataPoint {
  if (!value || typeof value !== "object") return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.label === "string" &&
    typeof candidate.value === "number" &&
    Number.isFinite(candidate.value)
  )
}

export const jsonFrameProtocol: ProtocolPlugin = {
  manifest: {
    id: "protocol.json-frame",
    name: "JSON data frame",
    version: "1.0.0",
    kind: "protocol",
    description:
      "Decodes normalized JSON frames from query and stream gateways",
  },
  decode: (payload: unknown): DataFrame => {
    if (!payload || typeof payload !== "object") {
      throw new Error("Data frame payload must be an object")
    }

    const candidate = payload as Record<string, unknown>
    if (!Array.isArray(candidate.points)) {
      throw new Error("Data frame payload is missing points")
    }

    return {
      name: typeof candidate.name === "string" ? candidate.name : "Query",
      points: candidate.points.filter(isDataPoint),
    }
  },
}
