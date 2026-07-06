import type { Model, Msg, Cmd } from "cinnamon-bun"
import { RequestWindowSize } from "cinnamon-bun"
import { Style } from "caramel"
import type { GroupModel } from "./group"
import type { Field, FieldPosition, KeyBinding } from "./field"
import type { Theme, Styles } from "./theme"
import { ThemeCharm, getThemeStyles } from "./theme"
import type { KeyMap } from "./keymap"
import { NewDefaultKeyMap } from "./keymap"
import type { Layout } from "./layout"
import { DefaultLayout } from "./layout"

export const defaultWidth = 80

export const ErrUserAborted = new Error("user aborted")
export const ErrTimeout = new Error("timeout")
export const ErrTimeoutUnsupported = new Error("timeout is not supported in accessible mode")

export type FormState = "normal" | "completed" | "aborted"

export type FormLayoutType = "default" | "stack" | "columns" | "grid"

export enum FormLayout {
  Stack = "stack",
  Columns = "columns",
  Grid = "grid",
}

export interface FormModel {
  groups: GroupModel[]
  currentGroup: number
  currentField: number
  state: FormState
  title: string
  width: number
  height: number
  results: Record<string, any>
  showHelp: boolean
  showErrors: boolean
  layoutType: FormLayoutType
  layoutColumns: number
  layoutRows: number
  layout: Layout
  theme: Theme | null
  hasDarkBg: boolean
  keymap: KeyMap
  fieldIndex: number
  accessible: boolean
  timeout: number
  programOptions: any[]
  viewHook: ((view: any) => any) | null
  init(): [FormModel, Cmd]
  update(msg: Msg): [FormModel, Cmd]
  view(): string
  Errors(): string[]
  Help(): string
  GetFocusedField(): Field | null
  KeyBinds(): KeyBinding[]
  NextGroup(): [FormModel, Cmd]
  PrevGroup(): [FormModel, Cmd]
  NextField(): [FormModel, Cmd]
  PrevField(): [FormModel, Cmd]
  WithLayout(layout: Layout): FormModel
  WithTheme(theme: Theme | null): FormModel
  WithWidth(w: number): FormModel
  WithHeight(h: number): FormModel
  WithKeyMap(keymap: KeyMap): FormModel
  WithShowHelp(v: boolean): FormModel
  WithShowErrors(v: boolean): FormModel
  WithAccessible(v: boolean): FormModel
  WithTimeout(ms: number): FormModel
  WithProgramOptions(opts: any[]): FormModel
  WithViewHook(hook: ((view: any) => any) | null): FormModel
}

function isGroupHidden(group: GroupModel): boolean {
  if (group.hideFunc) return group.hideFunc()
  if (group.hide !== null) return group.hide
  return false
}

function getFirstVisibleGroup(groups: GroupModel[]): number {
  for (let i = 0; i < groups.length; i++) {
    if (!isGroupHidden(groups[i]!)) return i
  }
  return 0
}

function getLastVisibleGroup(groups: GroupModel[]): number {
  for (let i = groups.length - 1; i >= 0; i--) {
    if (!isGroupHidden(groups[i]!)) return i
  }
  return groups.length - 1
}

function getFirstNonSkippableField(group: GroupModel): number {
  if (group.fields.length <= 1) return 0
  for (let i = 0; i < group.fields.length; i++) {
    if (!group.fields[i]!.Skip()) return i
  }
  return 0
}

function getLastNonSkippableField(group: GroupModel): number {
  if (group.fields.length <= 1) return 0
  for (let i = group.fields.length - 1; i >= 0; i--) {
    if (!group.fields[i]!.Skip()) return i
  }
  return group.fields.length - 1
}

function updateFieldPositions(form: FormModel) {
  const firstGroup = getFirstVisibleGroup(form.groups)
  const lastGroup = getLastVisibleGroup(form.groups)

  for (let g = 0; g < form.groups.length; g++) {
    const group = form.groups[g]!
    const firstField = getFirstNonSkippableField(group)
    const lastField = getLastNonSkippableField(group)

    for (let i = 0; i < group.fields.length; i++) {
      const pos: FieldPosition = {
        Group: g,
        Field: i,
        FirstField: firstField,
        LastField: lastField,
        GroupCount: form.groups.length,
        FirstGroup: firstGroup,
        LastGroup: lastGroup,
      }
      group.fields[i] = group.fields[i]!.WithPosition(pos) as Field
    }
  }
}

