declare module marcolix {
  export interface SimpleDiff {
    deletionRange: [number,number]
    insertionLength: number
    insertion: string
  }
}