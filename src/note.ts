import type { Msg, Cmd } from "@yum-tty/cinnamon-bun"
import type { Field, KeyBinding, FieldPosition } from "./field"
import type { Theme } from "./theme"
import { activeStyles } from "./theme"
import type { Eval } from "./eval"
import { createEval } from "./eval"
import type { KeyMap } from "./keymap"

function renderMarkdown(input: string): string {
  let result = ""
  let italic = false
  let bold = false
  let codeblock = false
  let escape = false

  for (const char of input) {
    if (escape || codeblock) {
      result += char
      escape = false
      continue
    }
    switch (char) {
      case "\\":
        escape = true
        break
      case "_":
        if (!italic) { result += "\x1b[3m"; italic = true }
        else { result += "\x1b[23m"; italic = false }
        break
      case "*":
        if (!bold) { result += "\x1b[1m"; bold = true }
        else { result += "\x1b[22m"; bold = false }
        break
      case "`":
        if (!codeblock) { result += "\x1b[0;37;40m "; codeblock = true }
        else { result += " \x1b[0m"; codeblock = false; if (bold) result += "\x1b[1m"; if (italic) result += "\x1b[3m" }
        break
      default:
        result += char
    }
  }
  result += "\x1b[0m"
  return result
}

function c<T extends Record<string, any>>(obj: T, changes: Record<string, any>): T {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj, changes)
}

export interface NoteModel extends Field {
  type: "note"
  key: string
  title: string
  description: string
  height: number
  width: number
  showNextButton: boolean
  nextLabel: string
  focused: boolean
  skip: boolean
  theme: Theme | null
  hasDarkBg: boolean
  keymap: KeyMap | null
  position: FieldPosition | null
  titleEval: Eval<string>
  descriptionEval: Eval<string>
}

export function Note(config: {
  title?: string
  description?: string
  height?: number
  next?: boolean
  nextLabel?: string
  key?: string
  titleFunc?: () => string
  descriptionFunc?: () => string
  bindings?: any
} = {}): NoteModel {
  const model: NoteModel = {
    type: "note",
    key: config.key ?? "",
    title: config.title ?? "",
    description: config.description ?? "",
    height: config.height ?? 0,
    width: 80,
    showNextButton: config.next ?? false,
    nextLabel: config.nextLabel ?? "Next",
    focused: false,
    skip: true,
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

    init(): [Field, Cmd] { return [this, null] },

    update(msg: Msg): [Field, Cmd] {
      if (!msg || !("type" in msg)) return [this, null]
      if (msg.type !== "key") return [this, null]
      return [this, { type: "field-advance" } as any]
    },

    view(): string {
      const styles = activeStyles(this.theme, this.focused, this.hasDarkBg)
      const parts: string[] = []
      if (this.title) parts.push(styles.NoteTitle.render(this.title))
      if (this.description) { parts.push(""); parts.push(renderMarkdown(this.description)) }
      if (this.showNextButton) { parts.push(""); parts.push(styles.Next.render(`  ${this.nextLabel}`)) }

      const content = parts.join("\n")
      if (this.height > 0) {
        const lines = content.split("\n")
        const padded = lines.concat(Array(Math.max(0, this.height - lines.length)).fill(""))
        return padded.slice(0, this.height).join("\n")
      }
      return content
    },

    Focus(): Cmd { this.focused = true; return null },
    Blur(): Cmd { this.focused = false; return null },
    Error(): string | null { return null },
    Skip(): boolean {
      if (this.position && this.position.Field === this.position.FirstField && this.position.Field === this.position.LastField) return false
      return this.skip
    },
    Zoom(): boolean { return false },
    GetKey(): string { return this.key },
    GetValue(): any { return null },

    WithTheme(theme: Theme): Field { return c(this, { theme }) },
    WithKeyMap(keymap: KeyMap): Field { return c(this, { keymap }) },
    WithWidth(width: number): Field { return c(this, { width }) },
    WithHeight(height: number): Field { return c(this, { height }) },
    WithPosition(pos: FieldPosition): Field {
      const updated = c(this, { position: pos })
      if (pos.Field === pos.FirstField && pos.Field === pos.LastField) updated.skip = false
      return updated
    },

    KeyBindings(): KeyBinding[] {
      return [{ key: "enter", help: "next", action: () => {} }]
    },
  }

  return model
}
