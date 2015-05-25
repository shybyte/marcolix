'use strict';

import assert = require("assert");
import nlp = require("../../server/nlp");


describe('splitIntoSentences', function () {
  it('empty string -> empty array', function () {
    assert.deepEqual(nlp.splitIntoSentences(''), []);
  });
  it('Sentence without .', function () {
    assert.deepEqual(nlp.splitIntoSentences('I like it'), ['I like it']);
    assert.deepEqual(nlp.splitIntoSentences('I like it '), ['I like it ']);
  });
  it('Sentence with .', function () {
    assert.deepEqual(nlp.splitIntoSentences('I like it.'), ['I like it.']);
  });
  it('Multiple Sentences', function () {
    assert.deepEqual(nlp.splitIntoSentences('I like it. Sentence 2'), ['I like it.', ' Sentence 2']);
    assert.deepEqual(nlp.splitIntoSentences('I like it. Sentence 2.'), ['I like it.', ' Sentence 2.']);
  });
  it('Sentences ending with !', function () {
    assert.deepEqual(nlp.splitIntoSentences('Do it! Now!'), ['Do it!', ' Now!']);
  });
  it('Sentences ending with ?', function () {
    assert.deepEqual(nlp.splitIntoSentences('Really? Yes!'), ['Really?', ' Yes!']);
  });
  it('Don not split at abbreviations', function () {
    assert.deepEqual(nlp.splitIntoSentences('Mr. Bush is stupid.'), ['Mr. Bush is stupid.']);
  });
  it('Don not split at acronyms', function () {
    assert.deepEqual(nlp.splitIntoSentences('George W. Bush is stupid'), ['George W. Bush is stupid']);
  });
  it('Acronyms at text end.', function () {
    assert.deepEqual(nlp.splitIntoSentences('This is the N.A.T.O.'), ['This is the N.A.T.O.']);
  });
  it('Numbers', function () {
    assert.deepEqual(nlp.splitIntoSentences('I have 1.23 dollars'), ['I have 1.23 dollars']);
  });
  it('URLs', function () {
    assert.deepEqual(nlp.splitIntoSentences('My website is www.sternenlaub.de'), ['My website is www.sternenlaub.de']);
  });
});

describe('fleshReadingEase', function () {
  it('Simple example sentences', function () {
    assert.equal(Math.round(nlp.fleshReadingEase('This is a test.')), 118);
    assert.equal(Math.round(nlp.fleshReadingEase('The cat sat on the mat.')), 116);
    assert.equal(Math.round(nlp.fleshReadingEase('I like testing. He likes reading.')), 91);
  });
});

describe('calculateStatistics', function () {
  it('Simple example sentence', function () {
    var stats = nlp.calculateStatistics('It contains another text.');
    assert.equal(stats.wordCount, 4);
  });

  it('White space', function () {
    var stats = nlp.calculateStatistics('   ');
    assert.equal(stats.wordCount, 0);
  });
});
