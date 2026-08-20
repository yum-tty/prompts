import { Style, borders } from "@yum-tty/caramel"

export { Style }

export interface HelpStyles {
  Ellipsis: Style
  ShortKey: Style
  ShortDesc: Style
  ShortSeparator: Style
  FullKey: Style
  FullDesc: Style
  FullSeparator: Style
}

export interface Styles {
  Form: FormStyles
  Group: GroupStyles
  FieldSeparator: Style
  Blurred: FieldStyles
  Focused: FieldStyles
  Help: HelpStyles
}

export interface FormStyles {
  Base: Style
}

export interface GroupStyles {
  Base: Style
  Title: Style
  Description: Style
}

export interface FieldStyles {
  Base: Style
  Title: Style
  Description: Style
  ErrorIndicator: Style
  ErrorMessage: Style

  SelectSelector: Style
  Option: Style
  NextIndicator: Style
  PrevIndicator: Style

  Directory: Style
  File: Style

  MultiSelectSelector: Style
  SelectedOption: Style
  SelectedPrefix: Style
  UnselectedOption: Style
  UnselectedPrefix: Style

  TextInput: TextInputStyles

  FocusedButton: Style
  BlurredButton: Style

  Card: Style
  NoteTitle: Style
  Next: Style
}

export interface TextInputStyles {
  Cursor: Style
  CursorText: Style
  Placeholder: Style
  Prompt: Style
  Text: Style
}

export interface Theme {
  (isDark: boolean): Styles
}

export type ThemeFunc = (isDark: boolean) => Styles

export function ThemeBase(_isDark: boolean): Styles {
  const button = Style.newStyle()
    .padding(0, 2)
    .marginRight(1)

  const focusedBase = Style.newStyle()
    .paddingLeft(1)
    .border(borders.thick, false, false, false, true)

  const blurredBase = Style.newStyle()
    .border(borders.hidden, false, false, false, true)

  const focused: FieldStyles = {
    Base: focusedBase,
    Card: focusedBase,
    Title: Style.newStyle(),
    Description: Style.newStyle(),
    ErrorIndicator: Style.newStyle().setString(" *"),
    ErrorMessage: Style.newStyle().setString(" *"),
    SelectSelector: Style.newStyle(),
    Option: Style.newStyle(),
    NextIndicator: Style.newStyle().marginLeft(1).setString("\u2192"),
    PrevIndicator: Style.newStyle().marginRight(1).setString("\u2190"),
    Directory: Style.newStyle(),
    File: Style.newStyle(),
    MultiSelectSelector: Style.newStyle(),
    SelectedOption: Style.newStyle(),
    SelectedPrefix: Style.newStyle().setString("[\u2022] "),
    UnselectedOption: Style.newStyle(),
    UnselectedPrefix: Style.newStyle().setString("[ ] "),
    TextInput: {
      Cursor: Style.newStyle(),
      CursorText: Style.newStyle(),
      Placeholder: Style.newStyle(),
      Prompt: Style.newStyle(),
      Text: Style.newStyle(),
    },
    FocusedButton: button.foreground("15").background("4"),
    BlurredButton: button.foreground("8").background("0"),
    NoteTitle: Style.newStyle(),
    Next: Style.newStyle(),
  }

  const blurred: FieldStyles = {
    Base: blurredBase,
    Card: blurredBase,
    Title: Style.newStyle(),
    Description: Style.newStyle(),
    ErrorIndicator: Style.newStyle().setString(" *"),
    ErrorMessage: Style.newStyle().setString(" *"),
    SelectSelector: Style.newStyle(),
    Option: Style.newStyle(),
    NextIndicator: Style.newStyle(),
    PrevIndicator: Style.newStyle(),
    Directory: Style.newStyle(),
      File: Style.newStyle(),
      MultiSelectSelector: Style.newStyle(),
      SelectedOption: Style.newStyle(),
      SelectedPrefix: Style.newStyle().setString("[\u2022] "),
      UnselectedOption: Style.newStyle(),
      UnselectedPrefix: Style.newStyle().setString("[ ] "),
      TextInput: {
        Cursor: Style.newStyle(),
        CursorText: Style.newStyle(),
        Placeholder: Style.newStyle(),
        Prompt: Style.newStyle(),
        Text: Style.newStyle(),
      },
      FocusedButton: button.foreground("8").background("0"),
      BlurredButton: button.foreground("8").background("0"),
    NoteTitle: Style.newStyle(),
    Next: Style.newStyle(),
  }

  return {
    Form: { Base: Style.newStyle() },
    Group: { Base: Style.newStyle(), Title: Style.newStyle(), Description: Style.newStyle() },
    FieldSeparator: Style.newStyle().setString("\n\n"),
    Focused: focused,
    Blurred: blurred,
    Help: {
      Ellipsis: Style.newStyle(),
      ShortKey: Style.newStyle(),
      ShortDesc: Style.newStyle(),
      ShortSeparator: Style.newStyle(),
      FullKey: Style.newStyle(),
      FullDesc: Style.newStyle(),
      FullSeparator: Style.newStyle(),
    },
  }
}

