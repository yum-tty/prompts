// keymap.ts | key bindings (huh port)

/**
 * KeyBinding represents a key binding.
 */
export interface KeyBinding {
  key: string
  help: string
  keys: string[]
  enabled: boolean
}

/**
 * Creates a new key binding.
 */
function binding(keys: string[], help: string, enabled = true): KeyBinding {
  return { key: keys[0] ?? "", help, keys, enabled }
}

/**
 * InputKeyMap is the keybindings for input fields.
 */
export interface InputKeyMap {
  AcceptSuggestion: KeyBinding
  Next: KeyBinding
  Prev: KeyBinding
  Submit: KeyBinding
}

/**
 * TextKeyMap is the keybindings for text fields.
 */
export interface TextKeyMap {
  Next: KeyBinding
  Prev: KeyBinding
  NewLine: KeyBinding
  Editor: KeyBinding
  Submit: KeyBinding
}

/**
 * SelectKeyMap is the keybindings for select fields.
 */
export interface SelectKeyMap {
  Next: KeyBinding
  Prev: KeyBinding
  Up: KeyBinding
  Down: KeyBinding
  HalfPageUp: KeyBinding
  HalfPageDown: KeyBinding
  GotoTop: KeyBinding
  GotoBottom: KeyBinding
  Left: KeyBinding
  Right: KeyBinding
  Filter: KeyBinding
  SetFilter: KeyBinding
  ClearFilter: KeyBinding
  Submit: KeyBinding
}

/**
 * MultiSelectKeyMap is the keybindings for multi-select fields.
 */
export interface MultiSelectKeyMap {
  Next: KeyBinding
  Prev: KeyBinding
  Up: KeyBinding
  Down: KeyBinding
  HalfPageUp: KeyBinding
  HalfPageDown: KeyBinding
  GotoTop: KeyBinding
  GotoBottom: KeyBinding
  Toggle: KeyBinding
  Filter: KeyBinding
  SetFilter: KeyBinding
  ClearFilter: KeyBinding
  Submit: KeyBinding
  SelectAll: KeyBinding
  SelectNone: KeyBinding
}

/**
 * FilePickerKeyMap is the keybindings for filepicker fields.
 */
export interface FilePickerKeyMap {
  Open: KeyBinding
  Close: KeyBinding
  GotoTop: KeyBinding
  GotoBottom: KeyBinding
  PageUp: KeyBinding
  PageDown: KeyBinding
  Back: KeyBinding
  Select: KeyBinding
  Up: KeyBinding
  Down: KeyBinding
  Prev: KeyBinding
  Next: KeyBinding
  Submit: KeyBinding
}

/**
 * NoteKeyMap is the keybindings for note fields.
 */
export interface NoteKeyMap {
  Next: KeyBinding
  Prev: KeyBinding
  Submit: KeyBinding
}

/**
 * ConfirmKeyMap is the keybindings for confirm fields.
 */
export interface ConfirmKeyMap {
  Next: KeyBinding
  Prev: KeyBinding
  Toggle: KeyBinding
  Submit: KeyBinding
  Accept: KeyBinding
  Reject: KeyBinding
}

/**
 * KeyMap is the keybindings to navigate the form.
 */
export interface KeyMap {
  Quit: KeyBinding
  Confirm: ConfirmKeyMap
  FilePicker: FilePickerKeyMap
  Input: InputKeyMap
  MultiSelect: MultiSelectKeyMap
  Note: NoteKeyMap
  Select: SelectKeyMap
  Text: TextKeyMap
}

/**
 * NewDefaultKeyMap returns a new default keymap.
 */
export function NewDefaultKeyMap(): KeyMap {
  return {
    Quit: binding(["ctrl+c"], "quit"),
    Input: {
      AcceptSuggestion: binding(["ctrl+e"], "complete"),
      Prev: binding(["shift+tab"], "back"),
      Next: binding(["enter", "tab"], "next"),
      Submit: binding(["enter"], "submit"),
    },
    FilePicker: {
      GotoTop: binding(["g"], "first", false),
      GotoBottom: binding(["G"], "last", false),
      PageUp: binding(["K", "pgup"], "page up", false),
      PageDown: binding(["J", "pgdown"], "page down", false),
      Back: binding(["h", "backspace", "left", "esc"], "back", false),
      Select: binding(["enter"], "select", false),
      Up: binding(["up", "k", "ctrl+k", "ctrl+p"], "up", false),
      Down: binding(["down", "j", "ctrl+j", "ctrl+n"], "down", false),
      Open: binding(["l", "right", "enter"], "open"),
      Close: binding(["esc"], "close", false),
      Prev: binding(["shift+tab"], "back"),
      Next: binding(["tab"], "next"),
      Submit: binding(["enter"], "submit"),
    },
    Text: {
      Prev: binding(["shift+tab"], "back"),
      Next: binding(["tab", "enter"], "next"),
      Submit: binding(["enter"], "submit"),
      NewLine: binding(["alt+enter", "ctrl+j"], "new line"),
      Editor: binding(["ctrl+e"], "open editor"),
    },
    Select: {
      Prev: binding(["shift+tab"], "back"),
      Next: binding(["enter", "tab"], "select"),
      Submit: binding(["enter"], "submit"),
      Up: binding(["up", "k", "ctrl+k", "ctrl+p"], "up"),
      Down: binding(["down", "j", "ctrl+j", "ctrl+n"], "down"),
      Left: binding(["h", "left"], "left", false),
      Right: binding(["l", "right"], "right", false),
      Filter: binding(["/"], "filter"),
      SetFilter: binding(["esc"], "set filter", false),
      ClearFilter: binding(["esc"], "clear filter", false),
      HalfPageUp: binding(["ctrl+u"], "half page up"),
      HalfPageDown: binding(["ctrl+d"], "half page down"),
      GotoTop: binding(["home", "g"], "go to start"),
      GotoBottom: binding(["end", "G"], "go to end"),
    },
    MultiSelect: {
      Prev: binding(["shift+tab"], "back"),
      Next: binding(["enter", "tab"], "confirm"),
      Submit: binding(["enter"], "submit"),
      Toggle: binding(["space", "x"], "toggle"),
      Up: binding(["up", "k", "ctrl+p"], "up"),
      Down: binding(["down", "j", "ctrl+n"], "down"),
      Filter: binding(["/"], "filter"),
      SetFilter: binding(["enter", "esc"], "set filter", false),
      ClearFilter: binding(["esc"], "clear filter", false),
      HalfPageUp: binding(["ctrl+u"], "half page up"),
      HalfPageDown: binding(["ctrl+d"], "half page down"),
      GotoTop: binding(["home", "g"], "go to start"),
      GotoBottom: binding(["end", "G"], "go to end"),
      SelectAll: binding(["ctrl+a"], "select all"),
      SelectNone: binding(["ctrl+a"], "select none", false),
    },
    Note: {
      Prev: binding(["shift+tab"], "back"),
      Next: binding(["enter", "tab"], "next"),
      Submit: binding(["enter"], "submit"),
    },
    Confirm: {
      Prev: binding(["shift+tab"], "back"),
      Next: binding(["enter", "tab"], "next"),
      Submit: binding(["enter"], "submit"),
      Toggle: binding(["h", "l", "right", "left"], "toggle"),
      Accept: binding(["y", "Y"], "Yes"),
      Reject: binding(["n", "N"], "No"),
    },
  }
}
