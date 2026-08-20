import type { Msg, Cmd } from "@yum-tty/cinnamon-bun"
import { type Accessor, EmbeddedAccessor } from "./accessor"
import type { Field, FieldPosition, KeyBinding } from "./field"
import type { Theme } from "./theme"
import { activeStyles } from "./theme"

export interface Option<T> {
  Key: string
  Value: T
  selected?: boolean
}

export function NewOption<T>(key: string, value: T): Option<T> {
  return { Key: key, Value: value, selected: false }
}

export function NewOptions<T>(...values: T[]): Option<T>[] {
  return values.map((v) => ({
    Key: String(v),
    Value: v,
    selected: false,
  }))
}

export function OptionSelected<T>(option: Option<T>, selected: boolean): Option<T> {
  return { ...option, selected }
}

export interface SelectTypedModel<T> extends Field {
  type: "select"
  accessor: Accessor<T>
  key: string
  value: T
  options: Option<T>[]
  filteredOptions: Option<T>[]
  title: string
  description: string
  width: number
  focused: boolean
  cursor: number
  filterable: boolean
  filter: string
  filtering: boolean
  inline: boolean
  height: number
  scrolledLine: number
  validate: ((value: T) => boolean | string) | null
  err: string | null
  theme: any
  hasDarkBg: boolean
  keymap: any
  position: any
}

export interface MultiSelectTypedModel<T> extends Field {
  type: "multiselect"
  accessor: Accessor<T[]>
  key: string
  value: T[]
  options: Option<T>[]
  filteredOptions: Option<T>[]
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
  validate: ((value: T[]) => boolean | string) | null
  err: string | null
  theme: any
  hasDarkBg: boolean
  keymap: any
  position: any
}