function makeFocusedStyle(base: Style, fgColor: string): Style {
  return base.foreground(fgColor)
}

export function ThemeCharm(isDark: boolean): Styles {
  const t = ThemeBase(isDark)
  const indigo = isDark ? "#7571F9" : "#5A56E0"
  const fuchsia = "#F780E2"
  const green = isDark ? "#02BF87" : "#02BA84"
  const red = isDark ? "#ED567A" : "#FF4672"
  const normalFg = isDark ? "#235" : "#252"
  const cream = "#FFFDF5"
  const descColor = isDark ? "243" : ""
  const buttonBg = isDark ? "252" : "237"

  t.Focused.Base = t.Focused.Base.borderForeground("238")
  t.Focused.Card = t.Focused.Base
  t.Focused.Title = makeFocusedStyle(t.Focused.Title, indigo).bold(true)
  t.Focused.NoteTitle = makeFocusedStyle(t.Focused.NoteTitle, indigo).bold(true).marginBottom(1)
  t.Focused.Directory = makeFocusedStyle(t.Focused.Directory, indigo)
  t.Focused.Description = makeFocusedStyle(t.Focused.Description, descColor)
  t.Focused.ErrorIndicator = makeFocusedStyle(t.Focused.ErrorIndicator, red)
  t.Focused.ErrorMessage = makeFocusedStyle(t.Focused.ErrorMessage, red)
  t.Focused.SelectSelector = makeFocusedStyle(t.Focused.SelectSelector, fuchsia)
  t.Focused.NextIndicator = makeFocusedStyle(t.Focused.NextIndicator, fuchsia)
  t.Focused.PrevIndicator = makeFocusedStyle(t.Focused.PrevIndicator, fuchsia)
  t.Focused.Option = makeFocusedStyle(t.Focused.Option, normalFg)
  t.Focused.MultiSelectSelector = makeFocusedStyle(t.Focused.MultiSelectSelector, fuchsia)
  t.Focused.SelectedOption = makeFocusedStyle(t.Focused.SelectedOption, green)
  t.Focused.SelectedPrefix = Style.newStyle().foreground(isDark ? "#02A877" : "#02CF92").setString("\u2713 ")
  t.Focused.UnselectedPrefix = Style.newStyle().foreground(descColor).setString("\u2022 ")
  t.Focused.UnselectedOption = makeFocusedStyle(t.Focused.UnselectedOption, normalFg)
  t.Focused.FocusedButton = t.Focused.FocusedButton.foreground(cream).background(fuchsia)
  t.Focused.Next = t.Focused.FocusedButton
  t.Focused.BlurredButton = t.Focused.BlurredButton.foreground(normalFg).background(buttonBg)

  t.Focused.TextInput.Cursor = makeFocusedStyle(t.Focused.TextInput.Cursor, green)
  t.Focused.TextInput.Placeholder = makeFocusedStyle(t.Focused.TextInput.Placeholder, isDark ? "248" : "238")
  t.Focused.TextInput.Prompt = makeFocusedStyle(t.Focused.TextInput.Prompt, fuchsia)

  t.Blurred = { ...t.Focused }
  t.Blurred.Base = t.Focused.Base.borderStyle(borders.hidden)
  t.Blurred.Card = t.Blurred.Base
  t.Blurred.MultiSelectSelector = Style.newStyle().setString("  ")
  t.Blurred.NextIndicator = Style.newStyle()
  t.Blurred.PrevIndicator = Style.newStyle()

  t.Group.Title = t.Focused.Title
  t.Group.Description = t.Focused.Description

  return t
}

