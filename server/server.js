var path = require('path');
var http = require('http');
var express = require('express');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var parseXML = require('xml2js').parseString;
var bodyParser = require('body-parser');
var _ = require('lodash');

function pathInsideProjectRoot(pathFromProjectRoot) {
  return path.join(__dirname, '..', pathFromProjectRoot);
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


function convertCheckReport(checkReportLanguageTool) {
  return {
    issues: _.map(checkReportLanguageTool.matches.error, '$').map(function (error) {
      return {
        context: error.context,
        message: error.msg,
        surface: error.context.substr(error.contextoffset, error.errorlength),
        replacements: error.replacements ? error.replacements.split('#') : []
      }
    })
  }
}


function check(req, res) {
  request({
    url: 'http://localhost:8081',
    method: 'POST',
    form: {
      language: req.query.language || req.body.language,
      text: req.query.text || req.body.text
    }
  }).then(function (checkRequestResponse) {
    var checkReportXML = checkRequestResponse[1];
    parseXML(checkReportXML, function (err, checkReportLanguageTool) {
      res.setHeader('Content-Type', 'application/json');
      //res.end(JSON.stringify(checkReportLanguageTool));
      res.end(JSON.stringify(convertCheckReport(checkReportLanguageTool)));
    });
  });
};

app.get('/check', check);
app.post('/check', check);


var server = http.createServer(app);
server.listen(port);