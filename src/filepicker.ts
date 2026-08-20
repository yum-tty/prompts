import type { Msg, Cmd } from "@yum-tty/cinnamon-bun"
import path from "node:path"
import { Style } from "@yum-tty/caramel"
import type { Field, KeyBinding, ValidateFunc, FieldPosition } from "./field"
import type { Theme } from "./theme"
import { activeStyles } from "./theme"
import { type Accessor, EmbeddedAccessor } from "./accessor"
import type { KeyMap } from "./keymap"

export interface FileEntry {
  name: string
  isDir: boolean
  size: number
  permissions: string
}

export interface FilePickerModel extends Field {
  type: "filepicker"
  accessor: Accessor<string>
  key: string
  value: string
  title: string
  description: string
  currentDirectory: string
  picking: boolean
  showHidden: boolean
  showSize: boolean
  showPermissions: boolean
  fileAllowed: boolean
  dirAllowed: boolean
  height: number
  cursor: number
  entries: FileEntry[]
  focused: boolean
  validate: ValidateFunc | null
  err: string | null
  allowedTypes: string[]
  theme: Theme | null
  hasDarkBg: boolean
  keymap: KeyMap | null
  width: number
  position: FieldPosition | null
}

async function readDir(dirPath: string, showHidden: boolean): Promise<FileEntry[]> {
  const { readdir, stat } = await import("node:fs/promises")
  const { join } = await import("node:path")

  try {
    const items = await readdir(dirPath, { withFileTypes: true })
    const entries: FileEntry[] = []

    for (const item of items) {
      if (!showHidden && item.name.startsWith(".")) continue

      const fullPath = join(dirPath, item.name)
      let size = 0
      try {
        const stats = await stat(fullPath)
        size = stats.size
      } catch {
      }

      entries.push({
        name: item.name,
        isDir: item.isDirectory(),
        size,
        permissions: "",
      })
    }

    entries.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1
      if (!a.isDir && b.isDir) return 1
      return a.name.localeCompare(b.name)
    })

    return entries
  } catch {
    return []
  }
}