export function ThemeDracula(isDark: boolean): Styles {
  const t = ThemeBase(isDark)
  const purple = "#bd93f9"
  const green = "#50fa7b"
  const red = "#ff5555"
  const yellow = "#f1fa8c"
  const foreground = "#f8f8f2"
  const comment = "#6272a4"
  const selection = "#44475a"
  const background = "#282a36"

  t.Focused.Base = t.Focused.Base.borderForeground(selection)
  t.Focused.Card = t.Focused.Base
  t.Focused.Title = makeFocusedStyle(t.Focused.Title, purple).bold(true)
  t.Focused.NoteTitle = makeFocusedStyle(t.Focused.NoteTitle, purple).bold(true).marginBottom(1)
  t.Focused.Description = makeFocusedStyle(t.Focused.Description, comment)
  t.Focused.ErrorIndicator = makeFocusedStyle(t.Focused.ErrorIndicator, red)
  t.Focused.Directory = makeFocusedStyle(t.Focused.Directory, purple)
  t.Focused.File = makeFocusedStyle(t.Focused.File, foreground)
  t.Focused.ErrorMessage = makeFocusedStyle(t.Focused.ErrorMessage, red)
  t.Focused.SelectSelector = makeFocusedStyle(t.Focused.SelectSelector, yellow)
  t.Focused.NextIndicator = makeFocusedStyle(t.Focused.NextIndicator, yellow)
  t.Focused.PrevIndicator = makeFocusedStyle(t.Focused.PrevIndicator, yellow)
  t.Focused.Option = makeFocusedStyle(t.Focused.Option, foreground)
  t.Focused.MultiSelectSelector = makeFocusedStyle(t.Focused.MultiSelectSelector, yellow)
  t.Focused.SelectedOption = makeFocusedStyle(t.Focused.SelectedOption, green)
  t.Focused.SelectedPrefix = makeFocusedStyle(t.Focused.SelectedPrefix, green)
  t.Focused.UnselectedOption = makeFocusedStyle(t.Focused.UnselectedOption, foreground)
  t.Focused.UnselectedPrefix = makeFocusedStyle(t.Focused.UnselectedPrefix, comment)
  t.Focused.FocusedButton = t.Focused.FocusedButton.foreground(yellow).background(purple).bold(true)
  t.Focused.BlurredButton = t.Focused.BlurredButton.foreground(foreground).background(background)

  t.Focused.TextInput.Cursor = makeFocusedStyle(t.Focused.TextInput.Cursor, yellow)
  t.Focused.TextInput.Placeholder = makeFocusedStyle(t.Focused.TextInput.Placeholder, comment)
  t.Focused.TextInput.Prompt = makeFocusedStyle(t.Focused.TextInput.Prompt, yellow)

  t.Blurred = { ...t.Focused }
  t.Blurred.Base = t.Focused.Base.borderStyle(borders.hidden)
  t.Blurred.Card = t.Blurred.Base
  t.Blurred.NextIndicator = Style.newStyle()
  t.Blurred.PrevIndicator = Style.newStyle()

  t.Group.Title = t.Focused.Title
  t.Group.Description = t.Focused.Description
  return t
}

