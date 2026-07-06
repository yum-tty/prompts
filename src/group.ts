import type { Field } from "./field"
import type { Theme } from "./theme"
import { getThemeStyles } from "./theme"
import { Style } from "caramel"

export interface GroupModel {
  fields: Field[]
  title: string
  description: string
  hide: boolean | null
  hideFunc: (() => boolean) | null
  theme: Theme | null
  hasDarkBg: boolean
  showHelp: boolean
  showErrors: boolean
  width: number
  height: number
  active: boolean
  Header(): string
  Content(): string
  Footer(): string
}

export function Group(config: {
  title?: string
  description?: string
  fields: Field[]
  hide?: boolean
  hideFunc?: () => boolean
}): GroupModel {
  const group: GroupModel = {
    title: config.title ?? "",
    description: config.description ?? "",
    fields: config.fields,
    hide: config.hide ?? null,
    hideFunc: config.hideFunc ?? null,
    theme: null,
    hasDarkBg: false,
    showHelp: true,
    showErrors: true,
    width: 80,
    height: 24,
    active: false,

    Header(): string {
      const styles = getThemeStyles(this.theme, this.hasDarkBg)
      const parts: string[] = []
      if (this.title) {
        parts.push(styles.Group.Title.render(this.title))
      }
      if (this.description) {
        parts.push(styles.Group.Description.render(this.description))
      }
      return parts.join("\n")
    },

    Content(): string {
      return this.fields.map(f => f.view()).join("\n")
    },

    Footer(): string {
      const styles = getThemeStyles(this.theme, this.hasDarkBg)
      const parts: string[] = []
      const errors: string[] = []
      for (const field of this.fields) {
        const err = field.Error()
        if (err) errors.push(err)
      }
      if (this.showHelp && errors.length === 0) {
        const focused = this.fields.find(f => !f.Skip())
        if (focused) {
          const bindings = focused.KeyBindings()
          if (bindings.length > 0) {
            parts.push(new Style().dim(true).render(bindings.map(b => `${b.key}: ${b.help}`).join(" \u00B7 ")))
          }
        }
      }
      if (this.showErrors) {
        for (const err of errors) {
          parts.push(styles.Focused.ErrorMessage.render(err))
        }
      }
      return styles.Group.Base.render(parts.join("\n"))
    },
  }

  return group
}
