// validate.ts | validation functions (huh port)

/**
 * ValidateNotEmpty checks if the input is not empty.
 */
export function ValidateNotEmpty(): (value: string) => string | true {
  return (value: string) => {
    if (value.length === 0) {
      return "input cannot be empty"
    }
    return true
  }
}

/**
 * ValidateMinLength checks if the length of the input is at least min.
 */
export function ValidateMinLength(min: number): (value: string) => string | true {
  return (value: string) => {
    if ([...value].length < min) {
      return `input must be at least ${min} characters long`
    }
    return true
  }
}

/**
 * ValidateMaxLength checks if the length of the input is at most max.
 */
export function ValidateMaxLength(max: number): (value: string) => string | true {
  return (value: string) => {
    if ([...value].length > max) {
      return `input must be at most ${max} characters long`
    }
    return true
  }
}

/**
 * ValidateLength checks if the length of the input is within the specified range.
 */
export function ValidateLength(min: number, max: number): (value: string) => string | true {
  return (value: string) => {
    const minResult = ValidateMinLength(min)(value)
    if (minResult !== true) return minResult
    return ValidateMaxLength(max)(value)
  }
}

/**
 * ValidateOneOf checks if a string is one of the specified options.
 */
export function ValidateOneOf(...options: string[]): (value: string) => string | true {
  const validOptions = new Set(options)
  return (value: string) => {
    if (!validOptions.has(value)) {
      return `invalid option: ${value}`
    }
    return true
  }
}
