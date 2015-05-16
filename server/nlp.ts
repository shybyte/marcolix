'use strict';

import _ = require('lodash');
import nlpCompromise = require("nlp_compromise")

export function splitIntoSentences(text:string) {
  var sentenceRegExp = /[\s\S]*?(\.|$)/g;
  var sentences:string[] = [];
  var sentence:string;
  while ((sentence = sentenceRegExp.exec(text)[0])) {
    sentences.push(sentence);
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

export function calculateStatistics(text:string):marcolix.TextStatistics {
  var sentences = nlpCompromise.pos(text, {dont_combine: true}).sentences;
  var totalWords = _.sum(sentences.map(s => s.tokens.length));
  var totalSyllables = _.sum(sentences.map(s => getSumOfSyllables(s.tokens)));
  return {
    fleshReadingEase: 206.835 - 1.015 * (totalWords / sentences.length) - 84.6 * (totalSyllables / totalWords),
    wordCount: totalWords
  };
}



