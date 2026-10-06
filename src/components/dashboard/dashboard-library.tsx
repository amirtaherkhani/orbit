import * as React from "react"

import { OrbitMark } from "@/components/branding/orbit-mark"
import {
  ArrowRightIcon,
  LayoutDashboardIcon,
  PencilLineIcon,
  PencilRulerIcon,
  PlusIcon,
  Trash2Icon,
} from "@/components/ui/icon-library"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  categories: string[]
  currentId: string | null
  onOpen: (id: string) => void
  onCreate: (title: string, category?: string) => boolean
  onAssignCategory: (id: string, category?: string) => void
  onRenameDashboard: (id: string, title: string) => boolean
  onCreateCategory: (name: string) => string | null
  onRenameCategory: (previous: string, next: string) => boolean
  onDeleteCategory: (name: string) => void
  onReturn: () => void
}

function savedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Saved dashboard"
  return `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date)}`
}

function DashboardPreview({ document }: { document: DashboardDocument }) {
  const layoutById = new Map(document.dashboard.layout.map((item) => [item.i, item]))
  const panels = [...document.dashboard.panels]
    .sort((left, right) => {
      const a = layoutById.get(left.id)
      const b = layoutById.get(right.id)
      return (a?.y ?? 0) - (b?.y ?? 0) || (a?.x ?? 0) - (b?.x ?? 0)
    })
    .slice(0, 6)

  return (
    <div className="dashboard-library-preview" aria-label={`Static snapshot of ${document.title}`}>
      <div className="dashboard-library-preview-top">
        <span className="dashboard-library-preview-mark"><OrbitMark /></span>
        <span className="dashboard-library-preview-title">{document.title}</span>
        <span className="dashboard-library-preview-live"><span /> Snapshot</span>
      </div>
      <div className="dashboard-library-preview-grid">
        {panels.length ? panels.map((panel, index) => {
          const item = layoutById.get(panel.id)
          const width = item?.w ?? 4
          const span = width >= 8 ? 2 : 1
          const chartStyle = panel.chartType === "bar" ? "bars" : panel.chartType === "stat" ? "stat" : "line"
          return (
            <div
              className={`dashboard-library-preview-tile is-${chartStyle}`}
              key={panel.id}
              style={{ gridColumn: `span ${span}` }}
            >
              <span className="dashboard-library-preview-tile-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="dashboard-library-preview-spark" aria-hidden="true">
                {chartStyle === "bars" ? (
                  <span className="dashboard-library-preview-bars"><i /><i /><i /><i /><i /><i /></span>
                ) : chartStyle === "stat" ? (
                  <span className="dashboard-library-preview-stat">1.2k</span>
                ) : (
                  <svg viewBox="0 0 160 46" preserveAspectRatio="none"><path d="M0 34 C18 30 20 16 38 24 S64 38 80 22 S104 14 120 20 S142 30 160 8" /></svg>
                )}
              </div>
              <strong>{panel.title}</strong>
              <small>{panel.chartType.replaceAll("-", " ")}</small>
            </div>
          )
        }) : (
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
  categories,
  currentId,
  onOpen,
  onCreate,
  onAssignCategory,
  onRenameDashboard,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onReturn,
}: DashboardLibraryProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createCategoryOpen, setCreateCategoryOpen] = React.useState(false)
  const [renameDashboardOpen, setRenameDashboardOpen] = React.useState(false)
  const [renameCategoryOpen, setRenameCategoryOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [categoryName, setCategoryName] = React.useState("")
  const [editingDashboard, setEditingDashboard] = React.useState<DashboardDocument | null>(null)
  const [activeCategory, setActiveCategory] = React.useState(() =>
    dashboards.find((item) => item.id === currentId)?.category ?? "all"
  )
  const activeTabValue = activeCategory === "all" || categories.includes(activeCategory)
    ? activeCategory
    : "all"

  const createDashboard = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = title.trim()
    if (!name || !onCreate(name, activeTabValue === "all" ? undefined : activeTabValue)) return
    setCreateOpen(false)
    setTitle("")
  }

  const createCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const created = onCreateCategory(categoryName)
    if (!created) return
    setActiveCategory(created)
    setCategoryName("")
    setCreateCategoryOpen(false)
  }

  const renameCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onRenameCategory(editingCategory, categoryName)) return
    setActiveCategory(categoryName.trim())
    setCategoryName("")
    setRenameCategoryOpen(false)
  }

  const renameDashboard = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingDashboard || !onRenameDashboard(editingDashboard.id, title)) return
    setRenameDashboardOpen(false)
    setEditingDashboard(null)
    setTitle("")
  }

  const dashboardCards = (items: DashboardDocument[]) => (
    <div className="dashboard-library-dashboard-grid">
      {items.map((document, index) => (
        <article className="dashboard-library-dashboard-card" key={document.id}>
          <DashboardPreview document={document} />
          <div className="dashboard-library-dashboard-card-info">
            <div>
              <span className="section-kicker">Dashboard {String(index + 1).padStart(2, "0")}</span>
              <h2>{document.title}</h2>
              <p>{document.dashboard.panels.length} panels · {savedAt(document.updatedAt)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => {
              setEditingDashboard(document)
              setTitle(document.title)
              setRenameDashboardOpen(true)
            }} aria-label={`Rename ${document.title}`}><PencilLineIcon /> Rename</Button>
            <label className="dashboard-library-category-field">
              <span>Category</span>
              <Select
                value={document.category ?? "uncategorized"}
                onValueChange={(value) => onAssignCategory(document.id, value === "uncategorized" ? undefined : value)}
              >
                <SelectTrigger aria-label={`Category for ${document.title}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
            <Button onClick={() => onOpen(document.id)}>
              Open dashboard <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  )

  const emptyCategory = (category: string) => (
    <div className="dashboard-library-empty">
      <div className="dashboard-library-empty-icon"><LayoutDashboardIcon /></div>
      <h2>{category === "all" ? "No saved dashboards yet" : `No dashboards in ${category}`}</h2>
      <p>{category === "all" ? "Save your current dashboard to see it here, or create a new one." : "Move a saved dashboard into this category or create a new dashboard."}</p>
      <div className="dashboard-library-empty-actions">
        {category !== "all" && <Button variant="outline" onClick={() => setActiveCategory("all")}>View all dashboards</Button>}
        <Button variant="outline" onClick={onReturn}>Return to editor</Button>
      </div>
    </div>
  )
  const tabs: TabItem[] = [
    { title: `All dashboards · ${dashboards.length}`, value: "all", content: dashboards.length ? dashboardCards(dashboards) : emptyCategory("all") },
    ...categories.map((category) => ({
      title: `${category} · ${dashboards.filter((item) => item.category === category).length}`,
      value: category,
      content: dashboards.some((item) => item.category === category)
        ? dashboardCards(dashboards.filter((item) => item.category === category))
        : emptyCategory(category),
    })),
  ]

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
            <PencilRulerIcon data-icon="inline-start" /> <span>Editor</span>
          </Button>
          <Button variant="outline" onClick={() => setCreateCategoryOpen(true)}>
            <PlusIcon data-icon="inline-start" /> New category
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
            <p>Group dashboards into categories, then open one to continue editing.</p>
          </div>
          <span className="dashboard-library-local-label">Stored in this browser</span>
        </div>

        {categories.length > 0 && (
          <div className="dashboard-library-category-actions" aria-label="Category actions">
            {activeTabValue !== "all" && (
              <>
                <Button variant="ghost" size="sm" onClick={() => {
                  setEditingCategory(activeTabValue)
                  setCategoryName(activeTabValue)
                  setRenameCategoryOpen(true)
                }}><PencilLineIcon /> Rename category</Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  onDeleteCategory(activeTabValue)
                  setActiveCategory("all")
                }}><Trash2Icon /> Delete category</Button>
              </>
            )}
          </div>
        )}

        <Tabs tabs={tabs} value={activeTabValue} onValueChange={setActiveCategory} className="dashboard-library-category-tabs" />
      </div>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="dashboard-library-create-sheet">
          <SheetHeader>
            <SheetTitle>New dashboard</SheetTitle>
            <SheetDescription>Name your dashboard. It will be added to the current category. Add panels in the editor, then save when it is ready.</SheetDescription>
          </SheetHeader>
          <form onSubmit={createDashboard} className="dashboard-library-create-form">
            <label htmlFor="new-dashboard-title">Dashboard name</label>
            <Input id="new-dashboard-title" autoFocus maxLength={72} placeholder="e.g. Platform health" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Button type="submit" disabled={!title.trim()}>Create dashboard</Button>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={createCategoryOpen} onOpenChange={setCreateCategoryOpen}>
        <SheetContent side="right" className="dashboard-library-create-sheet">
          <SheetHeader>
            <SheetTitle>New category</SheetTitle>
            <SheetDescription>Create a category, then assign saved dashboards to it from their dashboard detail.</SheetDescription>
          </SheetHeader>
          <form onSubmit={createCategory} className="dashboard-library-create-form">
            <label htmlFor="new-dashboard-category">Category name</label>
            <Input id="new-dashboard-category" autoFocus maxLength={48} placeholder="e.g. Production" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
            <Button type="submit" disabled={!categoryName.trim()}>Create category</Button>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={renameDashboardOpen} onOpenChange={setRenameDashboardOpen}>
        <SheetContent side="right" className="dashboard-library-create-sheet">
          <SheetHeader>
            <SheetTitle>Rename dashboard</SheetTitle>
            <SheetDescription>Choose the name shown on this dashboard’s card and in the editor.</SheetDescription>
          </SheetHeader>
          <form onSubmit={renameDashboard} className="dashboard-library-create-form">
            <label htmlFor="rename-dashboard-title">Dashboard name</label>
            <Input id="rename-dashboard-title" autoFocus maxLength={72} value={title} onChange={(event) => setTitle(event.target.value)} />
            <Button type="submit" disabled={!title.trim() || title.trim() === editingDashboard?.title}>Save name</Button>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={renameCategoryOpen} onOpenChange={setRenameCategoryOpen}>
        <SheetContent side="right" className="dashboard-library-create-sheet">
          <SheetHeader>
            <SheetTitle>Rename category</SheetTitle>
            <SheetDescription>Dashboards in this category keep their assignment when you rename it.</SheetDescription>
          </SheetHeader>
          <form onSubmit={renameCategory} className="dashboard-library-create-form">
            <label htmlFor="rename-dashboard-category">Category name</label>
            <Input id="rename-dashboard-category" autoFocus maxLength={48} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
            <Button type="submit" disabled={!categoryName.trim() || categoryName.trim() === editingCategory}>Save category</Button>
          </form>
        </SheetContent>
      </Sheet>
    </main>
  )
}
