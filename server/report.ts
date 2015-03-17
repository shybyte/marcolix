import _ = require('lodash');

function startsWithWhiteSpace(s:string) {
  return /^\s./.test(s);
}

function prependPrecedingWord(issue:marcolix.Issue, error:languageTool.Error) {
  var contextBefore = error.context.slice(0, error.contextoffset);
  var wordBefore = contextBefore.replace(/^.*?(\S+\s*$)/, '$1');
  return {
    message: issue.message,
    surface: wordBefore + issue.surface,
    replacements: issue.replacements.map(r => wordBefore + r)
  };
}

export function convertCheckReport(checkReportLanguageTool:languageTool.CheckReport):marcolix.CheckReport {
  return {
    issues: _.map(checkReportLanguageTool.matches.error, '$').map(function (error:languageTool.Error) {
      var issue = {
        message: error.msg,
        surface: error.context.substr(error.contextoffset, error.errorlength),
        replacements: error.replacements ? error.replacements.split('#') : []
      };
      if (startsWithWhiteSpace(issue.surface)) {
        return prependPrecedingWord(issue, error);
      } else {
        return issue;
      }
    })
  }
}
