import checking = require('./checking');

export function createClientConnection(socket: SocketIO.Socket) {
  socket.on('check', (checkCommand: marcolix.CheckCommandArguments, callback) => {
    checking.checkGlobal(checkCommand).done(checkReport => {
      callback(checkReport);
    });
  });
}