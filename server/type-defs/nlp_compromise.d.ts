declare module 'nlp_compromise' {
  export = nlp_compromise;

  module nlp_compromise {
    function sentences(text: string): string[]
    function syllables(text: string): string[]
    function pos(text: string, options?: {}): {sentences: any[]}
  }
}
