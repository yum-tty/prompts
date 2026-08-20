import type { Msg, Cmd } from "@yum-tty/cinnamon-bun"
import { Style } from "@yum-tty/caramel"
import type { Field, KeyBinding, ValidateFunc, FieldPosition } from "./field"
import type { Theme } from "./theme"
import { activeStyles } from "./theme"
import type { Eval } from "./eval"
import { createEval } from "./eval"
import { type Accessor, EmbeddedAccessor } from "./accessor"
import type { KeyMap } from "./keymap"

export interface TextModel extends Field {
  type: "text"
  accessor: Accessor<string>
  key: string
  value: string
  placeholder: string
  title: string
  description: string
  lines: number
  charLimit: number
  showLineNumbers: boolean
  focused: boolean
  validate: ValidateFunc | null
  err: string | null
  cursor: { row: number; col: number }
  scrolledLine: number
  theme: Theme | null
  hasDarkBg: boolean
  keymap: KeyMap | null
  position: FieldPosition | null
  externalEditor: boolean
  editorCmd: string
  editorArgs: string[]
  editorExtension: string
  titleEval: Eval<string>
  descriptionEval: Eval<string>
  placeholderEval: Eval<string>
}

function c<T extends Record<string, any>>(obj: T, changes: Record<string, any>): T {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj, changes)
}

function getEditor(): [string, string[]] {
  const editor = (process.env.EDITOR ?? "").trim()
  if (editor) {
    const parts = editor.split(/\s+/)
    return [parts[0]!, parts.slice(1)]
  }
  return ["nano", []]
}

