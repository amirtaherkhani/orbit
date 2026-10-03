import * as React from "react"

import {
  getPrimaryColorOptions,
  useTheme,
} from "@/components/theme-provider"
import { CheckIcon } from "@/components/ui/icon-library"

export function SettingsPage() {
  const { primaryColor, resolvedTheme, setPrimaryColor } = useTheme()
  const colorOptions = getPrimaryColorOptions(resolvedTheme)
  const selectedOption = colorOptions.find(
    (option) => option.value === primaryColor
  )

  return (
    <main className="settings-page">
      <header className="topbar settings-topbar">
        <div className="topbar-title-group">
          <div>
            <div className="topbar-eyebrow">Workspace settings</div>
            <h1 className="type-page-heading">Settings</h1>
          </div>
        </div>
      </header>

      <div className="settings-content">
        <div className="settings-page-intro">
          <span className="section-kicker">Appearance</span>
          <h2>Make Orbit yours</h2>
          <p>
            Choose the primary color used across buttons, accents, and focus
            states.
          </p>
        </div>

        <section
          className="settings-card"
          aria-labelledby="primary-color-heading"
        >
          <div className="settings-card-heading">
            <div>
              <h3 id="primary-color-heading">Primary color</h3>
              <p>
                Pick a color for the current mode. Orbit orange is available in
                both themes.
              </p>
            </div>
            {selectedOption && (
              <span className="selected-color-label" aria-live="polite">
                <span
                  className="selected-color-dot"
                  style={
                    {
                      "--swatch-color": selectedOption.value,
                    } as React.CSSProperties
                  }
                />
                {selectedOption.name}
              </span>
            )}
          </div>

          <div
            className="primary-color-options"
            role="group"
            aria-label={`Primary color for ${resolvedTheme} mode`}
          >
            {colorOptions.map((option) => {
              const isSelected = option.value === primaryColor

              return (
                <button
                  key={option.value}
                  type="button"
                  className="primary-color-option"
                  data-selected={isSelected}
                  aria-label={`${option.name}, ${option.value}`}
                  aria-pressed={isSelected}
                  onClick={() => setPrimaryColor(option.value)}
                  style={
                    { "--swatch-color": option.value } as React.CSSProperties
                  }
                >
                  <span className="primary-color-swatch" aria-hidden="true" />
                  <span className="primary-color-option-copy">
                    <span>{option.name}</span>
                    <span>{option.value}</span>
                  </span>
                  {isSelected && <CheckIcon className="primary-color-check" />}
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
