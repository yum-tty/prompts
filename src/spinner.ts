import type { Msg, Cmd } from "cinnamon-bun"
import { Tick, Batch, Quit, Interrupt } from "cinnamon-bun"

export type SpinnerType = "line" | "dot" | "miniDot" | "jump" | "points" | "pulse" | "globe" | "moon" | "monkey" | "meter" | "hamburger" | "ellipsis"

export const SpinnerLine: SpinnerType = "line"
export const SpinnerDot: SpinnerType = "dot"
export const SpinnerMiniDot: SpinnerType = "miniDot"
export const SpinnerJump: SpinnerType = "jump"
export const SpinnerPoints: SpinnerType = "points"
export const SpinnerPulse: SpinnerType = "pulse"
export const SpinnerGlobe: SpinnerType = "globe"
export const SpinnerMoon: SpinnerType = "moon"
export const SpinnerMonkey: SpinnerType = "monkey"
export const SpinnerMeter: SpinnerType = "meter"
export const SpinnerHamburger: SpinnerType = "hamburger"
export const SpinnerEllipsis: SpinnerType = "ellipsis"

const spinnerFrames: Record<SpinnerType, string[]> = {
  line: ["-", "\\", "|", "/"],
  dot: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  miniDot: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  jump: ["⢀", "⠠", "⠐", "⠈", "⠈", "⠐", "⠠", "⢀"],
  points: ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"],
  pulse: ["█", "▓", "░", "▓"],
  globe: ["🌍", "🌎", "🌏"],
  moon: ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"],
  monkey: ["🙈", "🙉", "🙊"],
  meter: ["▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱", "▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱", "▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱", "▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱", "▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱", "▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱", "▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱", "▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱", "▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱", "▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱", "▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱", "▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱", "▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱", "▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱", "▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱", "▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱", "▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱", "▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱", "▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱", "▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱", "▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱", "▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱", "▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰", "▱▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱", "▱▱▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱", "▱▱▱▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱", "▱▱▱▱▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱", "▱▱▱▱▱▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱", "▱▱▱▱▱▱▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱", "▱▱▱▱▱▱▱▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱", "▱▱▱▱▱▱▱▱▰▰▰▰▰▰▱▱▱▱▱▱▱▱", "▱▱▱▱▱▱▱▱▱▰▰▰▰▱▱▱▱▱▱▱▱▱", "▱▱▱▱▱▱▱▱▱▱▰▰▱▱▱▱▱▱▱▱▱▱"],
  hamburger: ["☱", "☲", "☴"],
  ellipsis: ["...", "..  ", ".   ", "    "],
}

const TICK_INTERVAL = 80

export interface SpinnerStyles {
  spinner: { color: string }
  title: { color: string }
}

export interface SpinnerTheme {
  Theme(isDark: boolean): SpinnerStyles
}

export type SpinnerThemeFunc = (isDark: boolean) => SpinnerStyles

export function spinnerThemeDefault(isDark: boolean): SpinnerStyles {
  return {
    spinner: { color: "#F780E2" },
    title: { color: isDark ? "#FFFDF5" : "#00020A" },
  }
}

export interface SpinnerModel {
  type: string
  spinnerType: SpinnerType
  title: string
  action: (() => void | Promise<void>) | null
  theme: SpinnerThemeFunc
  frameIndex: number
  done: boolean
  err: Error | null
  hasDarkBg: boolean
  Type(t: SpinnerType): SpinnerModel
  Title(title: string): SpinnerModel
  Action(action: () => void | Promise<void>): SpinnerModel
  WithTheme(theme: SpinnerThemeFunc): SpinnerModel
  init(): [SpinnerModel, Cmd]
  update(msg: Msg): [SpinnerModel, Cmd]
  view(): string
}

function tickCmd(): Cmd {
  return Tick(TICK_INTERVAL, (data: any) => ({ type: "tick", data } as Msg))
}

export function Spinner(config: {
  type?: SpinnerType
  title?: string
  action?: () => void | Promise<void>
  theme?: SpinnerThemeFunc
} = {}): SpinnerModel {
  let actionRunning = false

  const model: SpinnerModel = {
    type: "spinner",
    spinnerType: config.type ?? "dot",
    title: config.title ?? "Loading...",
    action: config.action ?? null,
    theme: config.theme ?? spinnerThemeDefault,
    frameIndex: 0,
    done: false,
    err: null,
    hasDarkBg: false,

    Type(t: SpinnerType): SpinnerModel {
      return { ...this, spinnerType: t }
    },

    Title(title: string): SpinnerModel {
      return { ...this, title }
    },

    Action(action: () => void | Promise<void>): SpinnerModel {
      return { ...this, action }
    },

    WithTheme(theme: SpinnerThemeFunc): SpinnerModel {
      return { ...this, theme }
    },

    init(): [SpinnerModel, Cmd] {
      if (!this.action) return [this, null]

      const self = this
      actionRunning = true
      const actionCmd: Cmd = async () => {
        try {
          await self.action!()
          return { type: "spinnerDone", err: null } as Msg
        } catch (err) {
          return { type: "spinnerDone", err } as Msg
        }
      }

      return [this, Batch(tickCmd(), actionCmd)!]
    },

    update(msg: Msg): [SpinnerModel, Cmd] {
      if (!msg || !("type" in msg)) return [this, null]

      const m = msg as any

      if (m.type === "tick") {
        if (this.done) return [this, null]
        return [
          { ...this, frameIndex: this.frameIndex + 1 },
          tickCmd(),
        ]
      }

      if (m.type === "spinnerDone") {
        return [
          { ...this, done: true, err: m.err },
          Quit(),
        ]
      }

      if (m.type === "key") {
        if (m.name === "c" && m.ctrl) {
          return [this, Interrupt()]
        }
      }

      return [this, null]
    },

    view(): string {
      const frames = spinnerFrames[this.spinnerType] ?? spinnerFrames.dot
      const frame = frames[this.frameIndex % frames.length]!
      const styles = this.theme(this.hasDarkBg)
      const title = this.title ? " " + styles.title.color + this.title : ""
      return frame + title
    },
  }

  return model
}

export function NewSpinner(): SpinnerModel {
  return Spinner()
}
