'use strict';

import checking = require('./checking');
import utils = require('./utils');
var sharedUtils = require('../shared/shared-utils');

import CheckReport = marcolix.CheckReport;
import LocalCheckReport = marcolix.LocalCheckReport;

var AUTH_TOKEN_VALIDATION_INTERVAL_MS = 60 * 1000;

export function createClientConnection(socket:SocketIO.Socket) {
  var documentUrl:string;
  var userId:string;
  var authToken:string;
  var lastAuthTokenValidationTimeMs = 0;

  var currentText:string;
  var currentLanguage:string;
  var lastCheckReport:CheckReport;

  socket.on('check', (checkCommand:marcolix.CheckCommandArguments, callback:(LocalCheckReport) => void) => {
    documentUrl = checkCommand.documentUrl;
    userId = checkCommand.userId;
    authToken = checkCommand.authToken;
    currentText = checkCommand.text;
    currentLanguage = checkCommand.language;

    checking.checkGlobal(checkCommand).done(checkReport => {
      lastAuthTokenValidationTimeMs = Date.now();
      lastCheckReport = checkReport;
      var localCheckReport:LocalCheckReport = {
        statistics: checkReport.statistics,
        newIssues: checkReport.issues,
        removedIssueIDs: []
      };
      callback(localCheckReport);
    });
  });

  socket.on('checkLocal', (checkCommand:marcolix.LocalCheckCommandArguments, callback) => {
    currentText = utils.applyDiff(currentText, checkCommand.diff);
    var isAuthTokenValidationNeeded = (Date.now() - lastAuthTokenValidationTimeMs) > AUTH_TOKEN_VALIDATION_INTERVAL_MS;
    //console.log('Checking local:', currentText);

    function onCheckDone(checkReport:CheckReport) {
      var localCheckReport = checking.createLocalCheckReport(checkCommand.diff, lastCheckReport, checkReport, 10);
      //console.log('localCheckReport: ', localCheckReport);
      var oldRemainingIssues = _.reject(lastCheckReport.issues, issue => _.contains(localCheckReport.removedIssueIDs, issue.id));
      var displacedOldRemainingIssues = sharedUtils.displaceIssues(oldRemainingIssues, checkCommand.diff);
      lastCheckReport = {
        statistics: checkReport.statistics,
        issues: _.sortBy(displacedOldRemainingIssues.concat(localCheckReport.newIssues), (issue:Issue) => issue.range[0])
      };
      //console.log('issues: ', lastCheckReport.issues);
      callback(localCheckReport);
    }

    var globalCheckCommand = {
      documentUrl,
      text: currentText,
      language: currentLanguage,
      userId: userId,
      authToken: authToken
    };

    if (isAuthTokenValidationNeeded) {
      checking.checkGlobal(globalCheckCommand).then(onCheckDone).done(() => {
        lastAuthTokenValidationTimeMs = Date.now();
      });
    } else {
      checking.checkGlobalUnSecured(globalCheckCommand).done(onCheckDone);
    }

  });


  socket.on('addToDictionary', (newDictionaryEntry:marcolix.AddToDictionaryArguments, callback:(boolean) => void) => {
    checking.addToDictionary(newDictionaryEntry, {userId: userId, authToken: authToken}).then(function (success) {
      callback(success);
    });
  });


}