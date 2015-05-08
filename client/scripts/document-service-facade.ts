module marcolix.service.document {
  'use strict';

  export interface DocumentServiceFacade {
    getDocument() : Promise<MarcolixHtmlDocument>;
    saveDocument(htmlDocument:MarcolixHtmlDocument) : Promise<Object>;
  }

  interface  Credentials {
    userId: string
    authToken: string
  }

  export interface Config {
    documentUrl: string
    credentials: Credentials
  }

  export interface  MarcolixHtmlDocument {
    title: string
    html: string
  }

  export function createServiceFacade(config:Config):DocumentServiceFacade {
    var headers = {
      'x-user-id': config.credentials.userId,
      'x-auth-token': config.credentials.authToken
    };

    function getDocument():Promise<MarcolixHtmlDocument> {
      return reqwest({
        url: config.documentUrl,
        method: 'GET',
        headers: headers
      });
    }

    function saveDocument(htmlDocument:MarcolixHtmlDocument):Promise<Object> {
      return reqwest({
        url: config.documentUrl,
        method: 'PUT',
        headers: headers,
        data: htmlDocument
      });
    }

    return {
      getDocument: getDocument,
      saveDocument: saveDocument,
    };

  }


}