export function SelectTyped<T>(config: {
  title?: string
  description?: string
  options: Option<T>[]
  value?: T
  width?: number
  filterable?: boolean
  inline?: boolean
  height?: number
  validate?: (value: T) => boolean | string
  key?: string
  bindings?: any
}): SelectTypedModel<T> {
  const options = config.options
  const value = config.value ?? options[0]?.Value
  const cursorIdx = options.findIndex((o) => o.Value === value)

  function ensureCursorVisible(cur: number, scrolled: number, h: number, total: number): number {
    if (cur < scrolled) return cur
    if (cur >= scrolled + h) return cur - h + 1
    return scrolled
  }

  function pick<T extends Record<string, any>>(obj: T, changes: Record<string, any>): T {
    return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj, changes)
  }

  const model: SelectTypedModel<T> = {
    type: "select",
    accessor: new EmbeddedAccessor(value as T),
    key: config.key ?? "",
    title: config.title ?? "",
    description: config.description ?? "",
    options,
    filteredOptions: options,
    value: value as T,
    width: config.width ?? 40,
    focused: false,
    cursor: cursorIdx >= 0 ? cursorIdx : 0,
    filterable: config.filterable ?? false,
    filter: "",
    filtering: false,
    inline: config.inline ?? false,
    height: config.height ?? 10,
    scrolledLine: 0,
    validate: config.validate ?? null,
    err: null,
    theme: null,
    hasDarkBg: false,
    keymap: null,
    position: null,
    init: (): [Field, Cmd] => [model, null],

    update(msg: Msg): [Field, Cmd] {
      if (!msg || !("type" in msg)) return [model, null]
      if ((msg as any).type !== "key") return [model, null]
      if (!this.focused) return [model, null]

      const key = msg as any

      if (key.name === "tab" || (key.name === "enter" && !this.filtering)) {
        const result = this.validate ? this.validate(this.value) : true
        if (result !== true) return [pick(model, { err: String(result) }), null]
        return [pick(model, { err: null }), null]
      }

      if (this.filtering) {
        if (key.name === "backspace") {
          const nf = this.filter.slice(0, -1)
          const filtered = nf ? this.options.filter(o => o.Key.toLowerCase().includes(nf.toLowerCase())) : this.options
          return [pick(model, { filter: nf, filteredOptions: filtered, cursor: 0 }), null]
        }
        if (key.name === "enter" || key.name === "esc") return [pick(model, { filtering: false }), null]
        if (key.name && key.name.length === 1 && !key.ctrl) {
          const nf = this.filter + key.name
          const filtered = this.options.filter(o => o.Key.toLowerCase().includes(nf.toLowerCase()))
          if (filtered.length > 0) return [pick(model, { filter: nf, filteredOptions: filtered, cursor: 0 }), null]
          return [model, null]
        }
      }

      switch (key.name) {
        case "up":
        case "k": {
          const nc = Math.max(0, this.cursor - 1)
          return [pick(model, { cursor: nc, scrolledLine: ensureCursorVisible(nc, this.scrolledLine, this.height, this.filteredOptions.length) }), null]
        }
        case "down":
        case "j": {
          if (this.filteredOptions.length === 0) return [model, null]
          const nc = Math.min(this.filteredOptions.length - 1, this.cursor + 1)
          return [pick(model, { cursor: nc, scrolledLine: ensureCursorVisible(nc, this.scrolledLine, this.height, this.filteredOptions.length) }), null]
        }
        case "g":
          return [pick(model, { cursor: 0, scrolledLine: 0 }), null]
        case "G": {
          if (this.filteredOptions.length === 0) return [model, null]
          const last = this.filteredOptions.length - 1
          return [pick(model, { cursor: last, scrolledLine: Math.max(0, last - this.height + 1) }), null]
        }
        case "ctrl+u": {
          const nc = Math.max(0, this.cursor - Math.floor(this.height / 2))
          return [pick(model, { cursor: nc, scrolledLine: ensureCursorVisible(nc, this.scrolledLine, this.height, this.filteredOptions.length) }), null]
        }
        case "ctrl+d": {
          const nc = Math.min(this.filteredOptions.length - 1, this.cursor + Math.floor(this.height / 2))
          return [pick(model, { cursor: nc, scrolledLine: ensureCursorVisible(nc, this.scrolledLine, this.height, this.filteredOptions.length) }), null]
        }
        case "enter": {
          const selected = this.filteredOptions[this.cursor]
          if (selected) return [pick(model, { value: selected.Value }), null]
          return [model, null]
        }
        case "/":
          if (this.filterable) return [pick(model, { filtering: true, filter: "" }), null]
          return [model, null]
        default:
          return [model, null]
      }
    },

    view(): string {
      const styles = activeStyles(this.theme, this.focused, this.hasDarkBg)
      const title = this.title ? styles.Title.render(this.title + ": ") : ""
      const description = this.description ? styles.Description.render(` ${this.description}`) : ""

      const endLine = Math.min(this.scrolledLine + this.height, this.filteredOptions.length)
      const lines: string[] = []
      for (let i = this.scrolledLine; i < endLine; i++) {
        const opt = this.filteredOptions[i]!
        const isSelected = i === this.cursor
        const prefix = isSelected ? styles.SelectSelector.render("\u25B8 ") : "  "
        const label = isSelected
          ? styles.SelectedOption.render(opt.Key)
          : styles.UnselectedOption.render(opt.Key)
        lines.push(prefix + label)
      }

      const err = this.err ? styles.ErrorMessage.render(` ${this.err}`) : ""
      const filter = this.filtering ? ` /${this.filter}` : this.filter ? ` /${this.filter}` : ""

      return styles.Base.width(this.width).height(this.height).render(title + description + filter + "\n" + lines.join("\n") + err)
    },

    Focus: () => { model.focused = true; return null },
    Blur(): Cmd {
      model.focused = false
      model.filtering = false
      if (model.validate) {
        const r = model.validate(model.value)
        model.err = r === true ? null : String(r)
      }
      return null
    },
    Error: () => model.err,
    Skip: () => false,
    Zoom: () => false,
    GetKey: () => config.key ?? "",
    GetValue: () => model.value,
    WithTheme: (t: any) => pick(model, { theme: t }) as any,
    WithKeyMap: (k: any) => pick(model, { keymap: k }) as any,
    WithWidth: (w: number) => pick(model, { width: w }) as any,
    WithHeight: (h: number) => pick(model, { height: h }) as any,
    WithPosition: (p: any) => pick(model, { position: p }) as any,
    KeyBindings(): KeyBinding[] {
      return [
        { key: "\u2191/\u2193", help: "navigate", action: () => {} },
        { key: "enter", help: "select", action: () => {} },
        { key: "/", help: "filter", action: () => {} },
        { key: "g/G", help: "go to start/end", action: () => {} },
        { key: "ctrl+u/d", help: "half page up/down", action: () => {} },
      ]
    },
  }

  return model
}

