module marcolix.service {
  'use strict';

  var socket = io();

  export function check(documentContent:string, options?:Object):Promise<LocalCheckReport> {
    var checkCommandArguments:CheckCommandArguments = {
      text: documentContent,
      language: 'EN-US'
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


}