module marcolix.utils {
  'use strict';

  export function set<T>(object:T, f:(T) => void):T {
    var clone = _.clone(object);
    f(clone);
    Object.freeze(clone);
    return clone;
  }

  export function removeMarkings(node:HTMLElement, markingIDs: string[]) {
    var markings = node.querySelectorAll('span[itemId]');
    var shouldMarkingGetRemoved = marking => _.contains(markingIDs, marking.attributes['itemId'].value);
    var markingsToRemove = _.filter(markings, shouldMarkingGetRemoved);
    _.forEach(markingsToRemove, (marking:Element) => {
      var parent = marking.parentNode;
      var childNodesArray = _.map(marking.childNodes, _.identity);
      childNodesArray.forEach((childNode:Node) => {
        parent.insertBefore(childNode, marking);
      });
      parent.removeChild(marking);
    });
  }


  export function removeAllMarkings(node:HTMLElement) {
    var markings = node.querySelectorAll('span[itemId]');
    _.forEach(markings, (marking:Node) => {
      var parent = marking.parentNode;
      var childNodesArray = _.map(marking.childNodes, _.identity);
      childNodesArray.forEach((childNode:Node) => {
        parent.insertBefore(childNode, marking);
      });
      parent.removeChild(marking);
    });
  }

  function lengthOfCommonBeginning(s1:string, s2:string):number {
    var indexOfFirstDifference = _.findIndex(s1, (char1, i) => char1 !== s2[i]);
    return indexOfFirstDifference == -1 ? s1.length : indexOfFirstDifference;
  }

  function reverse(s:string) {
    return s.split("").reverse().join("");
  }

  export function lengthOfCommonEnding(s1:string, s2:string):number {
    return lengthOfCommonBeginning(reverse(s1), reverse(s2));
  }

  export function simpleDiff(oldText:string, newText:string):SimpleDiff {
    if (oldText === newText) {
      return {
        deletionRange: [oldText.length, oldText.length],
        insertionLength: 0,
        insertion: ''
      };
    }
    var deletionRangeStart = lengthOfCommonBeginning(oldText, newText);
    var commonEndingLengthAfterDeletion = lengthOfCommonEnding(oldText.slice(deletionRangeStart), newText.slice(deletionRangeStart));
    var insertionLength = newText.length - commonEndingLengthAfterDeletion - deletionRangeStart;
    return {
      deletionRange: [deletionRangeStart, oldText.length - commonEndingLengthAfterDeletion],
      insertionLength: insertionLength,
      insertion: newText.substr(deletionRangeStart, insertionLength)
    };
  }

  function isBreakingElement(node:Element | Node) {
    var tagName = node['tagName'];
    return tagName === 'DIV' || tagName === 'BR';
  }

  // TODO: Replace with call to extractTextMapping (after some performance testing)
  export function extractText(node:Node):string {
    var childNodes = node.childNodes;
    return _.map(childNodes, (child, i)=> {
      switch (child.nodeType) {
        case Node.ELEMENT_NODE:
          var childElement = child;
          var grandChildrenText = extractText(childElement);
          var lastChild = childNodes[i - 1];
          if (isBreakingElement(childElement)) {
            //console.log('lastChild:', lastChild);
            if (lastChild && !isBreakingElement(lastChild) && grandChildrenText && grandChildrenText !== '\n') {
              return '\n' + grandChildrenText + '\n';
            } else {
              if (grandChildrenText === '\n' && lastChild && isBreakingElement(lastChild)) {
                return '\n';
              } else {
                return grandChildrenText + '\n';
              }
            }
          } else {
            return grandChildrenText;
          }
        case Node.TEXT_NODE:
        default:
          return child.textContent;
      }
    }).join('');
  }

  interface TextMapping {
    text: string
    domPositions: DomPosition[]
  }

  export function textMapping(text:string, domPositions:DomPosition[]):TextMapping {
    return {
      text: text,
      domPositions: domPositions
    };
  }

  export function concatTextMappings(textMappings:TextMapping[]):TextMapping {
    return {
      text: textMappings.map(tm => tm.text).join(''),
      domPositions: <DomPosition[]> _.flatten(textMappings.map(tm => tm.domPositions))
    };
  }

  function domPosBehindLastChildren(textMapping:TextMapping) {
    var lastGrandChildrenTextMappingDomPos:DomPosition = _.last(textMapping.domPositions);
    return domPosition(lastGrandChildrenTextMappingDomPos.node, lastGrandChildrenTextMappingDomPos.offset + 1);
  }

  export function extractTextMapping(node:Node):TextMapping {
    var childNodes = node.childNodes;
    return concatTextMappings(_.map(childNodes, (child, i)=> {
      //debugger;
      switch (child.nodeType) {
        case Node.ELEMENT_NODE:
          var childElement = <HTMLElement> child;
          var grandChildrenTextMapping = extractTextMapping(childElement);
          var grandChildrenText = grandChildrenTextMapping.text;
          var prevChild = childNodes[i - 1];

          if (childElement.style.display === 'none') {
            return textMapping('', []);
          }

          if (isBreakingElement(childElement)) {
            //console.log('lastChild:', lastChild);
            if (prevChild && !isBreakingElement(prevChild) && grandChildrenText && grandChildrenText !== '\n') {
              return concatTextMappings([textMapping('\n', [
                  domPosition(childElement, 0)]),
                  grandChildrenTextMapping,
                  textMapping('\n', [domPosBehindLastChildren(grandChildrenTextMapping)])
                ]
              );
              //return '\n' + grandChildrenText + '\n';
            } else {
              if (grandChildrenText === '\n' && prevChild && isBreakingElement(prevChild)) {
                return textMapping('\n', [domPosition(childElement, 0)]);
                //return '\n';
              } else if (child.childNodes.length > 0) {
                return concatTextMappings([
                    grandChildrenTextMapping,
                    textMapping('\n', [domPosBehindLastChildren(grandChildrenTextMapping)])
                  ]
                );
                //return grandChildrenText + '\n';
              } else {
                return textMapping('\n', [domPosition(child, 0)]);
              }
            }
          } else {
            return grandChildrenTextMapping;
          }
        case Node.TEXT_NODE:
        default:
          return textMapping(child.textContent, _.times(child.textContent.length, i => domPosition(child, i)));
      }
    }));
  }

  export interface DomPosition {
    node: Node
    offset: number
  }

  export function domPosition(node:Node, offset:number):DomPosition {
    return {
      node: node,
      offset: offset
    };
  }

  export function reverseArray<T>(array:T[]):T[] {
    var copy = array.concat();
    copy.reverse();
    return copy;
  }

}