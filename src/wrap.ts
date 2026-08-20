import { Wrap as caramelWrap } from "@yum-tty/caramel"

const breakChars = ",.-; "

export function wrap(s: string, limit: number): string {
  return caramelWrap(s, limit, breakChars)
}