function getVisibleGroups(groups: GroupModel[]): number[] {
  const visible: number[] = []
  for (let i = 0; i < groups.length; i++) {
    if (!isGroupHidden(groups[i]!)) {
      visible.push(i)
    }
  }
  return visible
}

/**
 * Creates a new form model with the given groups and configuration.
 * @param groups - Array of group models containing form fields
 * @param config - Optional configuration for the form (title, dimensions, theme, etc.)
 * @returns A FormModel that can be used with the run function
 */
export function Form(groups: GroupModel[], config: {
  title?: string
  width?: number
  height?: number
  showHelp?: boolean
  showErrors?: boolean
  layout?: FormLayoutType | Layout
  layoutColumns?: number
  layoutRows?: number
  theme?: Theme
  keymap?: KeyMap
  accessible?: boolean
} = {}): FormModel {
  let layoutType: FormLayoutType = "default"
  let layoutObj: Layout = DefaultLayout
  if (typeof config.layout === "string") {
    layoutType = config.layout
  } else if (config.layout) {
    layoutObj = config.layout
  }

  const form: FormModel = {
    groups,
    currentGroup: 0,
    currentField: 0,
    state: "normal",
    title: config.title ?? "",
    width: config.width ?? 80,
    height: config.height ?? 24,
    results: {},
    showHelp: config.showHelp ?? false,
    showErrors: config.showErrors ?? true,
    layoutType,
    layoutColumns: config.layoutColumns ?? 1,
    layoutRows: config.layoutRows ?? 1,
    layout: layoutObj,
    theme: config.theme ?? null,
    hasDarkBg: false,
    keymap: config.keymap ?? NewDefaultKeyMap(),
    fieldIndex: 0,
    accessible: config.accessible ?? false,
    timeout: 0,
    programOptions: [],
    viewHook: null,

    init(): [FormModel, Cmd] {
      updateFieldPositions(this)
      for (const group of this.groups) {
        group.showHelp = this.showHelp
        group.showErrors = this.showErrors
        if (this.theme) {
          group.theme = this.theme
          group.hasDarkBg = this.hasDarkBg
          for (let i = 0; i < group.fields.length; i++) {
            group.fields[i] = group.fields[i]!.WithTheme(this.theme).WithWidth(this.width) as any
          }
        }
      }
      const group = this.groups[this.currentGroup]
      if (group) {
        group.active = true
        const field = group.fields[this.currentField]
        if (field && !field.Skip()) {
          field.Focus()
        } else if (field && field.Skip()) {
          const [nextForm, cmd] = advanceField(this)
          Object.assign(this, nextForm)
          return [this, cmd]
        }
      }
      return [this, () => RequestWindowSize()]
    },

    update(msg: Msg): [FormModel, Cmd] {
      if (this.state !== "normal") return [this, null]

      if (msg && "type" in msg) {
        const key = msg as any

        if (key.type === "windowSize") {
          this.width = key.width ?? this.width
          this.height = key.height ?? this.height
          for (const group of this.groups) {
            for (let i = 0; i < group.fields.length; i++) {
              group.fields[i] = group.fields[i]!.WithWidth(this.width) as any
            }
          }
          return [this, null]
        }

        if (key.type === "key") {
          if (key.name === "escape" || (key.name === "c" && key.ctrl)) {
            this.state = "aborted"
            return [this, null]
          }

          if (key.name === "shift+tab" || (key.name === "tab" && key.shift)) {
            return this.PrevField()
          }

          if (key.name === "tab" || key.name === "enter") {
            const group = this.groups[this.currentGroup]
            if (!group) return [this, null]
            const field = group.fields[this.currentField]
            if (!field) return [this, null]

            const error = field.Error()
            if (error) return [this, null]

            return advanceField(this)
          }

          updateFieldPositions(this)
        }
      }

      const group = this.groups[this.currentGroup]
      if (!group) return [this, null]

      const field = group.fields[this.currentField]
      if (!field) return [this, null]

      const [newField, cmd] = field.update(msg)
      group.fields[this.currentField] = newField as Field

      return [this, cmd]
    },

    view(): string {
      const lines: string[] = []
      const styles = getThemeStyles(this.theme, this.hasDarkBg)

      if (this.title) {
        lines.push(styles.Focused.Title.render(this.title))
        lines.push("")
      }

      lines.push(this.layout.View(this))

      if (this.showErrors) {
        const group = this.groups[this.currentGroup]
        if (group) {
          for (const field of group.fields) {
            const error = field.Error()
            if (error) {
              lines.push("")
              lines.push(styles.Focused.ErrorMessage.render(error))
            }
          }
        }
      }

      if (this.showHelp) {
        lines.push("")
        lines.push(new Style().dim(true).render(this.Help()))
      }

      return lines.join("\n")
    },

    Errors(): string[] {
      const group = this.groups[this.currentGroup]
      if (!group) return []
      return group.fields.map(f => f.Error()).filter((e): e is string => e !== null)
    },

    Help(): string {
      const group = this.groups[this.currentGroup]
      if (!group) return ""
      const field = group.fields[this.currentField]
      if (!field) return ""
      return field.KeyBindings().map(b => `${b.key}: ${b.help}`).join(" \u00B7 ")
    },

    GetFocusedField(): Field | null {
      const group = this.groups[this.currentGroup]
      if (!group) return null
      return group.fields[this.currentField] ?? null
    },

    KeyBinds(): KeyBinding[] {
      const group = this.groups[this.currentGroup]
      if (!group) return []
      const field = group.fields[this.currentField]
      if (!field) return []
      return field.KeyBindings()
    },

    NextGroup(): [FormModel, Cmd] {
      if (this.state !== "normal") return [this, null]
      const group = this.groups[this.currentGroup]
      if (!group) return [this, null]
      const field = group.fields[this.currentField]
      if (field) {
        const error = field.Error()
        if (error) return [this, null]
        field.Blur()
        this.results[field.GetKey()] = field.GetValue()
      }
      if (this.currentGroup < this.groups.length - 1) {
        let nextGroup = this.currentGroup + 1
        while (nextGroup < this.groups.length && isGroupHidden(this.groups[nextGroup]!)) {
          nextGroup++
        }
        if (nextGroup < this.groups.length) {
          const newGroup = this.groups[nextGroup]!
          newGroup.active = true
          let f = 0
          while (f < newGroup.fields.length && newGroup.fields[f]!.Skip() && newGroup.fields.length > 1) {
            f++
          }
          if (f >= newGroup.fields.length) return advanceField(this)
          const next = newGroup.fields[f]!
          next.Focus()
          this.currentGroup = nextGroup
          this.currentField = f
          return [this, null]
        }
      }
      return advanceField(this)
    },

    PrevGroup(): [FormModel, Cmd] {
      if (this.state !== "normal") return [this, null]
      const group = this.groups[this.currentGroup]
      if (!group) return [this, null]
      const field = group.fields[this.currentField]
      if (field) {
        const error = field.Error()
        if (error) return [this, null]
        field.Blur()
        this.results[field.GetKey()] = field.GetValue()
      }
      if (this.currentGroup > 0) {
        let prevGroup = this.currentGroup - 1
        while (prevGroup >= 0 && isGroupHidden(this.groups[prevGroup]!)) {
          prevGroup--
        }
        if (prevGroup >= 0) {
          const newGroup = this.groups[prevGroup]!
          newGroup.active = true
          let f = 0
          while (f < newGroup.fields.length && newGroup.fields[f]!.Skip() && newGroup.fields.length > 1) {
            f++
          }
          if (f >= newGroup.fields.length) return [this, null]
          const next = newGroup.fields[f]!
          next.Focus()
          this.currentGroup = prevGroup
          this.currentField = f
          return [this, null]
        }
      }
      return [this, null]
    },

    NextField(): [FormModel, Cmd] {
      if (this.state !== "normal") return [this, null]
      return advanceField(this)
    },

    PrevField(): [FormModel, Cmd] {
      if (this.state !== "normal") return [this, null]
      const group = this.groups[this.currentGroup]
      if (!group) return [this, null]

      const field = group.fields[this.currentField]
      if (field) {
        field.Blur()
      }

      if (this.currentField > 0) {
        let prevField = this.currentField - 1
        while (prevField >= 0 && group.fields[prevField]!.Skip() && group.fields.length > 1) {
          prevField--
        }
        if (prevField >= 0) {
          const prev = group.fields[prevField]!
          prev.Focus()
          this.currentField = prevField
          return [this, null]
        }
      }

      if (this.currentGroup > 0) {
        let prevGroup = this.currentGroup - 1
        while (prevGroup >= 0 && isGroupHidden(this.groups[prevGroup]!)) {
          prevGroup--
        }
        if (prevGroup >= 0) {
          const newGroup = this.groups[prevGroup]!
          newGroup.active = true
          let f = newGroup.fields.length - 1
          while (f > 0 && newGroup.fields[f]!.Skip() && newGroup.fields.length > 1) {
            f--
          }
          const prev = newGroup.fields[f]!
          prev.Focus()
          this.currentGroup = prevGroup
          this.currentField = f
          return [this, null]
        }
      }

      return [this, null]
    },

    WithLayout(layout: Layout): FormModel {
      return { ...this, layout }
    },

    WithTheme(theme: Theme | null): FormModel {
      if (!theme) return this
      const updated = { ...this, theme }
      for (const group of updated.groups) {
        group.theme = theme
        group.hasDarkBg = updated.hasDarkBg
        for (let i = 0; i < group.fields.length; i++) {
          group.fields[i] = group.fields[i]!.WithTheme(theme).WithWidth(updated.width) as any
        }
      }
      return updated
    },

    WithWidth(w: number): FormModel {
      if (w <= 0) return this
      const updated = { ...this, width: w }
      for (const group of updated.groups) {
        const groupWidth = updated.layout.GroupWidth(updated, group, w)
        group.width = groupWidth
        for (let i = 0; i < group.fields.length; i++) {
          group.fields[i] = group.fields[i]!.WithWidth(groupWidth) as any
        }
      }
      return updated
    },

    WithHeight(h: number): FormModel {
      if (h <= 0) return this
      const updated = { ...this, height: h }
      for (const group of updated.groups) {
        group.height = h
      }
      return updated
    },

    WithKeyMap(keymap: KeyMap): FormModel {
      if (!keymap) return this
      const updated = { ...this, keymap }
      for (const group of updated.groups) {
        group.showHelp = updated.showHelp
        group.showErrors = updated.showErrors
      }
      return updated
    },

    WithShowHelp(v: boolean): FormModel {
      const updated = { ...this, showHelp: v }
      for (const group of updated.groups) {
        group.showHelp = v
      }
      return updated
    },

    WithShowErrors(v: boolean): FormModel {
      const updated = { ...this, showErrors: v }
      for (const group of updated.groups) {
        group.showErrors = v
      }
      return updated
    },

    WithAccessible(v: boolean): FormModel {
      return { ...this, accessible: v }
    },

    WithTimeout(ms: number): FormModel {
      return { ...this, timeout: ms }
    },

    WithProgramOptions(opts: any[]): FormModel {
      return { ...this, programOptions: opts }
    },

    WithViewHook(hook: ((view: any) => any) | null): FormModel {
      return { ...this, viewHook: hook }
    },
  }

  return form
}

