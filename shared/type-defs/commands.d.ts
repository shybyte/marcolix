declare module marcolix {

  export interface MarcolixCredentials {
    authToken: string
    userId: string
  }

  export interface CheckCommandArguments extends MarcolixCredentials{
    text: string
    language: string
  }

  export interface LocalCheckCommandArguments {
    diff: SimpleDiff
  }

  export interface AddToDictionaryArguments {
    text: string
  }

}