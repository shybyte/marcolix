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


var LANGUAGE_TOOL_SERVERS = ['http://localhost:8081'];
//var LANGUAGE_TOOL_SERVERS = ['http://localhost:8081', 'http://localhost:8082'];
//var LANGUAGE_TOOL_SERVERS = ['http://192.168.43.164:8081', 'http://192.168.43.164:8082', 'http://192.168.43.164:8083','http://localhost:8081'];


interface Sentence {
  offset: number;
  text: string;
}

export interface IssueWithinSentence extends Issue {
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

function checkText(text:string, language:string, languageToolServerUrl:string = 'http://localhost:8081'):Promise<marcolix.CheckReport> {
  return request({
    url: languageToolServerUrl,
    method: 'POST',
    form: {
      language: language,
      text: text,
      disabled: 'ENGLISH_WORD_REPEAT_BEGINNING_RULE,WHITESPACE_RULE'
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

class Partition {
  constructor(public joinedText:string = '',
              public joinedSentences:JoinedSentence[] = []) {
  }
}

function splitIntoPartitions(sentences:Sentence[]):Partition[] {
  var partition = new Partition();
  var partitions:Partition[] = [partition];
  var partitionSize = Math.ceil(sentences.length / LANGUAGE_TOOL_SERVERS.length);

  sentences.forEach((s, i) => {
    partition.joinedSentences.push({
      offset: s.offset,
      text: s.text,
      joinedOffset: partition.joinedText.length
    });
    partition.joinedText += s.text;
    if (i < sentences.length - 1) {
      if (partition.joinedSentences.length >= partitionSize) {
        partition = new Partition();
        partitions.push(partition);
      } else {
        partition.joinedText += ' ';
      }
    }
  });

  return partitions;
}

function checkSentences(sentences:Sentence[], language:string):Promise<IssueWithinSentence[]> {
  var partitions = splitIntoPartitions(sentences);
  return Promise.all(partitions.map((p, i) => checkText(p.joinedText, language, LANGUAGE_TOOL_SERVERS[i])))
    .then(function (checkReports:marcolix.CheckReport[]) {
      return <IssueWithinSentence[]> _.flatten(checkReports.map((checkReport, partitionIndex) =>
          fixIssueRanges(partitions[partitionIndex].joinedSentences, checkReport.issues)
      ));
    }
  );
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

function cacheIssues(language:string, sentences:Sentence[], newIssues:IssueWithinSentence[]) {
  var newIssuesBySentenceOffset = _.groupBy(newIssues, issue => issue.sentence.offset);
  _.forEach(sentences, sentence => {
    cache[makeCacheKey(language, sentence.text)] = newIssuesBySentenceOffset[sentence.offset] || [];
  });
}


export function checkGlobal(checkRequest:marcolix.CheckCommandArguments):Promise<marcolix.CheckReport> {
  var startTime = Date.now();
  var language = checkRequest.language;
  var text = checkRequest.text;
  var sentencesTexts = nlp.splitIntoSentences(text);
  var sentences = getSentences(sentencesTexts);
  var sentencePartition = _.partition(sentences, s => cache[makeCacheKey(language, s.text)])
  var cachedSentences = sentencePartition[0];
  var unCachedSentences = sentencePartition[1];
  var unCachedUnEmptySentences = _.reject(unCachedSentences, s => s.text.trim() == '');

  return checkSentences(unCachedUnEmptySentences, language).then(function (newIssues) {
    //console.log('newIssues:', newIssues);
    var issuesFromCache = <Issue[]> _.flatten(cachedSentences.map(s => getIssuesFromCache(language, s)));
    cacheIssues(language, unCachedUnEmptySentences, newIssues);
    var allIssues = _.sortBy(newIssues.concat(issuesFromCache), issue => issue.range[0]);
    var allIssuesCleaned = map(allIssues, issue => {
      delete issue.sentence;
      issue.id = _.uniqueId();
    });
    console.log('Time', Date.now() - startTime);
    return {issues: allIssuesCleaned};
  });

};

export function checkRoute(req, res) {
  checkGlobal({
    text: req.query.text || req.body.text,
    language: req.query.language || req.body.language
  }).done(checkReport => {
    res.json(checkReport);
  });
}

export function clearCache(req, res) {
  cache = {};
  res.end('Cache cleared ' + new Date());
}

export function showCache(req, res) {
  res.json(cache);
}