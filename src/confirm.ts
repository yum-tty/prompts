import type { Msg, Cmd } from "cinnamon-bun"
import type { Field, KeyBinding, FieldPosition } from "./field"
import type { Theme } from "./theme"
import { activeStyles } from "./theme"
import { Accessor, EmbeddedAccessor } from "./accessor"
import type { KeyMap } from "./keymap"

export type ButtonAlignment = "left" | "center" | "right"

export type ConfirmValidateFunc = (value: boolean) => true | string

export interface ConfirmModel extends Field {
  type: "confirm"
  accessor: Accessor<boolean>
  key: string
  value: boolean
  title: string
  description: string
  affirmative: string
  negative: string
  focused: boolean
  inline: boolean
  buttonAlignment: ButtonAlignment
  width: number
  height: number
  theme: Theme | null
  hasDarkBg: boolean
  keymap: KeyMap | null
  position: FieldPosition | null
  validate: ConfirmValidateFunc | null
  err: string | null
  Validate(fn: ConfirmValidateFunc): ConfirmModel
}

function c<T extends Record<string, any>>(obj: T, changes: Record<string, any>): T {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj, changes)
}

export function Confirm(config: {
  title?: string
  description?: string
  value?: boolean
  affirmative?: string
  negative?: string
  inline?: boolean
  buttonAlignment?: ButtonAlignment
  width?: number
  height?: number
  key?: string
  validate?: ConfirmValidateFunc
} = {}): ConfirmModel {
  const model: ConfirmModel = {
    type: "confirm",
    accessor: new EmbeddedAccessor(config.value ?? false),
    key: config.key ?? (config.title ?? "").toLowerCase().replace(/\s+/g, "-"),
    title: config.title ?? "",
    description: config.description ?? "",
    value: config.value ?? false,
    affirmative: config.affirmative ?? "Yes",
    negative: config.negative ?? "No",
    focused: false,
    inline: config.inline ?? false,
    buttonAlignment: config.buttonAlignment ?? "center",
    width: config.width ?? 40,
    height: config.height ?? 0,
    theme: null,
    hasDarkBg: false,
    keymap: null,
    position: null,
    validate: config.validate ?? null,
    err: null,

    init(): [Field, Cmd] { return [this, null] },

    update(msg: Msg): [Field, Cmd] {
      if (!msg || !("type" in msg)) return [this, null]
      if (msg.type !== "key") return [this, null]
      if (!this.focused) return [this, null]

      const key = msg as any
      switch (key.name) {
        case "left":
        case "right":
          this.accessor.Set(!this.value)
          return [c(this, { value: !this.value, err: null }), null]
        case "y":
          return [c(this, { value: true, err: null }), null]
        case "n":
          return [c(this, { value: false, err: null }), null]
        case "enter":
          this.accessor.Set(this.value)
          return [this, null]
        default:
          return [this, null]
      }
    },

    view(): string {
      const styles = activeStyles(this.theme, this.focused, this.hasDarkBg)
      const title = this.title ? styles.Title.render(this.title + ": ") : ""
      const description = this.description ? styles.Description.render(` ${this.description}`) : ""

      const yesLabel = `  ${this.affirmative}  `
      const noLabel = `  ${this.negative}  `
      const yesStyle = this.value
        ? styles.FocusedButton.render(this.affirmative)
        : styles.BlurredButton.render(this.affirmative)
      const noStyle = !this.value
        ? styles.FocusedButton.render(this.negative)
        : styles.BlurredButton.render(this.negative)

      const options = "  " + yesStyle + "  / " + "  " + noStyle + "  "

      if (this.inline) return title + description + " " + options
      return title + description + "\n  " + options
    },

    Focus(): Cmd { this.focused = true; return null },
    Blur(): Cmd {
      this.focused = false
      this.accessor.Set(this.value)
      if (this.validate) {
        const result = this.validate(this.value)
        this.err = result === true ? null : result
      }
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
    Validate(fn: ConfirmValidateFunc): ConfirmModel { return c(this, { validate: fn }) },

    KeyBindings(): KeyBinding[] {
      return [
        { key: "\u2190/\u2192", help: "toggle", action: () => {} },
        { key: "y/n", help: "select", action: () => {} },
        { key: "enter", help: "submit", action: () => {} },
      ]
    },
  }

  return model
}

export function ConfirmWithAffirmative(config: {
  title?: string
  description?: string
  value?: boolean
  affirmative: string
  negative?: string
  inline?: boolean
  buttonAlignment?: ButtonAlignment
  width?: number
  height?: number
  key?: string
}): ConfirmModel {
  return Confirm({ ...config, affirmative: config.affirmative })
}

export function ConfirmWithNegative(config: {
  title?: string
  description?: string
  value?: boolean
  affirmative?: string
  negative: string
  inline?: boolean
  buttonAlignment?: ButtonAlignment
  width?: number
  height?: number
  key?: string
}): ConfirmModel {
  return Confirm({ ...config, negative: config.negative })
}
