declare module languageTool {
  export interface Error {
    context: string
    msg: string
    replacements: string
    offset: string
    contextoffset: string
    errorlength: string
    locqualityissuetype: string
    ruleId: string
  }

  export interface CheckReport {
    matches: {
      error: Error[]
    }
  }
}