export interface Eval<T> {
  val: T
  fn: (() => T) | null
  bindings: any
  bindingsHash: number
  cache: Map<number, T>
  loading: boolean
  shouldUpdate(): [boolean, number]
  loadFromCache(): boolean
  update(val: T): void
}

export function createEval<T>(defaultVal: T): Eval<T> {
  return {
    val: defaultVal,
    fn: null,
    bindings: null,
    bindingsHash: 0,
    cache: new Map(),
    loading: false,
    shouldUpdate(): [boolean, number] {
      if (this.fn === null) return [false, 0]
      const newHash = hashObject(this.bindings, new Set())
      return [this.bindingsHash !== newHash, newHash]
    },
    loadFromCache(): boolean {
      const val = this.cache.get(this.bindingsHash)
      if (val !== undefined) {
        this.loading = false
        this.val = val
        return true
      }
      return false
    },
    update(val: T): void {
      this.val = val
      this.cache.set(this.bindingsHash, val)
      this.loading = false
    },
  }
}

function hashObject(obj: any, seen: Set<any>): number {
  if (obj === null || obj === undefined) return 0
  if (typeof obj === "number") return obj | 0
  if (typeof obj === "string") {
    let h = 0
    for (let i = 0; i < obj.length; i++) {
      h = ((h << 5) - h + obj.charCodeAt(i)) | 0
    }
    return h
  }
  if (typeof obj === "boolean") return obj ? 1 : 0
  if (typeof obj === "function") return 0
  if (seen.has(obj)) return 0
  seen.add(obj)
  if (Array.isArray(obj)) {
    let h = 1
    for (let i = 0; i < obj.length; i++) {
      h = ((h << 5) - h + hashObject(obj[i]!, seen)) | 0
    }
    return h
  }
  if (typeof obj === "object") {
    let h = 2
    const keys = Object.keys(obj).sort()
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]!
      let kh = 0
      for (let j = 0; j < k.length; j++) {
        kh = ((kh << 5) - kh + k.charCodeAt(j)) | 0
      }
      h = ((h << 5) - h + kh) | 0
      h = ((h << 5) - h + hashObject(obj[k], seen)) | 0
    }
    return h
  }
  return 0
}

function hash(val: any): number {
  return hashObject(val, new Set())
}

export function shouldUpdate<T>(e: Eval<T>): [boolean, number] {
  return e.shouldUpdate()
}

export function loadFromCache<T>(e: Eval<T>): boolean {
  return e.loadFromCache()
}

export function updateEval<T>(e: Eval<T>, val: T): void {
  e.update(val)
}

export function resolveEval<T>(e: Eval<T>, bindings: any): Eval<T> {
  const newEval = { ...e, bindings }
  const [needsUpdate, newHash] = newEval.shouldUpdate()
  newEval.bindingsHash = newHash
  if (!needsUpdate) return newEval
  if (newEval.loadFromCache()) return newEval
  if (newEval.fn) {
    newEval.loading = true
    const val = newEval.fn()
    newEval.update(val)
  }
  return newEval
}
