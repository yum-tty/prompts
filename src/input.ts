import type { Msg, Cmd } from "@yum-tty/cinnamon-bun"
import { Style } from "@yum-tty/caramel"
import type { Field, KeyBinding, ValidateFunc, FieldPosition } from "./field"
import type { Theme } from "./theme"
import { activeStyles } from "./theme"
import type { Eval } from "./eval"
import { createEval } from "./eval"
import { type Accessor, EmbeddedAccessor } from "./accessor"
import type { KeyMap } from "./keymap"

export enum EchoMode {
  Normal = "normal",
  Password = "password",
  None = "none",
}

export interface InputModel extends Field {
  type: "input"
  accessor: Accessor<string>
  key: string
  value: string
  placeholder: string
  title: string
  description: string
  width: number
  height: number
  focused: boolean
  validate: ValidateFunc | null
  err: string | null
  charLimit: number
  cursor: number
  echoMode: EchoMode
  prompt: string
  suggestions: string[]
  inline: boolean
  theme: Theme | null
  hasDarkBg: boolean
  keymap: KeyMap | null
  position: FieldPosition | null
  Suggestions(suggestions: string[]): InputModel
  SuggestionsFunc(f: () => string[], bindings?: any): InputModel
  titleEval: Eval<string>
  descriptionEval: Eval<string>
  placeholderEval: Eval<string>
  suggestionsEval: Eval<string[]>
}

function cloneWith<T extends Record<string, any>>(obj: T, changes: Record<string, any>): T {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj, changes)
}

