'use strict';

import _ = require('lodash');

export function set<T>(object:T, f:(T) => void):T {
  var clone = _.clone(object);
  f(clone);
  return clone;
}

export function map<T>(array:T[], f:(T) => void):T[] {
  return array.map((v:T, i:number) => set(v, f));
}

export function applyDiff(text: string, diff: marcolix.SimpleDiff) {
  return text.slice(0, diff.deletionRange[0]) + diff.insertion + text.slice(diff.deletionRange[1]);
}