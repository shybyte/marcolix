module marcolix.service {
  export function check(documentContent:string, options?:Object): Promise<CheckReport> {
    return reqwest({
      url: 'check',
      method: 'POST',
      data: {
        language: 'EN-US',
        text: documentContent
      }
    });
  }
}