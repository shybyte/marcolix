var path = require('path');
var http = require('http');
var express = require('express');

var app = express();
var port = 3000;
app.set('port', port);

app.use(express.static(path.join(__dirname, '..', 'client')));

app.use('/api', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({test: 'Hossa'}));
});

var server = http.createServer(app);
server.listen(port);