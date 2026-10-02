## [Unreleased]

### Added
- Show a compact, condensed current-value readout across graph-based chart types.
- Provide a reusable Orbital O icon pack with SVG masters, outlined wordmarks, app icons, favicons, and Apple/web-app install assets.
- Switch chart colors between gradient pastel, neon, and a custom color in the panel composer or on existing Grid and Floating tiles; saved dashboards retain the choice.
- Show a pulse-icon Live badge beside chart titles when their metric is backed by a live stream.
- Configure the dashboard announcement banner to rotate alarms, notifications, and latest chart values from selected panels; hide and restore the banner at any time.
- Distinguish warm glass chart data tooltips from compact solid control tooltips, with accessible keyboard focus and reduced-motion support.
- Add a reusable searchable multi-select with removable chips, keyboard listbox navigation, and clear-selection controls.

### Changed
- Move layout instructions below the dashboard tiles to free space beside the layout controls.
- Flatten dark-mode Live and Draft badges by removing raised highlights, borders, blur, and dot halos.
- Show Orbit and the package version in the app header and remove dashboard/composer section dividers.
- Modernize grouped Floating tiles with a compact segmented tab strip, raised active pill, accent indicator, and keyboard focus styling.
- Convert saved Waffle panels to Donut when loading or importing dashboards.
- Replace the desktop, mobile, browser, and README branding with the approved inward-curved Orbital O.
- Slide banner items horizontally with directional transitions and honor reduced-motion preferences.
- Align select popups to their triggers and refine dropdown surfaces for compact, viewport-aware warm glass menus.

### Fixed
- Give Floating tiles the same glass fill, border, blur, shadow, and header finish as Grid cards, including dark mode and opaque fallback.

### Removed
- Remove the Waffle chart option and its renderer.
