declare module marcolix {

  export interface CheckCommandArguments {
    text: string
    language: string
  }

  export interface LocalCheckCommandArguments {
    diff: SimpleDiff
  }

}