export interface Accessor<T> {
  Get(): T
  Set(value: T): void
}

export class EmbeddedAccessor<T> implements Accessor<T> {
  private value: T

  constructor(defaultValue: T) {
    this.value = defaultValue
  }

  Get(): T {
    return this.value
  }

  Set(value: T): void {
    this.value = value
  }
}

export class PointerAccessor<T> implements Accessor<T> {
  private ref: { value: T }

  constructor(ref: { value: T }) {
    this.ref = ref
  }

  Get(): T {
    return this.ref.value
  }

  Set(value: T): void {
    this.ref.value = value
  }
}

export function NewPointerAccessor<T>(ref: { value: T }): PointerAccessor<T> {
  return new PointerAccessor(ref)
}