export function Text(config: {
  title?: string
  description?: string
  placeholder?: string
  value?: string
  lines?: number
  charLimit?: number
  showLineNumbers?: boolean
  validate?: ValidateFunc
  key?: string
  externalEditor?: boolean
  editor?: string[]
  editorExtension?: string
  titleFunc?: () => string
  descriptionFunc?: () => string
  placeholderFunc?: () => string
  bindings?: any
} = {}): TextModel {
  const lines = config.lines ?? 5
  const value = config.value ?? ""
  const [editorCmd, editorArgs] = getEditor()

  const model: TextModel = {
    type: "text",
    accessor: new EmbeddedAccessor(value),
    key: config.key ?? "",
    title: config.title ?? "",
    description: config.description ?? "",
    placeholder: config.placeholder ?? "",
    value,
    lines,
    charLimit: config.charLimit ?? 0,
    showLineNumbers: config.showLineNumbers ?? false,
    focused: false,
    validate: config.validate ?? null,
    err: null,
    cursor: { row: 0, col: 0 },
    scrolledLine: 0,
    theme: null,
    hasDarkBg: false,
    keymap: null,
    position: null,
    externalEditor: config.externalEditor ?? true,
    editorCmd: config.editor?.[0] ?? editorCmd,
    editorArgs: config.editor?.slice(1) ?? editorArgs,
    editorExtension: config.editorExtension ?? "md",
    titleEval: config.titleFunc
      ? { ...createEval(config.title ?? ""), fn: config.titleFunc, bindings: config.bindings }
      : createEval(config.title ?? ""),
    descriptionEval: config.descriptionFunc
      ? { ...createEval(config.description ?? ""), fn: config.descriptionFunc, bindings: config.bindings }
      : createEval(config.description ?? ""),
    placeholderEval: config.placeholderFunc
      ? { ...createEval(config.placeholder ?? ""), fn: config.placeholderFunc, bindings: config.bindings }
      : createEval(config.placeholder ?? ""),

    init(): [Field, Cmd] { return [this, null] },

    update(msg: Msg): [Field, Cmd] {
      if (!msg || !("type" in msg) || msg.type !== "key" || !this.focused) {
        return [this, null]
      }

      const key = msg as any

      if (key.name === "tab") {
        const result = this.validate ? this.validate(this.value) : true
        if (result !== true) return [c(this, { err: String(result) }), null]
        this.accessor.Set(this.value)
        return [c(this, { err: null }), null]
      }

      if (key.name === "ctrl+e" && this.externalEditor) {
        const self = this
        return [this, async (): Promise<Msg> => {
          const { spawn } = await import("node:child_process")
          const { writeFileSync, readFileSync, unlinkSync } = await import("node:fs")
          const { join } = await import("node:path")
          const { tmpdir } = await import("node:os")

          const ext = self.editorExtension.replace(/^\./, "")
          const tmpFile = join(tmpdir(), `huh-text-${Date.now()}.${ext}`)
          writeFileSync(tmpFile, self.value, "utf-8")

          return new Promise((resolve) => {
            const proc = spawn(self.editorCmd, [...self.editorArgs, tmpFile], {
              stdio: "inherit",
            })
            proc.on("error", (err) => {
              try {
                unlinkSync(tmpFile)
              } catch {}
              resolve({ type: "editor-result", value: self.value } as any)
            })
            proc.on("close", () => {
              try {
                const content = readFileSync(tmpFile, "utf-8")
                unlinkSync(tmpFile)
                resolve({ type: "editor-result", value: content } as any)
              } catch {
                resolve({ type: "editor-result", value: self.value } as any)
              }
            })
          })
        }]
      }

      if ((key as any).type === "editor-result") {
        return [c(this, { value: (key as any).value, cursor: { row: 0, col: 0 } }), null]
      }

      if (key.name === "enter" && !key.alt) return [this, null]

      if ((key.name === "enter" && key.alt) || key.name === "ctrl+j") {
        const textLines = this.value.split("\n")
        const line = textLines[this.cursor.row]!
        textLines[this.cursor.row] = line.slice(0, this.cursor.col)
        textLines.splice(this.cursor.row + 1, 0, line.slice(this.cursor.col))
        return [c(this, { value: textLines.join("\n"), cursor: { row: this.cursor.row + 1, col: 0 } }), null]
      }

      let newValue = this.value
      let newCursor = { ...this.cursor }
      const textLines = this.value.split("\n")

      switch (key.name) {
        case "up":
          if (newCursor.row > 0) {
            newCursor.row--
            newCursor.col = Math.min(newCursor.col, textLines[newCursor.row]!.length)
          }
          break
        case "down":
          if (newCursor.row < textLines.length - 1) {
            newCursor.row++
            newCursor.col = Math.min(newCursor.col, textLines[newCursor.row]!.length)
          }
          break
        case "left":
          if (newCursor.col > 0) newCursor.col--
          else if (newCursor.row > 0) { newCursor.row--; newCursor.col = textLines[newCursor.row]!.length }
          break
        case "right":
          if (newCursor.col < textLines[newCursor.row]!.length) newCursor.col++
          else if (newCursor.row < textLines.length - 1) { newCursor.row++; newCursor.col = 0 }
          break
        case "home": newCursor.col = 0; break
        case "end": newCursor.col = textLines[newCursor.row]!.length; break
        case "backspace":
          if (newCursor.col > 0) {
            const line = textLines[newCursor.row]!
            textLines[newCursor.row] = line.slice(0, newCursor.col - 1) + line.slice(newCursor.col)
            newCursor.col--
          } else if (newCursor.row > 0) {
            const prevLen = textLines[newCursor.row - 1]!.length
            textLines[newCursor.row - 1]! += textLines[newCursor.row]!
            textLines.splice(newCursor.row, 1)
            newCursor.row--; newCursor.col = prevLen
          }
          newValue = textLines.join("\n")
          break
        case "delete":
          if (newCursor.col < textLines[newCursor.row]!.length) {
            const line = textLines[newCursor.row]!
            textLines[newCursor.row] = line.slice(0, newCursor.col) + line.slice(newCursor.col + 1)
          } else if (newCursor.row < textLines.length - 1) {
            textLines[newCursor.row]! += textLines[newCursor.row + 1]!
            textLines.splice(newCursor.row + 1, 1)
          }
          newValue = textLines.join("\n")
          break
        default:
          if (key.name && key.name.length === 1 && !key.ctrl) {
            if (this.charLimit === 0 || newValue.length < this.charLimit) {
              const line = textLines[newCursor.row]!
              textLines[newCursor.row] = line.slice(0, newCursor.col) + key.name + line.slice(newCursor.col)
              newCursor.col++
              newValue = textLines.join("\n")
            }
          }
          break
      }

      return [c(this, { value: newValue, cursor: newCursor }), null]
    },

    view(): string {
      const styles = activeStyles(this.theme, this.focused, this.hasDarkBg)
      const title = this.title ? styles.Title.render(`${this.title}: `) : ""
      const description = this.description ? styles.Description.render(` ${this.description}`) : ""

      const textLines = this.value.split("\n")
      const displayLines: string[] = []

      const startLine = this.scrolledLine
      const endLine = Math.min(startLine + this.lines, textLines.length)

      for (let i = startLine; i < endLine; i++) {
        let prefix = ""
        if (this.showLineNumbers) {
          prefix = new Style().dim(true).render(`${String(i + 1).padStart(3)} `)
        }
        const line = textLines[i] ?? ""
        if (i === this.cursor.row && this.focused) {
          const before = line.slice(0, this.cursor.col)
          const char = line[this.cursor.col] || " "
          const after = line.slice(this.cursor.col + 1)
          displayLines.push(prefix + styles.TextInput.Text.render(before) + new Style().reverse(true).render(char) + styles.TextInput.Text.render(after))
        } else {
          displayLines.push(prefix + styles.TextInput.Text.render(line))
        }
      }

      const err = this.err ? styles.ErrorMessage.render(` ${this.err}`) : ""

      if (this.value.length === 0 && !this.focused) {
        const placeholder = styles.TextInput.Placeholder.render(this.placeholder)
        return `${title}${description}\n  ${placeholder}\x1b[0m`
      }

      return `${title}${description}\n${displayLines.join("\n")}${err}\x1b[0m`
    },

    Focus(): Cmd { this.focused = true; return null },
    Blur(): Cmd {
      this.focused = false
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
        { key: "\u2191/\u2193", help: "navigate lines", action: () => {} },
        { key: "\u2190/\u2192", help: "move cursor", action: () => {} },
        { key: "enter", help: "new line", action: () => {} },
        { key: "backspace", help: "delete character", action: () => {} },
      ]
    },
  }

  return model
}
