import * as React from "react"
import { Popover } from "radix-ui"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "cn"
import {
  CheckIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@/components/ui/icon-library"

export type MultiSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type MultiSelectProps = {
  options: MultiSelectOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  ariaLabel: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  clearLabel?: string
  selectionLabel?: string
  disabled?: boolean
  invalid?: boolean
  maxVisibleChips?: number
  className?: string
}

function MultiSelect({
  options,
  value,
  onValueChange,
  ariaLabel,
  placeholder = "Select options",
  searchPlaceholder = "Search options…",
  emptyMessage = "No options found.",
  clearLabel = "Clear selection",
  selectionLabel = "selected",
  disabled = false,
  invalid = false,
  maxVisibleChips = 2,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const listId = React.useId()
  const reduceMotion = useReducedMotion()
  const selected = options.filter((option) => value.includes(option.value))
  const visibleChips = selected.slice(0, maxVisibleChips)
  const hiddenChipCount = Math.max(0, selected.length - visibleChips.length)
  const filteredOptions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return options.filter((option) =>
      option.label.toLocaleLowerCase().includes(normalizedQuery)
    )
  }, [options, query])
  const currentOption = filteredOptions[activeIndex]
  const selectedLabel =
    selected.length === 1
      ? selected[0].label
      : `${selected.length} ${selectionLabel}`

  React.useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setQuery("")
      setActiveIndex(0)
    }
  }

  const handleSearchChange = (nextQuery: string) => {
    const normalizedQuery = nextQuery.trim().toLocaleLowerCase()
    setQuery(nextQuery)
    setActiveIndex(
      Math.max(
        0,
        options.findIndex(
          (option) =>
            !option.disabled &&
            option.label.toLocaleLowerCase().includes(normalizedQuery)
        )
      )
    )
  }

  const setSelected = (optionValue: string, isSelected: boolean) => {
    onValueChange(
      isSelected
        ? value.filter((selectedValue) => selectedValue !== optionValue)
        : [...value, optionValue]
    )
    inputRef.current?.focus()
  }

  const removeSelected = (optionValue: string) => {
    onValueChange(
      value.filter((selectedValue) => selectedValue !== optionValue)
    )
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => {
        for (
          let nextIndex = index + 1;
          nextIndex < filteredOptions.length;
          nextIndex += 1
        ) {
          if (!filteredOptions[nextIndex].disabled) return nextIndex
        }
        return index
      })
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => {
        for (let nextIndex = index - 1; nextIndex >= 0; nextIndex -= 1) {
          if (!filteredOptions[nextIndex].disabled) return nextIndex
        }
        return index
      })
    } else if (event.key === "Home" && filteredOptions.length > 0) {
      event.preventDefault()
      setActiveIndex(
        Math.max(
          0,
          filteredOptions.findIndex((option) => !option.disabled)
        )
      )
    } else if (event.key === "End" && filteredOptions.length > 0) {
      event.preventDefault()
      setActiveIndex(
        filteredOptions.findLastIndex((option) => !option.disabled)
      )
    } else if (
      event.key === "Enter" &&
      currentOption &&
      !currentOption.disabled
    ) {
      event.preventDefault()
      setSelected(currentOption.value, value.includes(currentOption.value))
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <div
        className={cn("orbit-multi-select", className)}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
      >
        <div className="orbit-multi-select__control">
          {visibleChips.map((option) => (
            <span className="orbit-multi-select__chip" key={option.value}>
              <span className="orbit-multi-select__chip-label">
                {option.label}
              </span>
              <button
                type="button"
                className="orbit-multi-select__remove"
                aria-label={`Remove ${option.label}`}
                disabled={disabled}
                onClick={() => removeSelected(option.value)}
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
          {hiddenChipCount > 0 && (
            <span
              className="orbit-multi-select__overflow"
              aria-label={`${hiddenChipCount} more selected`}
            >
              +{hiddenChipCount}
            </span>
          )}
          <Popover.Trigger asChild>
            <button
              type="button"
              className="orbit-multi-select__trigger"
              aria-label={`${ariaLabel}${selected.length ? `: ${selectedLabel}` : ""}`}
              aria-invalid={invalid || undefined}
              disabled={disabled}
            >
              <span
                className={cn(
                  "orbit-multi-select__placeholder",
                  selected.length > 0 && "sr-only"
                )}
              >
                {placeholder}
              </span>
              <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
            </button>
          </Popover.Trigger>
        </div>
      </div>
      <Popover.Portal>
        <Popover.Content
          data-slot="multi-select-content"
          className="orbit-multi-select__popover"
          align="start"
          sideOffset={6}
          collisionPadding={8}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            inputRef.current?.focus()
          }}
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -3, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.14, ease: "easeOut" }}
          >
            <div className="orbit-multi-select__search">
              <MagnifyingGlassIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                role="combobox"
                aria-label={`Search ${ariaLabel}`}
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={
                  currentOption ? `${listId}-option-${activeIndex}` : undefined
                }
                className="orbit-multi-select__input"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => handleSearchChange(event.target.value)}
                onKeyDown={handleInputKeyDown}
              />
            </div>
            <div
              id={listId}
              ref={listRef}
              className="orbit-multi-select__options"
              role="listbox"
              aria-label={ariaLabel}
              aria-multiselectable="true"
            >
              {filteredOptions.length === 0 ? (
                <p className="orbit-multi-select__empty" role="status">
                  {emptyMessage}
                </p>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = value.includes(option.value)
                  const isActive = index === activeIndex
                  return (
                    <div
                      key={option.value}
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      data-active={isActive || undefined}
                      data-selected={isSelected || undefined}
                      className="orbit-multi-select__option"
                      onMouseMove={() => setActiveIndex(index)}
                      onClick={() =>
                        !option.disabled &&
                        setSelected(option.value, isSelected)
                      }
                    >
                      <span
                        className="orbit-multi-select__checkbox"
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <CheckIcon className="size-3" weight="bold" />
                        )}
                      </span>
                      <span className="orbit-multi-select__option-label">
                        {option.label}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
            {selected.length > 0 && (
              <div className="orbit-multi-select__footer">
                <span>
                  {selected.length} {selectionLabel}
                </span>
                <button
                  type="button"
                  className="orbit-multi-select__clear"
                  onClick={() => onValueChange([])}
                >
                  {clearLabel}
                </button>
              </div>
            )}
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export { MultiSelect }
