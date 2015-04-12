import checking = require('./checking');
import utils = require('./utils');

export function createClientConnection(socket:SocketIO.Socket) {
  var currentText:string;
  var currentLanguage:string;

  socket.on('check', (checkCommand:marcolix.CheckCommandArguments, callback) => {
    currentText = checkCommand.text;
    currentLanguage = checkCommand.language;
    checking.checkGlobal(checkCommand).done(checkReport => {
      callback(checkReport);
    });
  });

  socket.on('checkLocal', (checkCommand:marcolix.LocalCheckCommandArguments, callback) => {
    currentText = utils.applyDiff(currentText, checkCommand.diff);
    console.log('Checking local:', currentText);
    checking.checkGlobal({text: currentText, language: currentLanguage}).done(checkReport => {
      callback(checkReport);
    });
  });


}