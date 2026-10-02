import type { DataFrame, QueryRequest } from "@/core/plugins/contracts"
import type { PluginRegistry } from "@/core/plugins/registry"

export type QueryPipeline = {
  dataSourcePluginId: string
  filterPluginIds?: string[]
  transformPluginIds?: string[]
}

export class QueryRuntime {
  private readonly activeQueries = new Map<string, Promise<DataFrame>>()
  private readonly plugins: PluginRegistry

  constructor(plugins: PluginRegistry) {
    this.plugins = plugins
  }

  private applyPipeline(
    frame: DataFrame,
    request: QueryRequest,
    pipeline: QueryPipeline
  ) {
    const filtered = (pipeline.filterPluginIds ?? []).reduce(
      (current, pluginId) => {
        const plugin = this.plugins.getFilter(pluginId)
        if (!plugin) throw new Error(`Unknown filter plugin: ${pluginId}`)
        return plugin.filter(current, request.parameters)
      },
      frame
    )

    return (pipeline.transformPluginIds ?? []).reduce((current, pluginId) => {
      const plugin = this.plugins.getTransform(pluginId)
      if (!plugin) throw new Error(`Unknown transform plugin: ${pluginId}`)
      return plugin.transform(current, request.parameters)
    }, filtered)
  }

  execute(request: QueryRequest, pipeline: QueryPipeline) {
    const key = JSON.stringify({
      pipeline,
      sourceId: request.sourceId,
      datasetId: request.datasetId,
      metricId: request.metricId,
      timeRange: request.timeRange,
      parameters: request.parameters,
    })
    const active = this.activeQueries.get(key)
    if (active) return active

    const dataSource = this.plugins.getDataSource(pipeline.dataSourcePluginId)
    if (!dataSource) {
      return Promise.reject(
        new Error(`Unknown data source plugin: ${pipeline.dataSourcePluginId}`)
      )
    }

    const query = dataSource
      .query(request)
      .then((frame) => this.applyPipeline(frame, request, pipeline))
      .finally(() => this.activeQueries.delete(key))

    this.activeQueries.set(key, query)
    return query
  }

  subscribe(
    request: QueryRequest,
    pipeline: QueryPipeline,
    onFrame: (frame: DataFrame) => void
  ) {
    const dataSource = this.plugins.getDataSource(pipeline.dataSourcePluginId)
    if (!dataSource?.subscribe) {
      throw new Error(
        `Data source plugin does not support streaming: ${pipeline.dataSourcePluginId}`
      )
    }

    return dataSource.subscribe(request, (frame) =>
      onFrame(this.applyPipeline(frame, request, pipeline))
    )
  }
}
