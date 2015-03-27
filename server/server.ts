import path = require('path');
import http = require('http');
import express = require('express');
import bodyParser = require('body-parser');

import checking = require('./checking');

function pathInsideProjectRoot(pathFromProjectRoot) {
  var absolutePath = path.join(__dirname, '../../..', pathFromProjectRoot);
  return absolutePath;
}

var app = express();
var port = 3000;
app.set('port', port);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static(pathInsideProjectRoot('client')));
app.use('/bower_components', express.static(pathInsideProjectRoot('bower_components')));
app.use('/compiled', express.static(pathInsideProjectRoot('.tmp/compiled')));
app.use('/client', express.static(pathInsideProjectRoot('client'))); // source-maps
app.use('/tests', express.static(pathInsideProjectRoot('tests'))); // source-maps

app.get('/check', checking.check);
app.post('/check', checking.check);

app.get('/cache/clear', checking.clearCache);
app.post('/cache/clear', checking.clearCache);

app.get('/cache', checking.showCache);

var server = http.createServer(app);
server.listen(port);
