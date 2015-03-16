declare module languageTool {
  export interface Error {
    context: string
    msg: string
    replacements: string
    contextoffset: number
    errorlength: number
  }
}