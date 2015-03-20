import _ = require('lodash');
import Issue = marcolix.Issue;

function startsWithWhiteSpace(s:string) {
  return /^\s./.test(s);
}

function prependPrecedingWord(issue:Issue, error:languageTool.Error) : Issue{
  var contextBefore = error.context.slice(0, parseInt(error.contextoffset));
  var wordBefore = contextBefore.replace(/^.*?(\S+\s*$)/, '$1');
  var clonedIssue = _.clone(issue);
  clonedIssue.surface = wordBefore + issue.surface;
  clonedIssue.replacements = issue.replacements.map(r => wordBefore + r);
  return clonedIssue;
}

export function convertCheckReport(checkReportLanguageTool:languageTool.CheckReport):marcolix.CheckReport {
  return {
    issues: _.map(checkReportLanguageTool.matches.error, '$').map(function (error:languageTool.Error) {
      var errorLength = parseInt(error.errorlength);
      var offset = parseInt(error.offset);
      var issue : marcolix.Issue = {
        message: error.msg,
        surface: error.context.substr(parseInt(error.contextoffset), errorLength),
        replacements: error.replacements ? error.replacements.split('#') : [],
        range: [offset, offset + errorLength],
        type: error.locqualityissuetype
      };
      if (startsWithWhiteSpace(issue.surface)) {
        return prependPrecedingWord(issue, error);
      } else {
        return issue;
      }
    })
  }
}
