import assert = require("assert");
import _ = require("lodash");
import checking = require("../../server/checking");
import Range = marcolix.Range;
import Issue = marcolix.Issue;
import CheckReport = marcolix.CheckReport;
import SimpleDiff = marcolix.SimpleDiff;


function simpleIssue(surface:string, range:Range) {
  return {
    id: _.uniqueId(),
    surface: surface,
    message: null,
    replacements: [],
    range: range,
    type: ''
  }
}

describe('getSentences', function () {
  it('should work', function () {
    var sentences = checking.getSentences(['0123', '456']);
    assert.deepEqual(sentences, [
      {"offset": 0, "text": "0123"},
      {"offset": 4, "text": "456"}
    ]);
  })
});

describe('fixIssueRanges', function () {
  it('works for empty sentence array', function () {
    var fixedIssues = checking.fixIssueRanges([], []);
    assert.deepEqual(fixedIssues, []);
  });

  it('works for 1 sentence on offset 0', function () {
    var fixedIssues = checking.fixIssueRanges([
      {offset: 0, text: '0123', joinedOffset: 0}
    ], [simpleIssue('12', [1, 3])]);

    assert.equal(fixedIssues.length, 1);
    assert.deepEqual(fixedIssues[0].range, [1, 3]);
  });

  it('works for 1 sentence on offset > 0', function () {
    var fixedIssues = checking.fixIssueRanges([
      {offset: 10, text: '0123', joinedOffset: 0}
    ], [simpleIssue('12', [1, 3])]);

    assert.deepEqual(fixedIssues[0].range, [11, 13]);
  });

  it('works for 2 sentence on offsets > 0', function () {
    // joinedText = '0123 567'
    var fixedIssues = checking.fixIssueRanges([
      {offset: 10, text: '0123', joinedOffset: 0},
      {offset: 20, text: '567', joinedOffset: 5}
    ], [
      simpleIssue('12', [1, 3]),
      simpleIssue('6', [6, 7])
    ]);

    assert.equal(fixedIssues.length, 2);
    assert.deepEqual(fixedIssues[0].range, [11, 13]);
    assert.deepEqual(fixedIssues[1].range, [21, 22]);
  })

  it('works for issues on begin of sentences', function () {
    // joinedText = '0123 567'
    var fixedIssues = checking.fixIssueRanges([
      {offset: 10, text: '0123', joinedOffset: 0},
      {offset: 20, text: '567', joinedOffset: 5}
    ], [
      simpleIssue('01', [0, 2]),
      simpleIssue('5', [5, 6])
    ]);

    assert.equal(fixedIssues.length, 2);
    assert.deepEqual(fixedIssues[0].range, [10, 12]);
    assert.deepEqual(fixedIssues[1].range, [20, 21]);
  })

});

describe('createLocalCheckReport', function () {
  it('new issue in the middle', function () {
    var simpleDiff:SimpleDiff = {
      deletionRange: [20, 20],
      insertionLength: 10,
      insertion: 'ErrorNew  '
    }
    var lastCheckReport:CheckReport = {
      issues: [simpleIssue('Error1', [10, 16]), simpleIssue('Error2', [20, 26])]
    }
    var newIssue = simpleIssue('ErrorNew', [20, 28]);
    var currentCheckReport:CheckReport = {
      issues: [simpleIssue('Error1', [10, 16]), newIssue, simpleIssue('Error2', [30, 36])]
    }

    var localCheckReport = checking.createLocalCheckReport(simpleDiff, lastCheckReport, currentCheckReport, 0);

    assert.deepEqual(localCheckReport.newIssues, [newIssue]);
    assert.deepEqual(localCheckReport.removedIssueIDs, []);
  });

  it('replaced issue in the middle', function () {
    var simpleDiff:SimpleDiff = {
      deletionRange: [20, 30],
      insertionLength: 10,
      insertion: 'ErrorNew  '
    }
    var oldIssue = simpleIssue('ErrorOld', [20, 28]);
    var lastCheckReport:CheckReport = {
      issues: [simpleIssue('Error1', [10, 16]), oldIssue, simpleIssue('Error3', [30, 26])]
    }
    var newIssue = simpleIssue('ErrorNew', [20, 28]);
    var currentCheckReport:CheckReport = {
      issues: [simpleIssue('Error1', [10, 16]), newIssue, simpleIssue('Error3', [30, 36])]
    }

    var localCheckReport = checking.createLocalCheckReport(simpleDiff, lastCheckReport, currentCheckReport, 0);

    assert.deepEqual(localCheckReport.newIssues, [newIssue]);
    assert.deepEqual(localCheckReport.removedIssueIDs, [oldIssue.id]);
  });

  it('allow rangeExtension to handle cases like nock -> knock or tim -> time', function () {
    var simpleDiff:SimpleDiff = {
      deletionRange: [20, 28],
      insertionLength: 8,
      insertion: 'ErrorNew'
    }
    var oldIssueBefore = simpleIssue('Error1', [10, 16]);
    var oldIssue = simpleIssue('ErrorOld', [20, 28]);
    var oldIssueAfter = simpleIssue('Error3', [30, 26]);
    var lastCheckReport:CheckReport = {
      issues: [oldIssueBefore, oldIssue, oldIssueAfter]
    }
    var newIssueBefore = simpleIssue('Error1', [10, 16]);
    var newIssue = simpleIssue('ErrorNew', [20, 28]);
    var newIssueAfter = simpleIssue('Error3', [30, 36]);
    var currentCheckReport:CheckReport = {
      issues: [newIssueBefore, newIssue, newIssueAfter]
    }

    var localCheckReport = checking.createLocalCheckReport(simpleDiff, lastCheckReport, currentCheckReport, 10);
    assert.deepEqual(localCheckReport.newIssues, [newIssueBefore, newIssue, newIssueAfter]);
    assert.deepEqual(localCheckReport.removedIssueIDs, [oldIssueBefore.id, oldIssue.id, oldIssueAfter.id]);

    var localCheckReport = checking.createLocalCheckReport(simpleDiff, lastCheckReport, currentCheckReport, 3);
    assert.deepEqual(localCheckReport.newIssues, [newIssue, newIssueAfter]);
    assert.deepEqual(localCheckReport.removedIssueIDs, [oldIssue.id, oldIssueAfter.id]);

    var localCheckReportExtension2 = checking.createLocalCheckReport(simpleDiff, lastCheckReport, currentCheckReport, 1);
    assert.deepEqual(localCheckReportExtension2.newIssues, [newIssue]);
    assert.deepEqual(localCheckReportExtension2.removedIssueIDs, [oldIssue.id]);

  });

});