import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import "@danfessler/trellis/style.css"
import "./index.css"
import App from "./App.tsx"
import { DuotoneIconProvider } from "@/components/ui/icon-library"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DuotoneIconProvider>
      <ThemeProvider defaultTheme="light" storageKey="signalboard-theme">
        <TooltipProvider delayDuration={280}>
          <App />
          <Toaster position="bottom-right" richColors />
        </TooltipProvider>
      </ThemeProvider>
    </DuotoneIconProvider>
  </StrictMode>
)
