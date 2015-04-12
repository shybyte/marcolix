import path = require('path');
import http = require('http');
import express = require('express');
import bodyParser = require('body-parser');
import socketIO = require('socket.io');
var compression = require('compression');

import checking = require('./checking');
import clientConnection = require('./client-connection');

function pathInsideProjectRoot(pathFromProjectRoot) {
  var absolutePath = path.join(__dirname, '../../..', pathFromProjectRoot);
  return absolutePath;
}

var app = express();
var port = 3000;
app.set('port', port);

app.use(compression());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: false, limit: '50mb'}));

app.use(express.static(pathInsideProjectRoot('client')));
app.use('/bower_components', express.static(pathInsideProjectRoot('bower_components')));
app.use('/compiled', express.static(pathInsideProjectRoot('.tmp/compiled')));
app.use('/client', express.static(pathInsideProjectRoot('client'))); // source-maps
app.use('/tests', express.static(pathInsideProjectRoot('tests'))); // source-maps

app.get('/check', checking.checkRoute);
app.post('/check', checking.checkRoute);

app.get('/cache/clear', checking.clearCache);
app.post('/cache/clear', checking.clearCache);

app.get('/cache', checking.showCache);

var server = http.createServer(app);
server.listen(port);
var io = socketIO(server);

io.on('connection', function(socket: SocketIO.Socket){
  clientConnection.createClientConnection(socket);
});