export function ThemeBase16(isDark: boolean): Styles {
  const t = ThemeBase(isDark)

  t.Focused.Base = t.Focused.Base.borderForeground("8")
  t.Focused.Card = t.Focused.Base
  t.Focused.Title = makeFocusedStyle(t.Focused.Title, "6")
  t.Focused.NoteTitle = makeFocusedStyle(t.Focused.NoteTitle, "6")
  t.Focused.Directory = makeFocusedStyle(t.Focused.Directory, "6")
  t.Focused.Description = makeFocusedStyle(t.Focused.Description, "8")
  t.Focused.ErrorIndicator = makeFocusedStyle(t.Focused.ErrorIndicator, "9")
  t.Focused.ErrorMessage = makeFocusedStyle(t.Focused.ErrorMessage, "9")
  t.Focused.SelectSelector = makeFocusedStyle(t.Focused.SelectSelector, "3")
  t.Focused.NextIndicator = makeFocusedStyle(t.Focused.NextIndicator, "3")
  t.Focused.PrevIndicator = makeFocusedStyle(t.Focused.PrevIndicator, "3")
  t.Focused.Option = makeFocusedStyle(t.Focused.Option, "7")
  t.Focused.MultiSelectSelector = makeFocusedStyle(t.Focused.MultiSelectSelector, "3")
  t.Focused.SelectedOption = makeFocusedStyle(t.Focused.SelectedOption, "2")
  t.Focused.SelectedPrefix = makeFocusedStyle(t.Focused.SelectedPrefix, "2")
  t.Focused.UnselectedOption = makeFocusedStyle(t.Focused.UnselectedOption, "7")
  t.Focused.FocusedButton = t.Focused.FocusedButton.foreground("7").background("5")
  t.Focused.BlurredButton = t.Focused.BlurredButton.foreground("7").background("0")

  t.Focused.TextInput.Cursor = makeFocusedStyle(t.Focused.TextInput.Cursor, "5")
  t.Focused.TextInput.Placeholder = makeFocusedStyle(t.Focused.TextInput.Placeholder, "8")
  t.Focused.TextInput.Prompt = makeFocusedStyle(t.Focused.TextInput.Prompt, "3")

  t.Blurred = { ...t.Focused }
  t.Blurred.Base = t.Focused.Base.borderStyle(borders.hidden)
  t.Blurred.Card = t.Blurred.Base
  t.Blurred.MultiSelectSelector = Style.newStyle().setString("  ")
  t.Blurred.NoteTitle = makeFocusedStyle(t.Blurred.NoteTitle, "8")
  t.Blurred.Title = makeFocusedStyle(t.Blurred.Title, "8")
  t.Blurred.TextInput.Prompt = makeFocusedStyle(t.Blurred.TextInput.Prompt, "8")
  t.Blurred.TextInput.Text = makeFocusedStyle(t.Blurred.TextInput.Text, "7")
  t.Blurred.NextIndicator = Style.newStyle()
  t.Blurred.PrevIndicator = Style.newStyle()

  t.Group.Title = t.Focused.Title
  t.Group.Description = t.Focused.Description

  return t
}

