import checking = require('./checking');
import utils = require('./utils');
var sharedUtils = require('../shared/shared-utils');

import CheckReport = marcolix.CheckReport;
import LocalCheckReport = marcolix.LocalCheckReport;

export function createClientConnection(socket:SocketIO.Socket) {
  var currentText:string;
  var currentLanguage:string;
  var lastCheckReport:CheckReport;

  socket.on('check', (checkCommand:marcolix.CheckCommandArguments, callback: (LocalCheckReport) => void) => {
    currentText = checkCommand.text;
    currentLanguage = checkCommand.language;
    checking.checkGlobal(checkCommand).done(checkReport => {
      lastCheckReport = checkReport;
      var localCheckReport:LocalCheckReport = {
        newIssues: checkReport.issues,
        removedIssueIDs: []
      };
      callback(localCheckReport);
    });
  });

  socket.on('checkLocal', (checkCommand:marcolix.LocalCheckCommandArguments, callback) => {
    currentText = utils.applyDiff(currentText, checkCommand.diff);
    console.log('Checking local:', currentText);
    checking.checkGlobal({text: currentText, language: currentLanguage}).done(checkReport => {
      var localCheckReport = checking.createLocalCheckReport(checkCommand.diff, lastCheckReport, checkReport);
      console.log('localCheckReport: ',localCheckReport);
      var oldRemainingIssues = _.reject(lastCheckReport.issues, issue => _.contains(localCheckReport.removedIssueIDs, issue.id));
      lastCheckReport = {
        issues: _.sortBy(oldRemainingIssues.concat(localCheckReport.newIssues), (issue:Issue) => issue.range[0])
      };
      callback(localCheckReport);
    });
  });


}