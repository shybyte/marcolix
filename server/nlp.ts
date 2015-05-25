'use strict';

import _ = require('lodash');
import nlpCompromise = require("nlp_compromise")

var ABBREVIATIONS = [
  // honourifics
  "jr", "mr", "mrs", "ms", "dr", "prof", "sr", "sen", "corp", "rep", "gov", "atty", "supt", "det", "rev", "col", "gen", "lt", "cmdr", "adm", "capt", "sgt", "cpl", "maj", "miss", "sir", "esq", "mstr", "phd", "adj", "adv", "asst", "bldg", "brig", "comdr", "hon", "messrs", "mlle", "mme", "op", "ord", "pvt", "reps", "res", "sens", "sfc", "surg",
  // common abbreviations
  "arc", "al", "ave", "blvd", "cl", "ct", "cres", "exp", "rd", "st", "dist", "mt", "ft", "fy", "hwy", "la", "pd", "pl", "plz", "tce", "vs", "etc", "esp", "llb", "md", "bl", "ma", "ba", "lit", "fl", "ex", "eg", "ie",
  // places
  "ala", "ariz", "ark", "cal", "calif", "col", "colo", "conn", "del", "fed", "fla", "ga", "ida", "ind", "ia", "kan", "kans", "ken", "ky", "la", "md", "mich", "minn", "mont", "neb", "nebr", "nev", "okla", "penna", "penn", "pa", "dak", "tenn", "tex", "ut", "vt", "va", "wash", "wis", "wisc", "wy", "wyo", "usafa", "alta", "ont", "que", "sask", "yuk", "bc",
  // orgs
  "dept", "univ", "assn", "bros", "inc", "ltd", "co", "corp",
  // proper nouns with exclamation marks
  "yahoo", "joomla", "jeopardy"
];

var ABBREVIATIONS_REGEXP = new RegExp("\\b(" + ABBREVIATIONS.join("|") + ")[.!?] ?$", "i");
var ACRONYM_REGEXP = new RegExp("[ .][A-Z][.]?$", "i")

function splitIntoChunks(text:string) {
  var chunksRegExp = /[\s\S]*?([.!?]|$)/g;
  var chunks:string[] = [];
  var chunk;
  while (chunk = chunksRegExp.exec(text)[0]) {
    chunks.push(chunk);
  }
  return chunks;
}

export function splitIntoSentences(text:string) {
  var sentences:string[] = [];
  var partialSentence:string = '';
  var chunks = splitIntoChunks(text);
  chunks.forEach((chunk, i) => {
    var sentence = partialSentence + chunk;
    var nextChunk = chunks[i + 1];
    if (sentence.match(ABBREVIATIONS_REGEXP) || sentence.match(ACRONYM_REGEXP) || (nextChunk && nextChunk.match(/^\S/))) {
      partialSentence = sentence;
    } else {
      sentences.push(sentence);
      partialSentence = '';
    }
  });
  if (partialSentence) {
    sentences.push(partialSentence);
  }
  return sentences;
}

