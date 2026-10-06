import * as React from "react"

import { OrbitMark } from "@/components/branding/orbit-mark"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChartLineIcon,
  ClockIcon,
  LayoutDashboardIcon,
  PlusIcon,
} from "@/components/ui/icon-library"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, type TabItem } from "@/components/ui/tabs"
import type { DashboardDocument } from "@/types/dashboard"

type DashboardLibraryProps = {
  dashboards: DashboardDocument[]
  currentId: string | null
  onOpen: (id: string) => void
  onCreate: (title: string) => boolean
  onReturn: () => void
}

function savedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Saved dashboard"
  return `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date)}`
}

function DashboardPreview({ document }: { document: DashboardDocument }) {
  const panels = document.dashboard.panels.slice(0, 6)
  return (
    <div className="dashboard-library-preview" aria-label={`Preview of ${document.title}`}>
      <div className="dashboard-library-preview-top">
        <span className="dashboard-library-preview-mark"><OrbitMark /></span>
        <span className="dashboard-library-preview-title">{document.title}</span>
        <span className="dashboard-library-preview-live"><span /> Saved</span>
      </div>
      <div className="dashboard-library-preview-grid">
        {panels.length ? panels.map((panel, index) => (
          <div className="dashboard-library-preview-tile" key={panel.id}>
            <span className="dashboard-library-preview-tile-index">{String(index + 1).padStart(2, "0")}</span>
            <ChartLineIcon aria-hidden="true" />
            <strong>{panel.title}</strong>
            <small>{panel.chartType.replaceAll("-", " ")}</small>
          </div>
        )) : (
          <div className="dashboard-library-preview-empty">
            <LayoutDashboardIcon aria-hidden="true" />
            Ready for your first panel
          </div>
        )}
      </div>
    </div>
  )
}

export function DashboardLibrary({
  dashboards,
  currentId,
  onOpen,
  onCreate,
  onReturn,
}: DashboardLibraryProps) {
  const [selectedId, setSelectedId] = React.useState(currentId ?? dashboards[0]?.id ?? "")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const activeId = dashboards.some((item) => item.id === selectedId)
    ? selectedId
    : currentId ?? dashboards[0]?.id ?? ""

  const createDashboard = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = title.trim()
    if (!name || !onCreate(name)) return
    setCreateOpen(false)
    setTitle("")
  }

  const tabs: TabItem[] = dashboards.map((document, index) => ({
    title: document.title,
    value: document.id,
    content: (
      <section className="dashboard-library-feature" aria-label={document.title}>
        <div className="dashboard-library-feature-copy">
          <span className="section-kicker">Dashboard {String(index + 1).padStart(2, "0")} / {String(dashboards.length).padStart(2, "0")}</span>
          <h2>{document.title}</h2>
          <div className="dashboard-library-feature-meta">
            <span><LayoutDashboardIcon aria-hidden="true" /> {document.dashboard.panels.length} panels</span>
            <span><ClockIcon aria-hidden="true" /> {document.timeRange}</span>
          </div>
          <p>{savedAt(document.updatedAt)} · Saved in this browser</p>
          <Button onClick={() => onOpen(document.id)}>
            Open dashboard <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
        <DashboardPreview document={document} />
      </section>
    ),
  }))

  return (
    <main className="dashboard-library">
      <header className="topbar dashboard-library-topbar">
        <div className="topbar-title-group">
          <div>
            <div className="topbar-eyebrow">Workspace / dashboards</div>
            <h1 className="type-page-heading">Dashboards</h1>
          </div>
        </div>
        <div className="dashboard-library-topbar-actions">
          <Button variant="outline" onClick={onReturn} aria-label="Return to editor">
            <ArrowLeftIcon data-icon="inline-start" /> <span>Editor</span>
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" /> New dashboard
          </Button>
        </div>
      </header>

      <div className="dashboard-library-content">
        <div className="dashboard-library-intro">
          <div>
            <span className="section-kicker">Your workspace</span>
            <h2>Saved dashboards <span>{dashboards.length.toString().padStart(2, "0")}</span></h2>
            <p>Choose a dashboard to inspect its panels or continue editing.</p>
          </div>
          <span className="dashboard-library-local-label">Stored in this browser</span>
        </div>

        {tabs.length ? (
          <Tabs tabs={tabs} value={activeId} onValueChange={setSelectedId} />
        ) : (
          <div className="dashboard-library-empty">
            <div className="dashboard-library-empty-icon"><LayoutDashboardIcon /></div>
            <h2>No saved dashboards yet</h2>
            <p>Save your current dashboard to see it here, or create a new one.</p>
            <Button variant="outline" onClick={onReturn}>Return to editor</Button>
          </div>
        )}
      </div>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="dashboard-library-create-sheet">
          <SheetHeader>
            <SheetTitle>New dashboard</SheetTitle>
            <SheetDescription>Name your dashboard. You can add panels in the editor and save it when it is ready.</SheetDescription>
          </SheetHeader>
          <form onSubmit={createDashboard} className="dashboard-library-create-form">
            <label htmlFor="new-dashboard-title">Dashboard name</label>
            <Input
              id="new-dashboard-title"
              autoFocus
              maxLength={72}
              placeholder="e.g. Platform health"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Button type="submit" disabled={!title.trim()}>Create dashboard</Button>
          </form>
        </SheetContent>
      </Sheet>
    </main>
  )
}
