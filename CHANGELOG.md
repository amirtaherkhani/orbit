## [Unreleased]

### Fixed
- Give Periwinkle primary buttons darker text in light mode and lighter text in dark mode.
- Use the button's dark foreground color for the Add to dashboard icon in both themes.

### Added
- Add a Settings page for persistent primary color selection across the dashboard, including theme-specific accent choices.
- Show a close control on each grouped Floating chart tab.
- Add nine shadcn-inspired Area chart styles: Interactive, Step, Linear, Stacked Expanded, Stacked, Legend, Axes, Gradient, and Icons. Stacked styles use the selected metric's series breakdown.
- Show a compact, condensed current-value readout across graph-based chart types.
- Provide a reusable Orbital O icon pack with SVG masters, outlined wordmarks, app icons, favicons, and Apple/web-app install assets.
- Switch chart colors between gradient pastel palettes and a custom color in the panel composer or on existing Grid and Floating tiles; saved dashboards retain the choice.
- Show a pulse-icon Live badge beside chart titles when their metric is backed by a live stream.
- Configure the dashboard announcement banner to rotate alarms, notifications, and latest chart values from selected panels; hide and restore the banner at any time.
- Distinguish warm glass chart data tooltips from compact solid control tooltips, with accessible keyboard focus and reduced-motion support.
- Add a reusable searchable multi-select with removable chips, keyboard listbox navigation, and clear-selection controls.

### Removed
- Remove the Neon chart color style and migrate saved Neon selections to the pastel palette.

### Changed
- Keep Orbit orange in both theme palettes, with Periwinkle in light mode and Sky in dark mode.
- Give the panel action toolbar a cool glass tint and make action menus more translucent.
- Add a subtle pointer-following spotlight to the dashboard's dotted background.
- Give the native Floating tile action menu a translucent, blurred glass surface in both themes.
- Render the italic word in the Service health heading with a light font weight.
- Mark the active tab in grouped tiles with a minimal primary-color top edge and no filled background.
- Animate grouped Floating tab changes with spring-driven panel transitions and a smoothly moving selected state.
- Use flat attached tabs on grouped Floating tiles and remove Grid and Floating tile title-bar bottom borders in both themes.
- Let composer controls scroll behind a sticky glass heading and increase its blur in both themes.
- Remove the notification banner's animated interior glow while preserving its severity border and warning/error colors.
- Give alert rows a subtle theme-aware severity and primary-color gradient.
- Match the Panel Composer heading to the navigation bar's shell-backed gradient in both themes.
- Match dashboard and panel “More actions” menus to the navbar's neutral glass surface in both themes.
- Add a slow, severity-colored border beam to warning, error, and info announcement banners.
- Convert saved Focus timer panels to Clock panels while preserving their layout and custom titles.
- Make only the bottom border of Grid and Floating tile title bars transparent in both themes.
- Give dark-mode shell, composer, cards, preview, and controls a layered slate gradient.
- Enlarge donut center totals and strengthen legend labels and percentages for smaller tiles.
- Match the Panel Composer heading background to the top navigation bar in both themes.
- Match the dashboard composer footer surface to its sidebar in both themes.
- Use the dark slate palette for notification banner fills, icons, and controls while retaining severity cues.
- Orient Grid and Floating tile title-bar gradients from top to bottom while retaining the subtle divider in both themes.
- Blend the dark Panel Composer heading gradient into the sidebar and top bar.
- Use a three-level slate palette for dark-mode page, shell, and panel surfaces.
- Strengthen the warm accent fill and border of selected tabs in light mode.
- Unify layout switches, Floating tabs, and builder selection controls with the Grid style selector material.
- Give large plain metric readouts a bold-to-light digit hierarchy across chart types.
- Orient the top bar, composer heading, and composer footer glass gradients from left to right.
- Move layout instructions below the dashboard tiles to free space beside the layout controls.
- Flatten dark-mode Live and Draft badges by removing raised highlights, borders, blur, and dot halos.
- Show Orbit and the package version in the app header and remove dashboard/composer section dividers.
- Modernize grouped Floating tiles with a compact segmented tab strip, raised active pill, accent indicator, and keyboard focus styling.
- Convert saved Waffle panels to Donut when loading or importing dashboards.
- Replace the desktop, mobile, browser, and README branding with the approved inward-curved Orbital O.
- Slide banner items horizontally with directional transitions and honor reduced-motion preferences.
- Align select popups to their triggers and refine dropdown surfaces for compact, viewport-aware warm glass menus.

### Fixed
- Clear the selected tile and grouped-tab highlight when clicking outside dashboard tiles in Grid or Floating mode.
- Reveal Floating tile action menus on hover and keyboard focus through the tab animation wrapper.
- Size the "Move tile to" submenu icon consistently with other tile action icons.
- Restore the Panel Composer heading's liquid-glass blur by making its base tint translucent like the navigation bar.
- Match the sidebar Orbit mark to the selected primary color.
- Keep long Panel Composer controls scrollable by mouse, touch, and keyboard while its heading and Add action remain visible.
- Reverse the top bar glass gradient so its darker side starts on the left in both themes.
- Emphasize the Grid style label and separate it from its layout choices.
- Give clock accent buttons enough vertical space for their labels and use the shared color picker in tile color controls.
- Keep dashboard tooltips legible in light and dark themes and preserve dark icons on primary buttons.
- Align the Grid style label inside its segmented control with consistent padding and responsive spacing.
- Give Floating tiles the same glass fill, border, blur, shadow, and header finish as Grid cards, including dark mode and opaque fallback.

### Removed
- Remove Focus timer from the panel catalog, builder, renderer, and styles.
- Remove the Waffle chart option and its renderer.
