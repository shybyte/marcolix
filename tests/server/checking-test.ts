import assert = require("assert");
import _ = require("lodash");
import checking = require("../../server/checking");
import Range = marcolix.Range;

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