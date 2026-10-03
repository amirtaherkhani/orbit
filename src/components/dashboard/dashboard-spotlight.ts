import type * as React from "react"

export function moveDashboardSpotlight(
  element: HTMLElement,
  event: React.PointerEvent<HTMLElement>
) {
  if (event.pointerType === "touch") {
    delete element.dataset.spotlightActive
    return
  }

  const bounds = element.getBoundingClientRect()
  element.style.setProperty(
    "--dashboard-spotlight-x",
    `${event.clientX - bounds.left}px`
  )
  element.style.setProperty(
    "--dashboard-spotlight-y",
    `${event.clientY - bounds.top}px`
  )
  element.dataset.spotlightActive = "true"
}

export function hideDashboardSpotlight(element: HTMLElement) {
  delete element.dataset.spotlightActive
}
