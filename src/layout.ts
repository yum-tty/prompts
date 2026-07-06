import type { FormModel } from "./form"
import type { GroupModel } from "./group"
import { JoinHorizontal, Left } from "caramel"

export interface Layout {
  View(f: FormModel): string
  GroupWidth(f: FormModel, g: GroupModel, w: number): number
}

function isGroupHidden(group: GroupModel): boolean {
  if (group.hideFunc) return group.hideFunc()
  if (group.hide !== null) return group.hide
  return false
}

function getVisibleGroups(groups: GroupModel[]): number[] {
  const visible: number[] = []
  for (let i = 0; i < groups.length; i++) {
    if (!isGroupHidden(groups[i]!)) visible.push(i)
  }
  return visible
}

function getGroupContent(group: GroupModel, _currentGroup: number, _currentField: number, _groupIndex: number): string {
  const lines: string[] = []
  for (let fi = 0; fi < group.fields.length; fi++) {
    const field = group.fields[fi]!
    if (field.Skip() && group.fields.length > 1) continue
    lines.push(field.view())
  }
  return lines.join("\n")
}

class LayoutDefaultImpl implements Layout {
  View(f: FormModel): string {
    const gi = f.currentGroup
    const group = f.groups[gi]
    if (!group) return ""
    return getGroupContent(group, f.currentGroup, f.currentField, gi)
  }

  GroupWidth(_f: FormModel, _g: GroupModel, w: number): number {
    return w
  }
}

class LayoutStackImpl implements Layout {
  View(f: FormModel): string {
    const visible = getVisibleGroups(f.groups)
    const parts: string[] = []
    for (const gi of visible) {
      const group = f.groups[gi]!
      parts.push(getGroupContent(group, f.currentGroup, f.currentField, gi))
      parts.push("")
    }
    return parts.join("\n").trimEnd()
  }

  GroupWidth(_f: FormModel, _g: GroupModel, w: number): number {
    return w
  }
}

class LayoutColumnsImpl implements Layout {
  private columns: number

  constructor(columns: number) {
    this.columns = Math.max(1, columns)
  }

  View(f: FormModel): string {
    const visible = getVisibleGroups(f.groups)
    if (visible.length === 0) return ""

    const segmentIndex = Math.floor(f.currentGroup / this.columns)
    const start = segmentIndex * this.columns
    const end = Math.min(start + this.columns, visible.length)

    const columns: string[] = []
    for (let i = start; i < end; i++) {
      const gi = visible[i]!
      const group = f.groups[gi]!
      columns.push(getGroupContent(group, f.currentGroup, f.currentField, gi))
    }

    return JoinHorizontal(Left, ...columns)
  }

  GroupWidth(_f: FormModel, _g: GroupModel, w: number): number {
    return Math.floor(w / this.columns)
  }
}

class LayoutGridImpl implements Layout {
  private rows: number
  private columns: number

  constructor(rows: number, columns: number) {
    this.rows = Math.max(1, rows)
    this.columns = Math.max(1, columns)
  }

  View(f: FormModel): string {
    const visible = getVisibleGroups(f.groups)
    if (visible.length === 0) return ""

    const total = this.rows * this.columns
    const segmentIndex = Math.floor(f.currentGroup / total)
    const start = segmentIndex * total
    const end = Math.min(start + total, visible.length)

    const visibleSlice = visible.slice(start, end)
    const parts: string[] = []

    for (let r = 0; r < this.rows; r++) {
      const rowStart = r * this.columns
      const rowEnd = Math.min(rowStart + this.columns, visibleSlice.length)
      const rowCols: string[] = []
      for (let c = rowStart; c < rowEnd; c++) {
        const gi = visibleSlice[c]!
        const group = f.groups[gi]!
        rowCols.push(getGroupContent(group, f.currentGroup, f.currentField, gi))
      }
      parts.push(JoinHorizontal(Left, ...rowCols))
      parts.push("")
    }

    return parts.join("\n").trimEnd()
  }

  GroupWidth(_f: FormModel, _g: GroupModel, w: number): number {
    return Math.floor(w / this.columns)
  }
}

export function LayoutDefault(): Layout {
  return new LayoutDefaultImpl()
}

export function LayoutStack(): Layout {
  return new LayoutStackImpl()
}

export function LayoutColumns(columns: number): Layout {
  return new LayoutColumnsImpl(columns)
}

export function LayoutGrid(rows: number, columns: number): Layout {
  return new LayoutGridImpl(rows, columns)
}

export const DefaultLayout: Layout = new LayoutDefaultImpl()
export const StackLayout: Layout = new LayoutStackImpl()
