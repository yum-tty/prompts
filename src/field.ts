import type { Msg, Cmd } from "@yum-tty/cinnamon-bun"
import type { Theme } from "./theme"
import type { KeyMap } from "./keymap"

export interface FieldPosition {
  Group: number
  Field: number
  FirstField: number
  LastField: number
  GroupCount: number
  FirstGroup: number
  LastGroup: number
}

export interface Field {
  init(): [Field, Cmd]
  update(msg: Msg): [Field, Cmd]
  view(): string
  Focus(): Cmd
  Blur(): Cmd
  Error(): string | null
  Skip(): boolean
  Zoom(): boolean
  GetKey(): string
  GetValue(): any
  WithTheme(theme: Theme): Field
  WithKeyMap(keymap: KeyMap): Field
  WithWidth(width: number): Field
  WithHeight(height: number): Field
  WithPosition(pos: FieldPosition): Field
  KeyBindings(): KeyBinding[]
}

export interface KeyBinding {
  key: string
  help: string
  action: () => void
}

export type ValidateFunc = (value: any) => boolean | string