export function FilePicker(config: {
  title?: string
  description?: string
  value?: string
  currentDirectory?: string
  showHidden?: boolean
  showSize?: boolean
  showPermissions?: boolean
  fileAllowed?: boolean
  dirAllowed?: boolean
  height?: number
  validate?: ValidateFunc
  allowedTypes?: string[]
  key?: string
} = {}): FilePickerModel {
  return {
    type: "filepicker",
    accessor: new EmbeddedAccessor(config.value ?? ""),
    key: config.key ?? "",
    value: config.value ?? "",
    title: config.title ?? "",
    description: config.description ?? "",
    currentDirectory: config.currentDirectory ?? ".",
    picking: false,
    showHidden: config.showHidden ?? false,
    showSize: config.showSize ?? false,
    showPermissions: config.showPermissions ?? false,
    fileAllowed: config.fileAllowed ?? true,
    dirAllowed: config.dirAllowed ?? true,
    height: config.height ?? 10,
    cursor: 0,
    entries: [],
    focused: false,
    validate: config.validate ?? null,
    err: null,
    allowedTypes: config.allowedTypes ?? [],
    theme: null,
    hasDarkBg: false,
    keymap: null,
    width: 80,
    position: null,

    init(): [FilePickerModel, Cmd] {
      const dir = this.currentDirectory
      const hidden = this.showHidden
      return [this, async (): Promise<Msg> => {
        const entries = await readDir(dir, hidden)
        return { type: "entries-loaded", entries } as any
      }]
    },

    update(msg: Msg): [FilePickerModel, Cmd] {
      if (!msg || !("type" in msg)) return [this, null]

      if ((msg as any).type === "entries-loaded") {
        return [{ ...this, entries: (msg as any).entries }, null]
      }

      if (msg.type !== "key") return [this, null]
      if (!this.focused) return [this, null]

      const key = msg as any

      if (this.picking) {
        switch (key.name) {
          case "up":
          case "k":
            return [{ ...this, cursor: Math.max(0, this.cursor - 1) }, null]
          case "down":
          case "j":
            return [{ ...this, cursor: Math.min(this.entries.length - 1, this.cursor + 1) }, null]
          case "enter": {
            const entry = this.entries[this.cursor]
            if (entry) {
              if (entry.isDir && this.dirAllowed) {
                const newPath = path.join(this.currentDirectory, entry.name)
                const hidden = this.showHidden
                return [
                  { ...this, currentDirectory: newPath, cursor: 0, entries: [] },
                  async (): Promise<Msg> => {
                    const entries = await readDir(newPath, hidden)
                    return { type: "entries-loaded", entries } as any
                  },
                ]
              }
              if (!entry.isDir && this.fileAllowed) {
                const filePath = path.join(this.currentDirectory, entry.name)
                if (this.allowedTypes.length > 0) {
                  const ext = entry.name.split(".").pop() ?? ""
                  if (!this.allowedTypes.includes(`.${ext}`)) {
                    return [{ ...this, err: `files of type .${ext} are not allowed` }, null]
                  }
                }
                this.accessor.Set(filePath)
                return [{ ...this, value: filePath, picking: false }, null]
              }
            }
            return [this, null]
          }
          case "h":
          case "backspace":
          case "left": {
            const parent = path.dirname(this.currentDirectory) || "/"
            const hidden = this.showHidden
            return [
              { ...this, currentDirectory: parent, cursor: 0, entries: [] },
              async (): Promise<Msg> => {
                const entries = await readDir(parent, hidden)
                return { type: "entries-loaded", entries } as any
              },
            ]
          }
          case "esc":
            return [{ ...this, picking: false }, null]
          default:
            return [this, null]
        }
      }

      switch (key.name) {
        case "enter":
        case "l":
        case "right": {
          const dir = this.currentDirectory
          const hidden = this.showHidden
          return [
            { ...this, picking: true, cursor: 0, entries: [] },
            async (): Promise<Msg> => {
              const entries = await readDir(dir, hidden)
              return { type: "entries-loaded", entries } as any
            },
          ]
        }
        case "esc":
          return [this, null]
        default:
          return [this, null]
      }
    },

    view(): string {
      const styles = activeStyles(this.theme, this.focused, this.hasDarkBg)
      const parts: string[] = []

      if (this.title) {
        parts.push(styles.Title.render(this.title + ": "))
      }
      if (this.description) {
        parts.push(styles.Description.render(` ${this.description}`))
      }

      if (this.picking) {
        parts.push(new Style().dim(true).render(`  ${this.currentDirectory}`))
        for (let i = 0; i < this.entries.length; i++) {
          const entry = this.entries[i]!
          const isSelected = i === this.cursor
          const prefix = isSelected ? "\u25B8 " : "  "
          const nameStyle = entry.isDir
            ? styles.Directory.render(entry.name + "/")
            : styles.File.render(entry.name)
          parts.push(prefix + nameStyle)
        }
      } else if (this.value) {
        parts.push(styles.SelectedOption.render(`  ${this.value}`))
      } else {
        parts.push(styles.TextInput.Placeholder.render("  No file selected."))
      }

      if (this.err) {
        parts.push(styles.ErrorMessage.render(` ${this.err}`))
      }

      return parts.join("\n")
    },

    Focus(): Cmd {
      this.focused = true
      return null
    },

    Blur(): Cmd {
      this.focused = false
      this.picking = false
      if (this.validate) {
        const result = this.validate(this.value)
        this.err = result === true ? null : String(result)
      }
      return null
    },

    Error(): string | null {
      return this.err
    },

    Skip(): boolean {
      return false
    },

    Zoom(): boolean {
      return this.picking
    },

    GetKey(): string {
      return this.key
    },

    GetValue(): any {
      return this.accessor.Get()
    },

    WithTheme(theme: Theme): Field {
      const f = { ...this } as any
      f.theme = theme
      return f
    },

    WithKeyMap(keymap: KeyMap): Field {
      const f = { ...this } as any
      f.keymap = keymap
      return f
    },

    WithWidth(width: number): Field {
      const f = { ...this } as any
      f.width = width
      return f
    },

    WithHeight(height: number): Field {
      const f = { ...this } as any
      f.height = height
      return f
    },

    WithPosition(pos: FieldPosition): Field {
      const f = { ...this } as any
      f.position = pos
      return f
    },

    KeyBindings(): KeyBinding[] {
      return [
        { key: "enter", help: "open/select", action: () => {} },
        { key: "esc", help: "close", action: () => {} },
        { key: "\u2191/\u2193", help: "navigate", action: () => {} },
        { key: "tab", help: "next", action: () => {} },
      ]
    },
  }
}
