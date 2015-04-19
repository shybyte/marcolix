import assert = require("assert");
import nlp = require("../../server/nlp");


describe('splitIntoSentences', function () {
  it('empty string -> empty array', function () {
    assert.deepEqual(nlp.splitIntoSentences(''),[]);
  });
  it('Sentence without .', function () {
    assert.deepEqual(nlp.splitIntoSentences('I like it'),['I like it']);
    assert.deepEqual(nlp.splitIntoSentences('I like it '),['I like it ']);
  });
  it('Sentence with .', function () {
    assert.deepEqual(nlp.splitIntoSentences('I like it.'),['I like it.']);
  });
  it('Multiple Sentences', function () {
    assert.deepEqual(nlp.splitIntoSentences('I like it. Sentence 2'),['I like it.',' Sentence 2']);
    assert.deepEqual(nlp.splitIntoSentences('I like it. Sentence 2.'),['I like it.',' Sentence 2.']);
  });
});
