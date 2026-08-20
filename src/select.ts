import type { Msg, Cmd } from "@yum-tty/cinnamon-bun"
import type { Field, FieldPosition } from "./field"
import type { Theme } from "./theme"
import { activeStyles } from "./theme"
import type { Eval } from "./eval"
import { createEval } from "./eval"
import { type Accessor, EmbeddedAccessor } from "./accessor"
import type { KeyMap } from "./keymap"
import { NewDefaultKeyMap } from "./keymap"
import type { KeyBinding as KmKeyBinding } from "./keymap"
import {
  type ViewportModel,
  Viewport as CreateViewport,
  SetContent,
  ViewportSetHeight,
  ViewportSetWidth,
  ScrollUp,
  ScrollDown,
  GotoTop,
  GotoBottom,
  YOffset,
  ViewportHeight,
  ViewportView,
} from "@yum-tty/cinnamon"

export interface Option {
  label: string
  value: string
  description?: string
}

export interface SelectModel extends Field {
  type: "select"
  accessor: Accessor<string>
  key: string
  value: string
  options: Option[]
  filteredOptions: Option[]
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
  viewport: ViewportModel
  validate: ((value: any) => boolean | string) | null
  err: string | null
  theme: Theme | null
  hasDarkBg: boolean
  keymap: KeyMap | null
  position: FieldPosition | null
  optionsEval: Eval<Option[]>
  Hovered(): Option | undefined
  GetFiltering(): boolean
}

function matchesKey(msg: any, binding: KmKeyBinding): boolean {
  if (!binding.enabled || binding.keys.length === 0) return false
  const parts: string[] = []
  if (msg.ctrl) parts.push("ctrl")
  if (msg.alt) parts.push("alt")
  if (msg.meta) parts.push("meta")
  parts.push(msg.name)
  const keyStr = parts.join("+")
  for (const v of binding.keys) {
    if (keyStr === v || msg.name === v) return true
  }
  return false
}

function ensureCursorVisibleVP(vp: ViewportModel, cursorLine: number): ViewportModel {
  const yOff = YOffset(vp)
  const vHeight = ViewportHeight(vp)
  if (cursorLine < yOff) {
    return ScrollUp(vp, yOff - cursorLine)
  } else if (cursorLine + 1 > yOff + vHeight) {
    return ScrollDown(vp, cursorLine + 1 - yOff - vHeight)
  }
  return vp
}

function cloneKB(kb: KmKeyBinding, changes: Partial<KmKeyBinding>): KmKeyBinding {
  return { ...kb, ...changes }
}

function applyFilterState(km: KeyMap, filtering: boolean, filterValue: string): KeyMap {
  return {
    ...km,
    Select: {
      ...km.Select,
      SetFilter: cloneKB(km.Select.SetFilter, { enabled: filtering }),
      Filter: cloneKB(km.Select.Filter, { enabled: !filtering }),
      ClearFilter: cloneKB(km.Select.ClearFilter, { enabled: !filtering && filterValue !== "" }),
    },
  }
}

function c<T extends Record<string, any>>(obj: T, changes: Record<string, any>): T {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj, changes)
}

