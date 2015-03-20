module marcolix.utils {
  export function set<T>(object:T, f:(T) => void):T {
    var clone = _.clone(object);
    f(clone);
    return clone;
  }

  export function removeMarkings(node:HTMLElement) {
    var markings = node.querySelectorAll('span');
    _.forEach(markings, (marking:Node) => {
      var parent = marking.parentNode;
      var childNodesArray = _.map(marking.childNodes, _.identity);
      childNodesArray.forEach((childNode:Node) => {
        parent.insertBefore(childNode, marking);
      });
      parent.removeChild(marking);
    });
  }


}