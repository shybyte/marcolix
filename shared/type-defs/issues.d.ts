declare module marcolix {
  type Range = [number,number]

  export interface Issue {
    id: string
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