import type { Msg, Cmd } from "@yum-tty/cinnamon-bun"
import type { Field, KeyBinding, ValidateFunc, FieldPosition } from "./field"
import type { Theme } from "./theme"
import { activeStyles } from "./theme"
import type { Eval } from "./eval"
import { createEval } from "./eval"
import { type Accessor, EmbeddedAccessor } from "./accessor"
import type { KeyMap } from "./keymap"

export interface MultiOption {
  label: string
  value: string
  description?: string
  selected?: boolean
}

export interface MultiSelectModel extends Field {
  type: "multiselect"
  accessor: Accessor<string[]>
  key: string
  value: string[]
  options: MultiOption[]
  filteredOptions: MultiOption[]
  title: string
  description: string
  width: number
  focused: boolean
  cursor: number
  limit: number
  filterable: boolean
  filter: string
  filtering: boolean
  height: number
  scrolledLine: number
  validate: ValidateFunc | null
  err: string | null
  theme: Theme | null
  hasDarkBg: boolean
  keymap: KeyMap | null
  position: FieldPosition | null
  optionsEval: Eval<MultiOption[]>
}

function ensureCursorVisible(cursor: number, scrolledLine: number, height: number, totalItems: number): number {
  if (cursor < scrolledLine) return cursor
  if (cursor >= scrolledLine + height) return cursor - height + 1
  return scrolledLine
}

function c<T extends Record<string, any>>(obj: T, changes: Record<string, any>): T {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj, changes)
}