export function ThemeCatppuccin(isDark: boolean): Styles {
  const t = ThemeBase(isDark)

  const colors = isDark ? {
    base: "#1e1e2e",
    text: "#cdd6f4",
    subtext1: "#bac2de",
    subtext0: "#a6adc8",
    overlay1: "#9399b2",
    overlay0: "#6c7086",
    green: "#a6e3a1",
    red: "#f38ba8",
    pink: "#f5c2e7",
    mauve: "#cba6f7",
    cursor: "#f5e0dc",
  } : {
    base: "#eff1f5",
    text: "#4c4f69",
    subtext1: "#5c5f77",
    subtext0: "#6c6f85",
    overlay1: "#7c7f93",
    overlay0: "#8c8fa1",
    green: "#40a02b",
    red: "#d20f39",
    pink: "#ea76cb",
    mauve: "#8839ef",
    cursor: "#dc8a78",
  }

  t.Focused.Base = t.Focused.Base.borderForeground(colors.subtext1)
  t.Focused.Card = t.Focused.Base
  t.Focused.Title = makeFocusedStyle(t.Focused.Title, colors.mauve).bold(true)
  t.Focused.NoteTitle = makeFocusedStyle(t.Focused.NoteTitle, colors.mauve).bold(true).marginBottom(1)
  t.Focused.Directory = makeFocusedStyle(t.Focused.Directory, colors.mauve)
  t.Focused.Description = makeFocusedStyle(t.Focused.Description, colors.subtext0)
  t.Focused.ErrorIndicator = makeFocusedStyle(t.Focused.ErrorIndicator, colors.red)
  t.Focused.ErrorMessage = makeFocusedStyle(t.Focused.ErrorMessage, colors.red)
  t.Focused.SelectSelector = makeFocusedStyle(t.Focused.SelectSelector, colors.pink)
  t.Focused.NextIndicator = makeFocusedStyle(t.Focused.NextIndicator, colors.pink)
  t.Focused.PrevIndicator = makeFocusedStyle(t.Focused.PrevIndicator, colors.pink)
  t.Focused.Option = makeFocusedStyle(t.Focused.Option, colors.text)
  t.Focused.MultiSelectSelector = makeFocusedStyle(t.Focused.MultiSelectSelector, colors.pink)
  t.Focused.SelectedOption = makeFocusedStyle(t.Focused.SelectedOption, colors.green)
  t.Focused.SelectedPrefix = makeFocusedStyle(t.Focused.SelectedPrefix, colors.green)
  t.Focused.UnselectedPrefix = makeFocusedStyle(t.Focused.UnselectedPrefix, colors.text)
  t.Focused.UnselectedOption = makeFocusedStyle(t.Focused.UnselectedOption, colors.text)
  t.Focused.FocusedButton = t.Focused.FocusedButton.foreground(colors.base).background(colors.pink)
  t.Focused.BlurredButton = t.Focused.BlurredButton.foreground(colors.text).background(colors.base)

  t.Focused.TextInput.Cursor = makeFocusedStyle(t.Focused.TextInput.Cursor, colors.cursor)
  t.Focused.TextInput.Placeholder = makeFocusedStyle(t.Focused.TextInput.Placeholder, colors.overlay0)
  t.Focused.TextInput.Prompt = makeFocusedStyle(t.Focused.TextInput.Prompt, colors.pink)

  t.Blurred = { ...t.Focused }
  t.Blurred.Base = t.Focused.Base.borderStyle(borders.hidden)
  t.Blurred.Card = t.Blurred.Base
  t.Blurred.MultiSelectSelector = Style.newStyle().setString("  ")
  t.Blurred.NextIndicator = Style.newStyle()
  t.Blurred.PrevIndicator = Style.newStyle()

  t.Group.Title = t.Focused.Title
  t.Group.Description = t.Focused.Description

  t.Help.Ellipsis = makeFocusedStyle(t.Help.Ellipsis, colors.subtext0)
  t.Help.ShortKey = makeFocusedStyle(t.Help.ShortKey, colors.subtext0)
  t.Help.ShortDesc = makeFocusedStyle(t.Help.ShortDesc, colors.overlay1)
  t.Help.ShortSeparator = makeFocusedStyle(t.Help.ShortSeparator, colors.subtext0)
  t.Help.FullKey = makeFocusedStyle(t.Help.FullKey, colors.subtext0)
  t.Help.FullDesc = makeFocusedStyle(t.Help.FullDesc, colors.overlay1)
  t.Help.FullSeparator = makeFocusedStyle(t.Help.FullSeparator, colors.subtext0)

  return t
}

export function activeStyles(theme: Theme | null, focused: boolean, isDarkBg: boolean): FieldStyles {
  const t = theme ? theme(isDarkBg) : ThemeCharm(isDarkBg)
  return focused ? t.Focused : t.Blurred
}

export function getThemeStyles(theme: Theme | null, isDarkBg: boolean): Styles {
  return theme ? theme(isDarkBg) : ThemeCharm(isDarkBg)
}
