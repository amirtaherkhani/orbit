import { PluginRegistry } from "@/core/plugins/registry"
import { QueryRuntime } from "@/core/runtime/query-runtime"
import { liveStreamPlugin } from "@/plugins/datasources/live-stream-plugin"
import { sqlGatewayPlugin } from "@/plugins/datasources/sql-gateway-plugin"
import { staticCatalogPlugin } from "@/plugins/datasources/static-catalog-plugin"
import { jsonDashboardExporter } from "@/plugins/exporters/json-dashboard-exporter"
import { timeWindowFilter } from "@/plugins/filters/time-window-filter"
import { builtinPanelPlugins } from "@/plugins/panels/builtin-panels"
import { jsonFrameProtocol } from "@/plugins/protocols/json-frame-protocol"
import { builtinTransformPlugins } from "@/plugins/transforms/builtin-transforms"

export const dashboardPlugins = new PluginRegistry()
  .registerDataSource(staticCatalogPlugin)
  .registerDataSource(liveStreamPlugin)
  .registerDataSource(sqlGatewayPlugin)
  .registerFilter(timeWindowFilter)
  .registerProtocol(jsonFrameProtocol)
  .registerExporter(jsonDashboardExporter)

builtinTransformPlugins.forEach((plugin) =>
  dashboardPlugins.registerTransform(plugin)
)
builtinPanelPlugins.forEach((plugin) => dashboardPlugins.registerPanel(plugin))

export const queryRuntime = new QueryRuntime(dashboardPlugins)
