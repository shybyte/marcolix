import _ = require('lodash');

export function set<T>(object:T, f:(T) => void):T {
  var clone = _.clone(object);
  f(clone);
  return clone;
}

export function map<T>(array:T[], f:(T) => void):T[] {
  return array.map((v:T, i:number) => set(v, f));
}
