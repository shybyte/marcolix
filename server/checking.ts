'use strict';

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

var sharedUtils = require('../shared/shared-utils');

import Issue = marcolix.Issue;
import CheckReport = marcolix.CheckReport;
import SimpleDiff = marcolix.SimpleDiff;

var VALIDATE_TOKEN_URL = 'http://localhost:3000/api/token/validate';
var DICTIONARY_URL = 'http://localhost:3000/api/dictionary';

var LANGUAGE_TOOL_SERVERS = ['http://localhost:8081'];
//var LANGUAGE_TOOL_SERVERS = ['http://localhost:8081', 'http://localhost:8082'];
//var LANGUAGE_TOOL_SERVERS = ['http://192.168.43.164:8081', 'http://192.168.43.164:8082', 'http://192.168.43.164:8083','http://localhost:8081'];


interface Sentence {
  offset: number;
  text: string;
}

interface DictionaryEntry {
  text: string
}

export interface IssueWithinSentence extends Issue {
  sentence?: Sentence
  rangeInSentence?: marcolix.Range
}

interface JoinedSentence extends Sentence {
  joinedOffset : number // offset in jointed text
}

var cache = {};
var statsCache = {};
var dictionaries:{[index: string]: DictionaryEntry[]} = {};

function makeCacheKey(language:string, text:string) {
  return language + ':' + text;
}

function checkText(text:string, language:string, languageToolServerUrl:string = 'http://localhost:8081'):Promise<marcolix.Issue[]> {
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
    return convertCheckReport(checkReportLanguageTool);
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
    .then(function (issuesArray:marcolix.Issue[][]) {
      return <IssueWithinSentence[]> _.flatten(issuesArray.map((issues, partitionIndex) =>
          fixIssueRanges(partitions[partitionIndex].joinedSentences, issues)
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
  return request({
    url: DICTIONARY_URL,
    headers: createCredentialsHeader(checkRequest)
  }).then(function (result):any {
    dictionaries[checkRequest.userId] = JSON.parse(result[1]).dictionary;
    if (result[0].statusCode !== 200) {
      console.error('Not authenticated.');
      return {
        issues: []
      }
    }
    return checkGlobalUnSecured(checkRequest);
  }, function (error) {
    console.error('Error while trying to authenticate: ', error);
    return {
      issues: []
    }
  });
}

function isInDictionary(userId:string, issue:Issue) {
  return _.any(dictionaries[userId], (dictionaryEntry) => dictionaryEntry.text === issue.surface);
}


function calculateStatsCached(language:string, sentences:Sentence[]) {
  var sentenceStats = sentences.map(sentence => {
    var cacheKey = makeCacheKey(language, sentence.text);
    if (statsCache[cacheKey]) {
      return statsCache[cacheKey];
    } else {
      var simpleTextStatistics = nlp.calculateSimpleStatistics(sentence.text);
      statsCache[cacheKey] = simpleTextStatistics;
      return simpleTextStatistics;
    }
  });
  return nlp.aggregateSentenceStatistics(sentenceStats);
}

export function checkGlobalUnSecured(checkRequest:marcolix.CheckCommandArguments):Promise<marcolix.CheckReport> {
  var startTime = Date.now();
  var language = checkRequest.language;
  var text = checkRequest.text.replace(/\u00A0/g, ' ');
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
    }).filter((issue:Issue) => !isInDictionary(checkRequest.userId, issue));
    saveIssueCount(checkRequest, checkRequest.documentUrl, allIssuesCleaned.length);
    console.log('Time', Date.now() - startTime);
    var stats = calculateStatsCached(language, sentences);
    console.log('Time including stats: ', Date.now() - startTime);
    return {
      statistics: stats,
      issues: allIssuesCleaned
    };
  });
}

function createCredentialsHeader(credentials:marcolix.MarcolixCredentials) {
  return {
    'x-user-id': credentials.userId,
    'x-auth-token': credentials.authToken,
  };
}

function saveIssueCount(credentials:marcolix.MarcolixCredentials, documentUrl:string, issueCount:number) {
  request({
    url: documentUrl,
    method: 'PATCH',
    body: {issueCount: issueCount},
    json: true,
    headers: createCredentialsHeader(credentials)
  }).catch((error) => {
    console.error('Error while saving issue count: ', error);
  });
}


export function checkRoute(req, res) {
  checkGlobal({
    documentUrl: req.query.documentUrl || req.body.documentUrl,
    text: req.query.text || req.body.text,
    language: req.query.language || req.body.language,
    userId: req.headers['x-user-id'],
    authToken: req.headers['x-auth-token']
  }).done(checkReport => {
    res.json(checkReport);
  });
}

export function createLocalCheckReport(diff:SimpleDiff, lastCheckReport:CheckReport, currentCheckReport:CheckReport, rangeExtension:number):marcolix.LocalCheckReport {
  var extendedDeletionRange = [diff.deletionRange[0] - rangeExtension, diff.deletionRange[1] + rangeExtension];
  var extendedInsertionRange = [diff.deletionRange[0] - rangeExtension, diff.deletionRange[0] + diff.insertionLength + rangeExtension];
  var removedIssues = lastCheckReport.issues.filter(issue => sharedUtils.isRangeOverlapping(issue.range, extendedDeletionRange));
  return {
    statistics: currentCheckReport.statistics,
    newIssues: currentCheckReport.issues.filter(issue => sharedUtils.isRangeOverlapping(issue.range, extendedInsertionRange)),
    removedIssueIDs: removedIssues.map(issue => issue.id)
  }
}

export function clearCache(req, res) {
  cache = {};
  res.end('Cache cleared ' + new Date());
}

export function showCache(req, res) {
  res.json(cache);
}

export function addToDictionary(newDictionaryEntry:DictionaryEntry, credentials:marcolix.MarcolixCredentials):Promise<boolean> {
  dictionaries[credentials.userId].push(newDictionaryEntry);
  return request({
    url: DICTIONARY_URL,
    method: 'POST',
    body: newDictionaryEntry,
    json: true,
    headers: createCredentialsHeader(credentials)
  }).then(function (result):any {
    return true;
  }, function (error) {
    console.error('Error while trying to add dictionary entry: ', error);
    return false
  });
}