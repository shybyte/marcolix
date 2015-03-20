module marcolix.utils {
  export function set<T>(object:T, f:(T) => void):T {
    var clone = _.clone(object);
    f(clone);
    return clone;
  }
}