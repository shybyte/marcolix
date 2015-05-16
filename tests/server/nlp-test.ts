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
});
