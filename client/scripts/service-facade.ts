module marcolix.service {
  var socket = io();

  export function check(documentContent:string, options?:Object):Promise<CheckReport> {
    var checkCommandArguments:CheckCommandArguments = {
      text: documentContent,
      language: 'EN-US'
    };

    return new Promise(resolve => {
      socket.emit('check', checkCommandArguments, checkReport => {
        resolve(checkReport);
      });
    });

    //return reqwest({
    //  url: 'check',
    //  method: 'POST',
    //  data: checkCommandArguments
    //});
  }


  export function checkLocal(diff: SimpleDiff):Promise<CheckReport> {
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