module marcolix.service {
  'use strict';

  var socket = io();

  interface Credentials {
    userId: string
    authToken: string
  }

  export function check(documentContent:string, credentials:Credentials):Promise<LocalCheckReport> {
    var checkCommandArguments:CheckCommandArguments = {
      text: documentContent,
      language: 'EN-US',
      userId: credentials.userId,
      authToken: credentials.authToken
    };

    return new Promise(resolve => {
      socket.emit('check', checkCommandArguments, checkReport => {
        resolve(checkReport);
      });
    });
  }


  export function checkLocal(diff: SimpleDiff):Promise<LocalCheckReport> {
    var checkCommandArguments:LocalCheckCommandArguments = {
      diff: diff
    };

    return new Promise(resolve => {
      socket.emit('checkLocal', checkCommandArguments, checkReport => {
        resolve(checkReport);
      });
    });
  }

  export function addToDictionary(text: string):Promise<boolean> {
    var newDictionaryEntry:AddToDictionaryArguments = {text};

    return new Promise(resolve => {
      socket.emit('addToDictionary', newDictionaryEntry, result => {
        resolve(result);
      });
    });
  }


}