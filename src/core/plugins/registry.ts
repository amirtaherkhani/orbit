import type {
  DashboardExporterPlugin,
  DataSourcePlugin,
  FilterPlugin,
  PanelPlugin,
  ProtocolPlugin,
  TransformPlugin,
} from "@/core/plugins/contracts"

export class PluginRegistry {
  private readonly dataSources = new Map<string, DataSourcePlugin>()
  private readonly transforms = new Map<string, TransformPlugin>()
  private readonly filters = new Map<string, FilterPlugin>()
  private readonly protocols = new Map<string, ProtocolPlugin>()
  private readonly panels = new Map<string, PanelPlugin>()
  private readonly exporters = new Map<string, DashboardExporterPlugin>()

  registerDataSource(plugin: DataSourcePlugin) {
    this.dataSources.set(plugin.manifest.id, plugin)
    return this
  }

  registerTransform(plugin: TransformPlugin) {
    this.transforms.set(plugin.manifest.id, plugin)
    return this
  }

  registerFilter(plugin: FilterPlugin) {
    this.filters.set(plugin.manifest.id, plugin)
    return this
  }

  registerProtocol(plugin: ProtocolPlugin) {
    this.protocols.set(plugin.manifest.id, plugin)
    return this
  }

  registerPanel(plugin: PanelPlugin) {
    this.panels.set(plugin.manifest.id, plugin)
    return this
  }

  registerExporter(plugin: DashboardExporterPlugin) {
    this.exporters.set(plugin.manifest.id, plugin)
    return this
  }

  getDataSource(id: string) {
    return this.dataSources.get(id)
  }

  getTransform(id: string) {
    return this.transforms.get(id)
  }

  getFilter(id: string) {
    return this.filters.get(id)
  }

  getProtocol(id: string) {
    return this.protocols.get(id)
  }

  getExporter(id: string) {
    return this.exporters.get(id)
  }

  listPanels() {
    return [...this.panels.values()]
  }
}