export function MultiSelect(config: {
  title?: string
  description?: string
  options: MultiOption[]
  value?: string[]
  width?: number
  limit?: number
  filterable?: boolean
  height?: number
  validate?: ValidateFunc
  key?: string
  optionsFunc?: () => MultiOption[]
  bindings?: any
} = { options: [] }): MultiSelectModel {
  const options = config.options.map((o) => ({
    ...o,
    selected: (config.value ?? []).includes(o.value),
  }))

  const model: MultiSelectModel = {
    type: "multiselect",
    accessor: new EmbeddedAccessor(config.value ?? []),
    key: config.key ?? "",
    title: config.title ?? "",
    description: config.description ?? "",
    options,
    filteredOptions: options,
    value: config.value ?? [],
    width: config.width ?? 40,
    focused: false,
    cursor: 0,
    limit: config.limit ?? 0,
    filterable: config.filterable ?? true,
    filter: "",
    filtering: false,
    height: config.height ?? 10,
    scrolledLine: 0,
    validate: config.validate ?? null,
    err: null,
    theme: null,
    hasDarkBg: false,
    keymap: null,
    position: null,
    optionsEval: config.optionsFunc
      ? { ...createEval(options), fn: config.optionsFunc, bindings: config.bindings }
      : createEval(options),

    init(): [Field, Cmd] { return [this, null] },

    update(msg: Msg): [Field, Cmd] {
      if (!msg || !("type" in msg)) return [this, null]
      if (msg.type !== "key") return [this, null]
      if (!this.focused) return [this, null]

      const key = msg as any

      if (key.name === "tab" || (key.name === "enter" && !this.filtering)) {
        const result = this.validate ? this.validate(this.value) : true
        if (result !== true) return [c(this, { err: String(result) }), null]
        this.accessor.Set(this.value)
        return [c(this, { err: null }), null]
      }

      if (this.filtering) {
        if (key.name === "backspace") {
          const nf = this.filter.slice(0, -1)
          const filtered = nf ? this.options.filter((o) => o.label.toLowerCase().includes(nf.toLowerCase())) : [...this.options]
          return [c(this, { filter: nf, filteredOptions: filtered, cursor: 0 }), null]
        }
        if (key.name === "enter" || key.name === "esc") return [c(this, { filtering: false }), null]
        if (key.name && key.name.length === 1 && !key.ctrl) {
          const nf = this.filter + key.name
          const filtered = this.options.filter((o) => o.label.toLowerCase().includes(nf.toLowerCase()))
          if (filtered.length > 0) return [c(this, { filter: nf, filteredOptions: filtered, cursor: 0 }), null]
          return [this, null]
        }
      }

      switch (key.name) {
        case "up":
        case "k": {
          const nc = Math.max(0, this.cursor - 1)
          return [c(this, { cursor: nc, scrolledLine: ensureCursorVisible(nc, this.scrolledLine, this.height, this.filteredOptions.length) }), null]
        }
        case "down":
        case "j": {
          if (this.filteredOptions.length === 0) return [this, null]
          const nc = Math.min(this.filteredOptions.length - 1, this.cursor + 1)
          return [c(this, { cursor: nc, scrolledLine: ensureCursorVisible(nc, this.scrolledLine, this.height, this.filteredOptions.length) }), null]
        }
        case "g":
          return [c(this, { cursor: 0, scrolledLine: 0 }), null]
        case "G": {
          if (this.filteredOptions.length === 0) return [this, null]
          const last = this.filteredOptions.length - 1
          return [c(this, { cursor: last, scrolledLine: Math.max(0, last - this.height + 1) }), null]
        }
        case "ctrl+u": {
          const nc = Math.max(0, this.cursor - Math.floor(this.height / 2))
          return [c(this, { cursor: nc, scrolledLine: ensureCursorVisible(nc, this.scrolledLine, this.height, this.filteredOptions.length) }), null]
        }
        case "ctrl+d": {
          if (this.filteredOptions.length === 0) return [this, null]
          const nc = Math.min(this.filteredOptions.length - 1, this.cursor + Math.floor(this.height / 2))
          return [c(this, { cursor: nc, scrolledLine: ensureCursorVisible(nc, this.scrolledLine, this.height, this.filteredOptions.length) }), null]
        }
        case "space":
        case "x": {
          const opt = this.filteredOptions[this.cursor]
          if (!opt) return [this, null]
          const numSelected = this.options.filter((o) => o.selected).length
          if (!opt.selected && this.limit > 0 && numSelected >= this.limit) return [this, null]
          const newOptions = this.options.map((o) => o.value === opt.value ? { ...o, selected: !o.selected } : o)
          const newFiltered = this.filteredOptions.map((o) => o.value === opt.value ? { ...o, selected: !o.selected } : o)
          const newValue = newOptions.filter((o) => o.selected).map((o) => o.value)
          return [c(this, { options: newOptions, filteredOptions: newFiltered, value: newValue }), null]
        }
        case "ctrl+a": {
          if (this.limit > 0) return [this, null]
          const allSelected = this.filteredOptions.every((o) => o.selected)
          const newOptions = this.options.map((o) => this.filteredOptions.some((fo) => fo.value === o.value) ? { ...o, selected: !allSelected } : o)
          const newFiltered = this.filteredOptions.map((o) => ({ ...o, selected: !allSelected }))
          const newValue = newOptions.filter((o) => o.selected).map((o) => o.value)
          return [c(this, { options: newOptions, filteredOptions: newFiltered, value: newValue }), null]
        }
        case "/":
          if (this.filterable) return [c(this, { filtering: true, filter: "" }), null]
          return [this, null]
        case "enter":
          return [this, null]
        default:
          return [this, null]
      }
    },

    view(): string {
      const styles = activeStyles(this.theme, this.focused, this.hasDarkBg)
      const title = this.title ? styles.Title.render(this.title + ": ") : ""
      const description = this.description ? styles.Description.render(` ${this.description}`) : ""
      const baseFrameSize = styles.Base.getHorizontalFrameSize()

      const endLine = Math.min(this.scrolledLine + this.height, this.filteredOptions.length)
      const lines: string[] = []
      for (let i = this.scrolledLine; i < endLine; i++) {
        const opt = this.filteredOptions[i]!
        const isSelected = i === this.cursor
        const isChecked = opt.selected
        const mark = isChecked ? styles.SelectedOption.render("\u25CF") : "\u25CB"
        const prefix = isSelected ? styles.MultiSelectSelector.render("\u25B8 ") : "  "
        const label = isSelected
          ? styles.FocusedButton.render(opt.label)
          : styles.UnselectedOption.render(opt.label)
        lines.push(prefix + mark + " " + label)
      }

      const err = this.err ? styles.ErrorMessage.render(` ${this.err}`) : ""
      const filter = this.filtering ? ` /${this.filter}` : this.filter ? ` /${this.filter}` : ""

      const options = styles.Base.width(this.width).render(lines.join("\n") + err)
      return title + description + filter + options
    },

    Focus(): Cmd { this.focused = true; return null },
    Blur(): Cmd {
      this.focused = false; this.filtering = false
      if (this.validate) { const r = this.validate(this.value); this.err = r === true ? null : String(r) }
      return null
    },
    Error(): string | null { return this.err },
    Skip(): boolean { return false },
    Zoom(): boolean { return false },
    GetKey(): string { return this.key },
    GetValue(): any { return this.accessor.Get() },
    WithTheme(theme: Theme): Field { return c(this, { theme }) },
    WithKeyMap(keymap: KeyMap): Field { return c(this, { keymap }) },
    WithWidth(width: number): Field { return c(this, { width }) },
    WithHeight(height: number): Field { return c(this, { height }) },
    WithPosition(pos: FieldPosition): Field { return c(this, { position: pos }) },
    KeyBindings(): KeyBinding[] {
      return [
        { key: "\u2191/\u2193", help: "navigate", action: () => {} },
        { key: "space", help: "toggle", action: () => {} },
        { key: "enter", help: "submit", action: () => {} },
        { key: "ctrl+a", help: "select all/none", action: () => {} },
        { key: "/", help: "filter", action: () => {} },
      ]
    },
  }

  return model
}
