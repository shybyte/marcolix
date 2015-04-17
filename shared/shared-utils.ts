if (!this['window']) {
  _  = require('lodash');
}

import Issue = marcolix.Issue;
import CheckReport = marcolix.CheckReport;
import SimpleDiff = marcolix.SimpleDiff;

module marcolix.sharedUtils {
  function set<T>(object:T, f:(T) => void):T {
    var clone = _.clone(object);
    f(clone);
    return clone;
  }

  function isRangeNotOverlapping(range1:[number,number], range2:[number,number]) {
    return range1[0] >= range2[1] || range2[0] >= range1[1]
  }

  export function isRangeOverlapping(range1:[number,number], range2:[number,number]) {
    return !isRangeNotOverlapping(range1, range2);
  }

  export function displaceIssues(issues:Issue[], diff:SimpleDiff):Issue[] {
    var deletionRange = diff.deletionRange;
    var unDeletedIssues = issues.filter(issue => isRangeNotOverlapping(issue.range, deletionRange));
    var displacement = diff.insertionLength + (deletionRange[0] - deletionRange[1]);
    return unDeletedIssues.map(issue => {
      if (issue.range[1] < deletionRange[0]) {
        return issue;
      } else {
        return set(issue, issue => {
          issue.range = [issue.range[0] + displacement, issue.range[1] + displacement];
        });
      }
    })
  }
}

if (!this['window']) {
  exports.isRangeOverlapping = marcolix.sharedUtils.isRangeOverlapping;
  exports.displaceIssues = marcolix.sharedUtils.displaceIssues;
}