function advanceField(form: FormModel): [FormModel, Cmd] {
  if (form.groups.length === 0) return [form, null]
  const group = form.groups[form.currentGroup]!
  const field = group.fields[form.currentField]
  if (field) {
    field.Blur()
    form.results[field.GetKey()] = field.GetValue()
  }

  if (form.currentField < group.fields.length - 1) {
    let nextField = form.currentField + 1
    while (nextField < group.fields.length && group.fields[nextField]!.Skip() && group.fields.length > 1) {
      nextField++
    }
    if (nextField < group.fields.length) {
      const next = group.fields[nextField]!
      next.Focus()
      form.currentField = nextField
      return [form, null]
    }
  }

  if (form.currentGroup < form.groups.length - 1) {
    let nextGroup = form.currentGroup + 1
    while (nextGroup < form.groups.length && isGroupHidden(form.groups[nextGroup]!)) {
      nextGroup++
    }
    if (nextGroup < form.groups.length) {
      const newGroup = form.groups[nextGroup]!
      newGroup.active = true
      let f = 0
      while (f < newGroup.fields.length && newGroup.fields[f]!.Skip() && newGroup.fields.length > 1) {
        f++
      }
      if (f >= newGroup.fields.length) {
        form.state = "completed"
        return [form, null]
      }
      const next = newGroup.fields[f]!
      next.Focus()
      form.currentGroup = nextGroup
      form.currentField = f
      return [form, null]
    }
  }

  for (const g of form.groups) {
    for (const f of g.fields) {
      const key = f.GetKey()
      if (key) {
        form.results[key] = f.GetValue()
      }
    }
  }
  form.state = "completed"
  return [form, null]
}

