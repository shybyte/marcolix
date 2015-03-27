import Promise = require('bluebird');
import requestModule = require('request');
import parseXmlModule = require('xml2js');
import _ = require('lodash');

import utils = require('./utils');
var set = utils.set;
var map = utils.map;
import convertCheckReportModule = require('./report');
import nlp = require('./nlp');
var convertCheckReport = convertCheckReportModule.convertCheckReport;
var request = <(any) => any> Promise.promisify(requestModule);
var parseXML = Promise.promisify(parseXmlModule.parseString);
import Issue = marcolix.Issue;
import CheckReport = marcolix.CheckReport;


interface Sentence {
  offset: number;
  text: string;
}

export interface IssueWithinSentence extends Issue{
  sentence?: Sentence
  rangeInSentence?: marcolix.Range
}

interface JoinedSentence extends Sentence {
  joinedOffset : number // offset in jointed text
}

var cache = {};

function makeCacheKey(language:string, text:string) {
  return language + ':' + text;
}

function checkText(text:string, language:string):Promise<marcolix.CheckReport> {
  return request({
    url: 'http://localhost:8081',
    method: 'POST',
    form: {
      language: language,
      text: text,
      disabled: 'ENGLISH_WORD_REPEAT_BEGINNING_RULE'
    }
  }).then(function (checkRequestResponse) {
    var checkReportXML = checkRequestResponse[1];
    return parseXML(checkReportXML)
  }).then(function (checkReportLanguageTool) {
    var checkReport = convertCheckReport(checkReportLanguageTool);
    return checkReport;
  })
}

export function fixIssueRanges(sentences:JoinedSentence[], issues:Issue[]):IssueWithinSentence[] {
  return map(issues, (issue:IssueWithinSentence) => {
    // This find operation could be optimized.
    var sentence = _.findLast(sentences, s => s.joinedOffset <= issue.range[0]);
    var issueOffsetInsideJoinedSentence = issue.range[0] - sentence.joinedOffset;
    var issueStartOffset = (sentence.offset + issueOffsetInsideJoinedSentence);
    var issueLength = issue.range[1] - issue.range[0];
    issue.range = [issueStartOffset, issueStartOffset + issueLength];
    issue.rangeInSentence = [issueOffsetInsideJoinedSentence, issueOffsetInsideJoinedSentence + issueLength];
    issue.sentence = sentence;
  });
}

function checkSentences(sentences:Sentence[], language:string):Promise<IssueWithinSentence[]> {
  var joinedText = '';
  var joinedSentences:JoinedSentence[] = [];
  sentences.forEach(s => {
    joinedSentences.push({
      offset: s.offset,
      text: s.text,
      joinedOffset: joinedText.length
    });
    joinedText += s.text + ' ';
  });
  console.log('Check:'+ joinedText);
  return checkText(joinedText, language).then(checkReport =>
    fixIssueRanges(joinedSentences, checkReport.issues));
}

export function getSentences(sentencesTexts:string[]):Sentence[] {
  var offsets = sentencesTexts.reduce((offsets, sentence) => {
      return offsets.concat(_.last(offsets) + sentence.length)
    }, [0]
  ).slice(0, sentencesTexts.length);
  return sentencesTexts.map((sentenceText, i) => ({
    offset: offsets[i],
    text: sentenceText
  }));
}

function getIssuesFromCache(language, s:Sentence):Issue[] {
  var cachedIssuesOfSentence:IssueWithinSentence[] = cache[makeCacheKey(language, s.text)];
  return map(cachedIssuesOfSentence, issue => {
    issue.id = _.uniqueId();
    issue.range = [issue.rangeInSentence[0] + s.offset, issue.rangeInSentence[1] + s.offset];
  });
}

function cacheIssues(language: string, sentences: Sentence[], newIssues: IssueWithinSentence[]) {
  var newIssuesBySentenceOffset = _.groupBy(newIssues, issue => issue.sentence.offset);
  _.forEach(sentences, sentence => {
    cache[makeCacheKey(language, sentence.text)] = newIssuesBySentenceOffset[sentence.offset] || [];
  });
}

export function check(req, res) {
  var startTime = Date.now();
  var language = req.query.language || req.body.language;
  var checkPartialTextWithCurrentLanguage = (sentence:Sentence) => checkText(sentence.text, language);
  var text = req.query.text || req.body.text;
  var sentencesTexts = nlp.splitIntoSentences(text);
  var sentences = getSentences(sentencesTexts);
  var sentencePartition = _.partition(sentences, s => cache[makeCacheKey(language, s.text)])
  var cachedSentences = sentencePartition[0];
  var unCachedSentences = sentencePartition[1];
  var unCachedUnEmptySentences = _.reject(unCachedSentences, s => s.text == ' ');
  checkSentences(unCachedUnEmptySentences, language).then(function (newIssues) {
    cacheIssues(language, unCachedUnEmptySentences, newIssues);
    var issuesFromCache = <Issue[]> _.flatten(cachedSentences.map(s => getIssuesFromCache(language, s)));
    var allIssues = _.sortBy(newIssues.concat(issuesFromCache), issue => issue.range[0]);
    var allIssuesCleaned = map(allIssues, issue => {
      delete issue.sentence;
    });
    console.log('Time', Date.now() - startTime);
    res.json({issues: allIssuesCleaned});
  });
};

export function clearCache(req, res) {
  cache = {};
  res.end('Cache cleared ' + new Date());
}

export function showCache(req, res) {
  res.json(cache);
}