export function Input(config: {
  title?: string
  description?: string
  placeholder?: string
  value?: string
  width?: number
  charLimit?: number
  validate?: ValidateFunc
  echoMode?: EchoMode
  prompt?: string
  suggestions?: string[]
  inline?: boolean
  key?: string
  titleFunc?: () => string
  descriptionFunc?: () => string
  placeholderFunc?: () => string
  suggestionsFunc?: () => string[]
  bindings?: any
} = {}): InputModel {
  const val = config.value ?? ""
  const model: InputModel = {
    type: "input",
    accessor: new EmbeddedAccessor(val),
    key: config.key ?? (config.title ?? "").toLowerCase().replace(/\s+/g, "-"),
    title: config.title ?? "",
    description: config.description ?? "",
    placeholder: config.placeholder ?? "",
    value: val,
    width: config.width ?? 40,
    height: 0,
    focused: false,
    validate: config.validate ?? null,
    err: null,
    charLimit: config.charLimit ?? 0,
    cursor: val.length,
    echoMode: config.echoMode ?? EchoMode.Normal,
    prompt: config.prompt ?? "",
    suggestions: config.suggestions ?? [],
    inline: config.inline ?? false,
    theme: null,
    hasDarkBg: false,
    keymap: null,
    position: null,
    titleEval: config.titleFunc
      ? { ...createEval(config.title ?? ""), fn: config.titleFunc, bindings: config.bindings }
      : createEval(config.title ?? ""),
    descriptionEval: config.descriptionFunc
      ? { ...createEval(config.description ?? ""), fn: config.descriptionFunc, bindings: config.bindings }
      : createEval(config.description ?? ""),
    placeholderEval: config.placeholderFunc
      ? { ...createEval(config.placeholder ?? ""), fn: config.placeholderFunc, bindings: config.bindings }
      : createEval(config.placeholder ?? ""),
    suggestionsEval: config.suggestionsFunc
      ? { ...createEval(config.suggestions ?? []), fn: config.suggestionsFunc, bindings: config.bindings }
      : createEval(config.suggestions ?? []),

    init(): [Field, Cmd] {
      return [this, null]
    },

    update(msg: Msg): [Field, Cmd] {
      if (!msg || !("type" in msg) || msg.type !== "key" || !this.focused) {
        return [this, null]
      }

      const key = msg as any

      if (key.name === "tab" || key.name === "enter") {
        const val = this.value
        const result = this.validate ? this.validate(val) : true
        if (result !== true) {
          return [cloneWith(this, { err: String(result) }), null]
        }
        this.accessor.Set(val)
        return [cloneWith(this, { err: null }), null]
      }

      let newValue = this.value
      let newCursor = this.cursor

      switch (key.name) {
        case "left":
          newCursor = Math.max(0, this.cursor - 1)
          break
        case "right":
          newCursor = Math.min(this.value.length, this.cursor + 1)
          break
        case "home":
          newCursor = 0
          break
        case "end":
          newCursor = this.value.length
          break
        case "backspace":
          if (this.cursor > 0) {
            newValue = this.value.slice(0, this.cursor - 1) + this.value.slice(this.cursor)
            newCursor = this.cursor - 1
          }
          break
        case "delete":
          if (this.cursor < this.value.length) {
            newValue = this.value.slice(0, this.cursor) + this.value.slice(this.cursor + 1)
          }
          break
        case "ctrl+e": {
          if (this.suggestions.length > 0) {
            const matching = this.suggestions.filter((s) =>
              s.toLowerCase().startsWith(this.value.toLowerCase())
            )
            if (matching.length > 0) {
              newValue = matching[0]!
              newCursor = newValue.length
            }
          }
          break
        }
        default:
          if (key.name && key.name.length === 1 && !key.ctrl && !key.alt) {
            if (this.charLimit === 0 || this.value.length < this.charLimit) {
              newValue = this.value.slice(0, this.cursor) + key.name + this.value.slice(this.cursor)
              newCursor = this.cursor + 1
            }
          }
          break
      }

      return [cloneWith(this, { value: newValue, cursor: newCursor }), null]
    },

    view(): string {
      const styles = activeStyles(this.theme, this.focused, this.hasDarkBg)
      const title = this.title ? styles.Title.render(`${this.title}: `) : ""
      const description = this.description ? styles.Description.render(` ${this.description}`) : ""

      if (this.value.length === 0 && !this.focused) {
        const placeholder = styles.TextInput.Placeholder.render(this.placeholder)
        return `${title}${description}\n  ${this.prompt}${placeholder}\x1b[0m`
      }

      let displayValue: string
      switch (this.echoMode) {
        case EchoMode.Password:
          displayValue = "\u25CF".repeat(this.value.length)
          break
        case EchoMode.None:
          displayValue = ""
          break
        default:
          displayValue = this.value
      }

      const before = displayValue.slice(0, this.cursor)
      const char = displayValue[this.cursor] || " "
      const after = displayValue.slice(this.cursor + 1)

      const cursor = new Style().reverse(true).render(char)
      const value = styles.TextInput.Text.render(before) + cursor + styles.TextInput.Text.render(after)

      const err = this.err ? styles.ErrorMessage.render(` ${this.err}`) : ""

      return `${title}${description}\n  ${this.prompt}${value}${err}\x1b[0m`
    },

    Focus(): Cmd {
      this.focused = true
      return null
    },

    Blur(): Cmd {
      this.focused = false
      if (this.validate) {
        const result = this.validate(this.value)
        this.err = result === true ? null : String(result)
      }
      return null
    },

    Error(): string | null { return this.err },
    Skip(): boolean { return false },
    Zoom(): boolean { return false },
    GetKey(): string { return this.key },
    GetValue(): any { return this.accessor.Get() },

    WithTheme(theme: Theme): Field { return cloneWith(this, { theme }) },
    WithKeyMap(keymap: KeyMap): Field { return cloneWith(this, { keymap }) },
    WithWidth(width: number): Field { return cloneWith(this, { width }) },
    WithHeight(height: number): Field { return cloneWith(this, { height }) },
    WithPosition(pos: FieldPosition): Field { return cloneWith(this, { position: pos }) },

    Suggestions(suggestions: string[]): InputModel {
      return cloneWith(this, {
        suggestions,
        suggestionsEval: { ...createEval(suggestions) },
      })
    },

    SuggestionsFunc(f: () => string[], bindings?: any): InputModel {
      return cloneWith(this, {
        suggestionsEval: { ...createEval(this.suggestions), fn: f, bindings },
      })
    },

    KeyBindings(): KeyBinding[] {
      const binds: KeyBinding[] = [
        { key: "\u2190", help: "move cursor left", action: () => {} },
        { key: "\u2192", help: "move cursor right", action: () => {} },
        { key: "backspace", help: "delete character", action: () => {} },
      ]
      if (this.suggestions.length > 0) {
        binds.unshift({ key: "ctrl+e", help: "complete", action: () => {} })
      }
      return binds
    },
  }

  return model
}
