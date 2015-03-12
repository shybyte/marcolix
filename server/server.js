var path = require('path');
var http = require('http');
var express = require('express');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));

function pathInsideProjectRoot(pathFromProjectRoot) {
  return path.join(__dirname, '..', pathFromProjectRoot);
}

var app = express();
var port = 3000;
app.set('port', port);


app.use(express.static(pathInsideProjectRoot('client')));
app.use('/bower_components', express.static(pathInsideProjectRoot('bower_components')));
app.use('/compiled', express.static(pathInsideProjectRoot('.tmp/compiled')));
app.use('/client', express.static(pathInsideProjectRoot('client'))); // source-maps


app.use('/api', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({test: 'Hossa'}));
});


app.use('/check', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  request({
    url: 'http://localhost:8081',
    method: 'POST',
    form: {
      language: 'EN-US',
      text: 'errorr'
    }
  }).then(function (checkReportXML) {
    console.log('checkReportXML', checkReportXML);
  });
  res.end(JSON.stringify({test: 'CheckResult'}));
});


var server = http.createServer(app);
server.listen(port);