export function MultiSelectTyped<T>(config: {
  title?: string
  description?: string
  options: Option<T>[]
  value?: T[]
  width?: number
  limit?: number
  height?: number
  validate?: (value: T[]) => boolean | string
  key?: string
  bindings?: any
}): MultiSelectTypedModel<T> {
  const options = config.options.map((o) => ({
    ...o,
    selected: (config.value ?? []).includes(o.Value),
  }))
  const value = config.value ?? []

  function mEnsureCursorVisible(cur: number, scrolled: number, h: number, total: number): number {
    if (cur < scrolled) return cur
    if (cur >= scrolled + h) return cur - h + 1
    return scrolled
  }

  function mPick<T extends Record<string, any>>(obj: T, changes: Record<string, any>): T {
    return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj, changes)
  }

  const model: MultiSelectTypedModel<T> = {
    type: "multiselect",
    accessor: new EmbeddedAccessor(value as T[]),
    key: config.key ?? "",
    title: config.title ?? "",
    description: config.description ?? "",
    options,
    filteredOptions: options,
    value: value as T[],
    width: config.width ?? 40,
    focused: false,
    cursor: 0,
    limit: config.limit ?? 0,
    filterable: true,
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
    init: (): [Field, Cmd] => [model, null],

    update(msg: Msg): [Field, Cmd] {
      if (!msg || !("type" in msg)) return [model, null]
      if ((msg as any).type !== "key") return [model, null]
      if (!this.focused) return [model, null]

      const key = msg as any

      if (key.name === "tab" || (key.name === "enter" && !this.filtering)) {
        const result = this.validate ? this.validate(this.value) : true
        if (result !== true) return [mPick(model, { err: String(result) }), null]
        return [mPick(model, { err: null }), null]
      }

      if (this.filtering) {
        if (key.name === "backspace") {
          const nf = this.filter.slice(0, -1)
          const filtered = nf ? this.options.filter(o => o.Key.toLowerCase().includes(nf.toLowerCase())) : [...this.options]
          return [mPick(model, { filter: nf, filteredOptions: filtered, cursor: 0 }), null]
        }
        if (key.name === "enter" || key.name === "esc") return [mPick(model, { filtering: false }), null]
        if (key.name && key.name.length === 1 && !key.ctrl) {
          const nf = this.filter + key.name
          const filtered = this.options.filter(o => o.Key.toLowerCase().includes(nf.toLowerCase()))
          if (filtered.length > 0) return [mPick(model, { filter: nf, filteredOptions: filtered, cursor: 0 }), null]
          return [model, null]
        }
      }

      switch (key.name) {
        case "up":
        case "k": {
          const nc = Math.max(0, this.cursor - 1)
          return [mPick(model, { cursor: nc, scrolledLine: mEnsureCursorVisible(nc, this.scrolledLine, this.height, this.filteredOptions.length) }), null]
        }
        case "down":
        case "j": {
          if (this.filteredOptions.length === 0) return [model, null]
          const nc = Math.min(this.filteredOptions.length - 1, this.cursor + 1)
          return [mPick(model, { cursor: nc, scrolledLine: mEnsureCursorVisible(nc, this.scrolledLine, this.height, this.filteredOptions.length) }), null]
        }
        case "g":
          return [mPick(model, { cursor: 0, scrolledLine: 0 }), null]
        case "G": {
          if (this.filteredOptions.length === 0) return [model, null]
          const last = this.filteredOptions.length - 1
          return [mPick(model, { cursor: last, scrolledLine: Math.max(0, last - this.height + 1) }), null]
        }
        case "ctrl+u": {
          const nc = Math.max(0, this.cursor - Math.floor(this.height / 2))
          return [mPick(model, { cursor: nc, scrolledLine: mEnsureCursorVisible(nc, this.scrolledLine, this.height, this.filteredOptions.length) }), null]
        }
        case "ctrl+d": {
          const nc = Math.min(this.filteredOptions.length - 1, this.cursor + Math.floor(this.height / 2))
          return [mPick(model, { cursor: nc, scrolledLine: mEnsureCursorVisible(nc, this.scrolledLine, this.height, this.filteredOptions.length) }), null]
        }
        case "space":
        case "x": {
          const opt = this.filteredOptions[this.cursor]
          if (!opt) return [model, null]
          const numSelected = this.options.filter(o => o.selected).length
          if (!opt.selected && this.limit > 0 && numSelected >= this.limit) return [model, null]
          const newOptions = this.options.map(o => o.Key === opt.Key ? { ...o, selected: !o.selected } : o)
          const newFiltered = this.filteredOptions.map(o => o.Key === opt.Key ? { ...o, selected: !o.selected } : o)
          const newValue = newOptions.filter(o => o.selected).map(o => o.Value)
          return [mPick(model, { options: newOptions, filteredOptions: newFiltered, value: newValue }), null]
        }
        case "ctrl+a": {
          if (this.limit > 0) return [model, null]
          const allSelected = this.filteredOptions.every(o => o.selected)
          const newOptions = this.options.map(o => this.filteredOptions.some(fo => fo.Key === o.Key) ? { ...o, selected: !allSelected } : o)
          const newFiltered = this.filteredOptions.map(o => ({ ...o, selected: !allSelected }))
          const newValue = newOptions.filter(o => o.selected).map(o => o.Value)
          return [mPick(model, { options: newOptions, filteredOptions: newFiltered, value: newValue }), null]
        }
        case "/":
          if (this.filterable) return [mPick(model, { filtering: true, filter: "" }), null]
          return [model, null]
        case "enter":
          return [model, null]
        default:
          return [model, null]
      }
    },

    view(): string {
      const styles = activeStyles(this.theme, this.focused, this.hasDarkBg)
      const title = this.title ? styles.Title.render(this.title + ": ") : ""
      const description = this.description ? styles.Description.render(` ${this.description}`) : ""

      const endLine = Math.min(this.scrolledLine + this.height, this.filteredOptions.length)
      const lines: string[] = []
      for (let i = this.scrolledLine; i < endLine; i++) {
        const opt = this.filteredOptions[i]!
        const isSelected = i === this.cursor
        const isChecked = opt.selected
        const mark = isChecked ? styles.SelectedOption.render("\u25CF") : "\u25CB"
        const prefix = isSelected ? styles.MultiSelectSelector.render("\u25B8 ") : "  "
        const label = isSelected
          ? styles.FocusedButton.render(opt.Key)
          : styles.UnselectedOption.render(opt.Key)
        lines.push(prefix + mark + " " + label)
      }

      const err = this.err ? styles.ErrorMessage.render(` ${this.err}`) : ""
      const filter = this.filtering ? ` /${this.filter}` : this.filter ? ` /${this.filter}` : ""

      return styles.Base.width(this.width).height(this.height).render(title + description + filter + "\n" + lines.join("\n") + err)
    },

    Focus: () => { model.focused = true; return null },
    Blur(): Cmd {
      model.focused = false
      model.filtering = false
      if (model.validate) {
        const r = model.validate(model.value)
        model.err = r === true ? null : String(r)
      }
      return null
    },
    Error: () => model.err,
    Skip: () => false,
    Zoom: () => false,
    GetKey: () => config.key ?? "",
    GetValue: () => model.value,
    WithTheme: (t: any) => mPick(model, { theme: t }) as any,
    WithKeyMap: (k: any) => mPick(model, { keymap: k }) as any,
    WithWidth: (w: number) => mPick(model, { width: w }) as any,
    WithHeight: (h: number) => mPick(model, { height: h }) as any,
    WithPosition: (p: any) => mPick(model, { position: p }) as any,
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