/**
 * Retrieves a value from the form results by key.
 * @param form - The completed form model
 * @param key - The field key to look up
 * @returns The value associated with the key, or undefined if not found
 */
export function Get(form: FormModel, key: string): any {
  return form.results[key]
}

/**
 * Retrieves a string value from the form results by key.
 * @param form - The completed form model
 * @param key - The field key to look up
 * @returns The string value, or empty string if not found or not a string
 */
export function GetString(form: FormModel, key: string): string {
  const v = form.results[key]
  return typeof v === "string" ? v : ""
}

/**
 * Retrieves a number value from the form results by key.
 * @param form - The completed form model
 * @param key - The field key to look up
 * @returns The number value, or 0 if not found or not a number
 */
export function GetInt(form: FormModel, key: string): number {
  const v = form.results[key]
  return typeof v === "number" ? v : 0
}

/**
 * Retrieves a boolean value from the form results by key.
 * @param form - The completed form model
 * @param key - The field key to look up
 * @returns The boolean value, or false if not found or not a boolean
 */
export function GetBool(form: FormModel, key: string): boolean {
  const v = form.results[key]
  return typeof v === "boolean" ? v : false
}

async function runAccessible(form: FormModel): Promise<Record<string, any>> {
  const readline = await import("readline")
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const results: Record<string, any> = {}

  const ask = (question: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(question, (answer) => resolve(answer))
    })
  }

  for (const group of form.groups) {
    if (group.title) {
      process.stdout.write(`\n${group.title}\n`)
    }
    for (const field of group.fields) {
      if (field.Skip()) continue
      const key = field.GetKey()
      const val = field.GetValue()
      const resp = await ask(`${field.GetKey()}: `)
      if (resp === "" && val !== undefined) {
        results[key] = val
      } else {
        results[key] = resp
      }
    }
  }

  rl.close()
  return results
}

