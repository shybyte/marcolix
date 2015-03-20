declare module marcolix {
  type Range = [number,number]

  export interface Issue {
    surface: string
    message: string
    replacements: string[]
    range: Range
    type: string
  }

  export interface CheckReport {
    issues: Issue[]
  }
}