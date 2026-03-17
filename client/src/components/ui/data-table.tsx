import { MdChevronLeft, MdChevronRight, MdSearch, MdViewColumn } from 'react-icons/md';
import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Column<T> {
  id: string
  header: string
  accessor: (row: T) => React.ReactNode
  sortable?: boolean
  defaultVisible?: boolean
  minWidth?: number
  defaultWidth?: number
  align?: "left" | "center" | "right"
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  pageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  searchFn?: (row: T, query: string) => boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string
  stickyHeader?: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_MIN_WIDTH = 80
const DEFAULT_COL_WIDTH = 150
const DEBOUNCE_MS = 300
const MAX_VISIBLE_PAGES = 5

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialWidths<T>(columns: Column<T>[]): Record<string, number> {
  const widths: Record<string, number> = {}
  for (const col of columns) {
    widths[col.id] = col.defaultWidth ?? DEFAULT_COL_WIDTH
  }
  return widths
}

function buildInitialVisibility<T>(columns: Column<T>[]): Record<string, boolean> {
  const vis: Record<string, boolean> = {}
  for (const col of columns) {
    vis[col.id] = col.defaultVisible !== false
  }
  return vis
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | "ellipsis")[] = []

  if (current <= 3) {
    for (let i = 1; i <= 4; i++) pages.push(i)
    pages.push("ellipsis")
    pages.push(total)
  } else if (current >= total - 2) {
    pages.push(1)
    pages.push("ellipsis")
    for (let i = total - 3; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    pages.push("ellipsis")
    pages.push(current - 1)
    pages.push(current)
    pages.push(current + 1)
    pages.push("ellipsis")
    pages.push(total)
  }

  return pages
}

// ---------------------------------------------------------------------------
// useDebounce
// ---------------------------------------------------------------------------

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = React.useState(value)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

// ---------------------------------------------------------------------------
// ColumnVisibilityDropdown
// ---------------------------------------------------------------------------

interface ColumnVisibilityDropdownProps<T> {
  columns: Column<T>[]
  visibility: Record<string, boolean>
  onToggle: (id: string) => void
}

function ColumnVisibilityDropdown<T>({
  columns,
  visibility,
  onToggle,
}: ColumnVisibilityDropdownProps<T>) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const visibleCount = Object.values(visibility).filter(Boolean).length

  // Close on outside click
  React.useEffect(() => {
    if (!open) return

    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="gap-1.5"
      >
        <MdViewColumn className="h-3.5 w-3.5" />
        Columns
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-md border border-border bg-popover p-2 shadow-md">
          {columns.map((col) => {
            const checked = visibility[col.id] !== false
            const disabled = checked && visibleCount <= 1
            return (
              <label
                key={col.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted/50",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(col.id)}
                  className="h-3.5 w-3.5 rounded border-border accent-primary"
                />
                {col.header}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

function DataTable<T>({
  columns,
  data,
  pageSize = DEFAULT_PAGE_SIZE,
  searchable = false,
  searchPlaceholder = "Search...",
  searchFn,
  emptyMessage = "No results found.",
  onRowClick,
  rowClassName,
  stickyHeader = true,
}: DataTableProps<T>) {
  // ---- State ----
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>(
    () => buildInitialWidths(columns)
  )
  const [visibility, setVisibility] = React.useState<Record<string, boolean>>(
    () => buildInitialVisibility(columns)
  )
  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS)

  // ---- Derived ----
  const visibleColumns = React.useMemo(
    () => columns.filter((col) => visibility[col.id] !== false),
    [columns, visibility]
  )

  const filteredData = React.useMemo(() => {
    if (!searchable || !debouncedSearch || !searchFn) return data
    return data.filter((row) => searchFn(row, debouncedSearch))
  }, [data, debouncedSearch, searchable, searchFn])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))

  // Reset page when data or search changes
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, data])

  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredData.length)
  const paginatedData = React.useMemo(
    () => filteredData.slice(startIndex, endIndex),
    [filteredData, startIndex, endIndex]
  )

  const pageNumbers = React.useMemo(
    () => getPageNumbers(safePage, totalPages),
    [safePage, totalPages]
  )

  const minTableWidth = React.useMemo(
    () =>
      visibleColumns.reduce(
        (sum, col) => sum + (columnWidths[col.id] ?? DEFAULT_COL_WIDTH),
        0
      ),
    [visibleColumns, columnWidths]
  )

  // ---- Handlers ----
  const handleToggleVisibility = React.useCallback(
    (id: string) => {
      setVisibility((prev) => {
        const next = { ...prev }
        const currentlyVisible = Object.entries(next).filter(([, v]) => v).length
        if (next[id] && currentlyVisible <= 1) return prev
        next[id] = !next[id]
        return next
      })
    },
    []
  )

  // ---- Column Resizing ----
  const handleResizeStart = React.useCallback(
    (colId: string, minWidth: number, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const startX = e.clientX
      const startWidth = columnWidths[colId] ?? DEFAULT_COL_WIDTH
      const effectiveMin = minWidth || DEFAULT_MIN_WIDTH

      function onMouseMove(moveEvent: MouseEvent) {
        const delta = moveEvent.clientX - startX
        const newWidth = Math.max(effectiveMin, startWidth + delta)
        setColumnWidths((prev) => ({ ...prev, [colId]: newWidth }))
      }

      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }

      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [columnWidths]
  )

  // ---- Alignment class ----
  const alignClass = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center"
    if (align === "right") return "text-right"
    return "text-left"
  }

  // ---- Render ----
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-card-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 p-3">
        {/* Left: search */}
        <div className="flex-1">
          {searchable && (
            <div className="relative max-w-sm">
              <MdSearch className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
        </div>

        {/* Right: column visibility */}
        <ColumnVisibilityDropdown
          columns={columns}
          visibility={visibility}
          onToggle={handleToggleVisibility}
        />
      </div>

      {/* Table wrapper with horizontal scroll */}
      <div className="overflow-x-auto">
        <table
          className="w-full caption-bottom text-sm"
          style={{ minWidth: `${minTableWidth}px` }}
        >
          <thead
            className={cn(
              "bg-muted/50",
              stickyHeader && "sticky top-0 z-10"
            )}
          >
            <tr className="border-b border-border/50">
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "relative h-10 px-4 align-middle text-xs uppercase tracking-wider font-semibold text-muted-foreground select-none",
                    alignClass(col.align)
                  )}
                  style={{
                    width: `${columnWidths[col.id] ?? DEFAULT_COL_WIDTH}px`,
                    minWidth: `${col.minWidth ?? DEFAULT_MIN_WIDTH}px`,
                  }}
                >
                  {col.header}
                  {/* Drag handle */}
                  <div
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/30 active:bg-primary/50"
                    onMouseDown={(e) =>
                      handleResizeStart(col.id, col.minWidth ?? DEFAULT_MIN_WIDTH, e)
                    }
                    role="separator"
                    aria-orientation="vertical"
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="p-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b border-border/50 transition-colors hover:bg-muted/30",
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row)
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {visibleColumns.map((col) => (
                    <td
                      key={col.id}
                      className={cn("p-4 align-middle", alignClass(col.align))}
                      style={{
                        width: `${columnWidths[col.id] ?? DEFAULT_COL_WIDTH}px`,
                        minWidth: `${col.minWidth ?? DEFAULT_MIN_WIDTH}px`,
                      }}
                    >
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-3">
          {/* Left: result count */}
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {startIndex + 1}-{endIndex} of {filteredData.length} results
          </span>

          {/* Right: page navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <MdChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {pageNumbers.map((pn, i) =>
              pn === "ellipsis" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1.5 text-sm text-muted-foreground select-none"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={pn}
                  variant={pn === safePage ? "default" : "outline"}
                  size="sm"
                  className="min-w-[2rem]"
                  onClick={() => setPage(pn)}
                >
                  {pn}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <MdChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

DataTable.displayName = "DataTable"

export { DataTable }