export function splitIntoSentencesOriginal(text:string):string[] {
  var abbrev, abbrevs, clean, i, sentences, tmp;
  tmp = text.split(/(\S.+?[.\?!])(?=\s+|$|")/g);
  sentences = [];
  abbrevs = ["jr", "mr", "mrs", "ms", "dr", "prof", "sr", "sen", "corp", "calif", "rep", "gov", "atty", "supt", "det", "rev", "col", "gen", "lt", "cmdr", "adm", "capt", "sgt", "cpl", "maj", "dept", "univ", "assn", "bros", "inc", "ltd", "co", "corp", "arc", "al", "ave", "blvd", "cl", "ct", "cres", "exp", "rd", "st", "dist", "mt", "ft", "fy", "hwy", "la", "pd", "pl", "plz", "tce", "Ala", "Ariz", "Ark", "Cal", "Calif", "Col", "Colo", "Conn", "Del", "Fed", "Fla", "Ga", "Ida", "Id", "Ill", "Ind", "Ia", "Kan", "Kans", "Ken", "Ky", "La", "Me", "Md", "Mass", "Mich", "Minn", "Miss", "Mo", "Mont", "Neb", "Nebr", "Nev", "Mex", "Okla", "Ok", "Ore", "Penna", "Penn", "Pa", "Dak", "Tenn", "Tex", "Ut", "Vt", "Va", "Wash", "Wis", "Wisc", "Wy", "Wyo", "USAFA", "Alta", "Ont", "QuÔøΩ", "Sask", "Yuk", "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "sept", "vs", "etc", "esp", "llb", "md", "bl", "phd", "ma", "ba", "miss", "misses", "mister", "sir", "esq", "mstr", "lit", "fl", "ex", "eg", "sep", "sept"];
  abbrev = new RegExp("(^| )(" + abbrevs.join("|") + ")[.] ?$", "i");
  for (i in tmp) {
    if (tmp[i]) {
      //tmp[i] = tmp[i].replace(/^\s+|\s+$/g, "");
      if (tmp[i].match(abbrev) || tmp[i].match(/[ |\.][A-Z]\.?$/)) {
        tmp[parseInt(i) + 1] = tmp[i] + " " + tmp[parseInt(i) + 1];
      }
      else {
        sentences.push(tmp[i]);
        tmp[i] = "";
      }
    }
  }
  // console.log(tmp)
  clean = [];
  for (i in sentences) {
    //sentences[i] = sentences[i].replace(/^\s+|\s+$/g, "");
    if (sentences[i]) {
      clean.push(sentences[i]);
    }
  }
  if (clean.length == 0) {
    return [text];
  }
  return clean;
}

function getSumOfSyllables(tokens:{text: string}[]) {
  return _.sum(tokens.map(t => nlpCompromise.syllables(t.text).length));
}

export function fleshReadingEase(text:string):number {
  return calculateStatistics(text).fleshReadingEase;
}

export function calculateSimpleStatistics(text:string):marcolix.SimpleTextStatistics {
  try {
    var sentences = nlpCompromise.pos(text, {dont_combine: true}).sentences;
    var totalWords = _.sum(sentences.map(s => s.tokens.length));
    var totalSyllables = _.sum(sentences.map(s => getSumOfSyllables(s.tokens)));
    return {
      sentenceCount: sentences.length,
      wordCount: totalWords,
      syllableCount: totalSyllables,
    };
  } catch (error) {
    console.log('Error while calculateSimpleStatistics', error);
    var stupidWordCount = text.split(' ').length;
    return {
      sentenceCount: 1,
      syllableCount: stupidWordCount,
      wordCount: stupidWordCount
    }
  }
}

export function aggregateSentenceStatistics(simpleSentenceStats:marcolix.SimpleTextStatistics[]):marcolix.TextStatistics {
  return calculateStatsFromSimpleStats({
    wordCount: _.sum(simpleSentenceStats.map(s => s.wordCount)),
    syllableCount: _.sum(simpleSentenceStats.map(s => s.syllableCount)),
    sentenceCount: simpleSentenceStats.length,
  });
}

export function calculateStatsFromSimpleStats(s:marcolix.SimpleTextStatistics):marcolix.TextStatistics {
  return {
    fleshReadingEase: (s.sentenceCount > 0 && s.wordCount > 0)
      ? 206.835 - 1.015 * (s.wordCount / s.sentenceCount) - 84.6 * (s.syllableCount / s.wordCount)
      : 0,
    wordCount: s.wordCount,
    syllableCount: s.syllableCount,
    sentenceCount: s.sentenceCount,
  };
}


export function calculateStatistics(text:string):marcolix.TextStatistics {
  return calculateStatsFromSimpleStats(calculateSimpleStatistics(text));
}



