declare module marcolix {
  export type Range = [number,number] // [beginOffset,endOffset]

  export interface Issue {
    id: string
    surface: string
    message: string
    replacements: string[]
    range: Range
    type: string
  }

  export interface SimpleTextStatistics {
    sentenceCount: number;
    syllableCount: number;
    wordCount: number;
  }

  export interface TextStatistics extends SimpleTextStatistics {
    fleshReadingEase: number;
  }

  export interface CheckReport {
    statistics: TextStatistics;
    issues: Issue[]
  }

  export interface LocalCheckReport {
    statistics: TextStatistics;
    newIssues: Issue[]
    removedIssueIDs: string[]
    removeAllOldIssues?: boolean
  }

}