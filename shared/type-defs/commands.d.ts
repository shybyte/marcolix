declare module marcolix {

  export interface CheckCommandArguments {
    text: string
    language: string
    authToken: string
    userId: string
  }

  export interface LocalCheckCommandArguments {
    diff: SimpleDiff
  }

}