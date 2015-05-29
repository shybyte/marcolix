'use strict';

import _ = require('lodash');
import utils = require('./utils');
import Issue = marcolix.Issue;

function startsWithWhiteSpace(s:string) {
  return /^\s./.test(s);
}

function prependPrecedingWord(issue:Issue, error:languageTool.Error):Issue {
  var contextBefore = error.context.slice(0, parseInt(error.contextoffset));
  var wordBefore = contextBefore.replace(/^.*?(\S+\s*$)/, '$1');
  return utils.set(issue, iss => {
    iss.surface = wordBefore + issue.surface;
    iss.replacements = issue.replacements.map(r => wordBefore + r);
    iss.range = [iss.range[0] - wordBefore.length, iss.range[1]]
  });

}

function removeWhiteSpacesFromBegin(issue:Issue) {
  var issueSurfaceWithoutWhiteSpaceAtBegin = _.trimLeft(issue.surface);
  var numberOfWhiteSpacesAtBegin = issue.surface.length - issueSurfaceWithoutWhiteSpaceAtBegin.length;
  return utils.set(issue, (iss:Issue) => {
    iss.surface = issueSurfaceWithoutWhiteSpaceAtBegin;
    iss.range = [iss.range[0] + numberOfWhiteSpacesAtBegin, iss.range[1]];
  });
}

export function convertCheckReport(checkReportLanguageTool:languageTool.CheckReport):Issue[] {
  return _.map(checkReportLanguageTool.matches.error, '$').map(function (error:languageTool.Error) {
    var errorLength = parseInt(error.errorlength);
    var offset = parseInt(error.offset);
    var issue:marcolix.Issue = {
      id: _.uniqueId(),
      message: error.msg,
      surface: error.context.substr(parseInt(error.contextoffset), errorLength),
      replacements: error.replacements ? error.replacements.split('#') : [],
      range: [offset, offset + errorLength],
      type: error.locqualityissuetype,
      ruleId: error.ruleId
    };
    if (startsWithWhiteSpace(issue.surface)) {
      if (offset === 0) {
        return removeWhiteSpacesFromBegin(issue);
      }
      return prependPrecedingWord(issue, error);
    } else {
      return issue;
    }
  })

}