export interface RunOptions {
  timeout?: number
}

/**
 * Runs the form interactively and returns the collected results.
 * @param form - The form model to run
 * @param options - Optional run options (timeout, etc.)
 * @returns A promise that resolves with the form results when completed
 * @throws {Error} ErrUserAborted if the user presses Escape/Ctrl+C
 * @throws {Error} ErrTimeout if the timeout option is set and exceeded
 */
export async function run(form: FormModel, options?: RunOptions): Promise<Record<string, any>> {
  if (form.accessible) {
    return runAccessible(form)
  }

  const { NewProgram } = await import("cinnamon-bun")

  return new Promise((resolve, reject) => {
    let resolved = false
    let timerId: ReturnType<typeof setTimeout> | null = null

    const program = NewProgram({
      model: form as any,
      altScreen: true,
    })

    const originalUpdate = form.update.bind(form)
    form.update = (msg: Msg) => {
      const [newModel, cmd] = originalUpdate(msg)
      const newForm = newModel as FormModel

      if (newForm.state === "completed" && !resolved) {
        resolved = true
        if (timerId !== null) clearTimeout(timerId)
        program.stop()
        resolve(newForm.results)
      } else if (newForm.state === "aborted" && !resolved) {
        resolved = true
        if (timerId !== null) clearTimeout(timerId)
        program.stop()
        reject(ErrUserAborted)
      }

      return [newModel, cmd]
    }

    if (options?.timeout) {
      timerId = setTimeout(() => {
        if (!resolved) {
          resolved = true
          program.stop()
          reject(ErrTimeout)
        }
      }, options.timeout)
    }

    program.run().catch((err: any) => {
      if (!resolved) {
        resolved = true
        if (timerId !== null) clearTimeout(timerId)
        reject(err)
      }
    })
  })
}

/**
 * Runs a single field interactively and returns its value.
 * @param field - The field to run
 * @returns A promise that resolves with the field's value when the user presses Escape or 'q'
 */
export async function runField(field: Field): Promise<any> {
  const { NewProgram, CreateView, Quit } = await import("cinnamon-bun")

  return new Promise((resolve) => {
    let resolved = false

    const fieldModel = {
      field,
      init() {
        return [this, null] as [any, any]
      },
      update(msg: Msg) {
        if (!msg) return [this, null] as [any, any]
        if (msg.type === "key") {
          const key = msg as any
          if (key.name === "escape" || key.name === "q") {
            resolved = true
            return [this, Quit()] as [any, any]
          }
        }
        const [newField, cmd] = field.update(msg)
        field = newField
        return [this, cmd] as [any, any]
      },
      view() {
        return CreateView(field.view())
      },
    }

    const program = NewProgram({
      model: fieldModel,
      altScreen: true,
    })

    program.run().then(() => {
      if (!resolved) {
        resolved = true
        resolve(field.GetValue())
      }
    })
  })
}