export function Select(config: {
  title?: string
  description?: string
  options: Option[]
  value?: string
  width?: number
  filterable?: boolean
  inline?: boolean
  height?: number
  validate?: (value: any) => boolean | string
  key?: string
  optionsFunc?: () => Option[]
  bindings?: any
} = { options: [] }): SelectModel {
  const options = config.options
  const value = config.value ?? options[0]?.value ?? ""
  const cursorIdx = options.findIndex((o) => o.value === value)
  const h = Math.min(config.height ?? 10, options.length + 1)
  const w = config.width ?? 40

  const model: SelectModel = {
    type: "select",
    accessor: new EmbeddedAccessor(value),
    key: config.key ?? (config.title ?? "").toLowerCase().replace(/\s+/g, "-"),
    title: config.title ?? "",
    description: config.description ?? "",
    options,
    filteredOptions: options,
    value,
    width: w,
    focused: false,
    cursor: cursorIdx >= 0 ? cursorIdx : 0,
    filterable: config.filterable ?? false,
    filter: "",
    filtering: false,
    inline: config.inline ?? false,
    height: h,
    viewport: CreateViewport({ width: w, height: h }),
    validate: config.validate ?? null,
    err: null,
    theme: null,
    hasDarkBg: false,
    keymap: NewDefaultKeyMap(),
    position: null,
    optionsEval: config.optionsFunc
      ? { ...createEval(options), fn: config.optionsFunc, bindings: config.bindings }
      : createEval(options),

    init(): [Field, Cmd] { return [this, null] },

    update(msg: Msg): [Field, Cmd] {
      if (!msg || !("type" in msg)) return [this, null]

      let m: SelectModel = this as SelectModel

      if (m.optionsEval.fn) {
        const [needsUpdate, newHash] = m.optionsEval.shouldUpdate()
        if (needsUpdate) {
          m.optionsEval.bindingsHash = newHash
          if (!m.optionsEval.loadFromCache()) {
            const newOptions = m.optionsEval.fn()
            m.optionsEval.update(newOptions)
          }
          const newOptions = m.optionsEval.val
          const newFiltered = m.filter
            ? newOptions.filter((o) => o.label.toLowerCase().includes(m.filter.toLowerCase()))
            : newOptions
          m = c(m, { options: newOptions, filteredOptions: newFiltered, cursor: Math.min(m.cursor, Math.max(0, newFiltered.length - 1)) })
        }
      }

      if (msg.type !== "key") return [m, null]
      if (!m.focused) return [m, null]
      if (!m.keymap) return [m, null]

      const key = msg as any
      const km = m.keymap.Select

      if (m.filtering) {
        if (key.name === "backspace") {
          const nf = m.filter.slice(0, -1)
          const filtered = nf
            ? m.options.filter((o) => o.label.toLowerCase().includes(nf.toLowerCase()))
            : m.options
          const newKm = applyFilterState(m.keymap, true, nf)
          return [c(m, { filter: nf, filteredOptions: filtered, cursor: 0, keymap: newKm }), null]
        }
        if (matchesKey(key, km.SetFilter)) {
          const newKm = applyFilterState(m.keymap, false, m.filter)
          return [c(m, { filtering: false, keymap: newKm }), null]
        }
        if (matchesKey(key, km.ClearFilter)) {
          const newKm = applyFilterState(m.keymap, false, "")
          return [c(m, { filter: "", filtering: false, filteredOptions: m.options, cursor: 0, keymap: newKm }), null]
        }
        if (key.name && key.name.length === 1 && !key.ctrl) {
          const nf = m.filter + key.name
          const filtered = m.options.filter((o) => o.label.toLowerCase().includes(nf.toLowerCase()))
          if (filtered.length > 0) {
            const newKm = applyFilterState(m.keymap, true, nf)
            return [c(m, { filter: nf, filteredOptions: filtered, cursor: 0, keymap: newKm }), null]
          }
          return [m, null]
        }
        return [m, null]
      }

      if (matchesKey(key, km.Filter)) {
        const newKm = applyFilterState(m.keymap, true, "")
        return [c(m, { filtering: true, filter: "", keymap: newKm }), null]
      }

      if (matchesKey(key, km.Up) || matchesKey(key, km.Left)) {
        let nc = m.cursor - 1
        let vp = m.viewport
        if (nc < 0) {
          nc = m.filteredOptions.length - 1
          const [bottomVp] = GotoBottom(vp)
          vp = bottomVp
        } else {
          vp = ensureCursorVisibleVP(vp, nc)
        }
        const val = nc >= 0 && nc < m.filteredOptions.length ? m.filteredOptions[nc]!.value : m.value
        m.accessor.Set(val)
        return [c(m, { cursor: nc, value: val, viewport: vp }), null]
      }

      if (matchesKey(key, km.Down) || matchesKey(key, km.Right)) {
        if (m.filteredOptions.length === 0) return [m, null]
        let nc = m.cursor + 1
        let vp = m.viewport
        if (nc > m.filteredOptions.length - 1) {
          nc = 0
          const [topVp] = GotoTop(vp)
          vp = topVp
        } else {
          vp = ensureCursorVisibleVP(vp, nc)
        }
        const val = m.filteredOptions[nc]!.value
        m.accessor.Set(val)
        return [c(m, { cursor: nc, value: val, viewport: vp }), null]
      }

      if (matchesKey(key, km.GotoTop)) {
        const nc = 0
        const [topVp] = GotoTop(m.viewport)
        const val = m.filteredOptions.length > 0 ? m.filteredOptions[nc]!.value : m.value
        m.accessor.Set(val)
        return [c(m, { cursor: nc, value: val, viewport: topVp }), null]
      }

      if (matchesKey(key, km.GotoBottom)) {
        if (m.filteredOptions.length === 0) return [m, null]
        const nc = m.filteredOptions.length - 1
        const [bottomVp] = GotoBottom(m.viewport)
        const val = m.filteredOptions[nc]!.value
        m.accessor.Set(val)
        return [c(m, { cursor: nc, value: val, viewport: bottomVp }), null]
      }

      if (matchesKey(key, km.HalfPageUp)) {
        const nc = Math.max(0, m.cursor - Math.floor(ViewportHeight(m.viewport) / 2))
        const vp = ensureCursorVisibleVP(m.viewport, nc)
        const val = nc >= 0 && nc < m.filteredOptions.length ? m.filteredOptions[nc]!.value : m.value
        m.accessor.Set(val)
        return [c(m, { cursor: nc, value: val, viewport: vp }), null]
      }

      if (matchesKey(key, km.HalfPageDown)) {
        if (m.filteredOptions.length === 0) return [m, null]
        const nc = Math.min(m.filteredOptions.length - 1, m.cursor + Math.floor(ViewportHeight(m.viewport) / 2))
        const vp = ensureCursorVisibleVP(m.viewport, nc)
        const val = m.filteredOptions[nc]!.value
        m.accessor.Set(val)
        return [c(m, { cursor: nc, value: val, viewport: vp }), null]
      }

      if (matchesKey(key, km.Next) || matchesKey(key, km.Submit)) {
        if (m.cursor >= m.filteredOptions.length) return [m, null]
        const val = m.filteredOptions[m.cursor]!.value
        m.accessor.Set(val)
        return [c(m, { value: val, err: null }), null]
      }

      if (matchesKey(key, km.Prev)) {
        if (m.cursor >= m.filteredOptions.length) return [m, null]
        const val = m.filteredOptions[m.cursor]!.value
        m.accessor.Set(val)
        return [c(m, { value: val, err: null }), null]
      }

      return [m, null]
    },

    view(): string {
      let m: SelectModel = this as SelectModel

      if (m.optionsEval.fn) {
        const [needsUpdate, newHash] = m.optionsEval.shouldUpdate()
        if (needsUpdate) {
          m.optionsEval.bindingsHash = newHash
          if (!m.optionsEval.loadFromCache()) {
            const newOptions = m.optionsEval.fn()
            m.optionsEval.update(newOptions)
          }
          const newOptions = m.optionsEval.val
          const newFiltered = m.filter
            ? newOptions.filter((o) => o.label.toLowerCase().includes(m.filter.toLowerCase()))
            : newOptions
          m = c(m, { options: newOptions, filteredOptions: newFiltered, cursor: Math.min(m.cursor, Math.max(0, newFiltered.length - 1)) })
        }
      }

      const styles = activeStyles(m.theme, m.focused, m.hasDarkBg)
      const title = m.title ? styles.Title.render(m.title + ": ") : ""
      const description = m.description ? styles.Description.render(` ${m.description}`) : ""

      const baseFrameSize = styles.Base.getHorizontalFrameSize()
      const innerWidth = Math.max(0, m.width - baseFrameSize)

      const optionLines: string[] = []
      for (let i = 0; i < m.filteredOptions.length; i++) {
        const opt = m.filteredOptions[i]!
        const isSelected = i === m.cursor
        const prefix = isSelected ? styles.SelectSelector.render("\u25B8 ") : "  "
        const label = isSelected
          ? styles.SelectedOption.render(opt.label)
          : styles.UnselectedOption.render(opt.label)
        optionLines.push(prefix + label)
      }
      const optionsContent = optionLines.join("\n")

      let vp = SetContent(m.viewport, optionsContent)
      vp = ViewportSetHeight(vp, m.filteredOptions.length)
      vp = ViewportSetWidth(vp, innerWidth)
      const visibleOptions = ViewportView(vp)

      const err = m.err ? styles.ErrorMessage.render(` ${m.err}`) : ""
      const filter = m.filtering ? ` /${m.filter}` : m.filter ? ` /${m.filter}` : ""

      const options = styles.Base.width(m.width).render(visibleOptions + err)
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
    WithWidth(width: number): Field {
      const vp = ViewportSetWidth(this.viewport, width)
      return c(this, { width, viewport: vp })
    },
    WithHeight(height: number): Field {
      const vp = ViewportSetHeight(this.viewport, height)
      return c(this, { height, viewport: vp })
    },
    WithPosition(pos: FieldPosition): Field {
      const km = this.keymap
      if (!km || this.filtering) return c(this, { position: pos })
      const isFirst = pos.Field === pos.FirstField && pos.Group === pos.FirstGroup
      const isLast = pos.Field === pos.LastField && pos.Group === pos.LastGroup
      const newSelect = {
        ...km.Select,
        Prev: cloneKB(km.Select.Prev, { enabled: !isFirst }),
        Next: cloneKB(km.Select.Next, { enabled: !isLast }),
        Submit: cloneKB(km.Select.Submit, { enabled: isLast }),
      }
      return c(this, { position: pos, keymap: { ...km, Select: newSelect } })
    },
    KeyBindings() {
      const km = this.keymap?.Select
      if (!km) return []
      const bindings: Array<{ key: string; help: string; action: () => void }> = []
      if (km.Up.enabled) bindings.push({ key: km.Up.key, help: km.Up.help, action: () => {} })
      if (km.Down.enabled) bindings.push({ key: km.Down.key, help: km.Down.help, action: () => {} })
      if (km.Filter.enabled) bindings.push({ key: km.Filter.key, help: km.Filter.help, action: () => {} })
      if (km.GotoTop.enabled) bindings.push({ key: km.GotoTop.key, help: km.GotoTop.help, action: () => {} })
      if (km.HalfPageUp.enabled) bindings.push({ key: km.HalfPageUp.key, help: km.HalfPageUp.help, action: () => {} })
      return bindings
    },
    Hovered(): Option | undefined {
      if (this.filteredOptions.length === 0 || this.cursor >= this.filteredOptions.length) {
        return undefined
      }
      return this.filteredOptions[this.cursor]
    },
    GetFiltering(): boolean {
      return this.filtering
    },
  }

  return model
}
