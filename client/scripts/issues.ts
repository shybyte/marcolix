module marcolix {
  export interface Issue {
    surface: string;
    message: string;
    replacements: string[]
  }

  export interface CheckReport {
    issues: Issue[]
  }
}