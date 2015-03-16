import path = require('path');
import http = require('http');
import express = require('express');
import Promise = require('bluebird');
import requestModule = require('request');
import parseXmlModule = require('xml2js');
import bodyParser = require('body-parser');
import _ = require('lodash');
// type case just to make webstorm happy
var request = <(any) => any> Promise.promisify(requestModule);
var parseXML = parseXmlModule.parseString;

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


function convertCheckReport(checkReportLanguageTool):marcolix.CheckReport {
  return {
    issues: _.map(checkReportLanguageTool.matches.error, '$').map(function (error:languageTool.Error) {
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