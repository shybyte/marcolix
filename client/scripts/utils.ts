module marcolix.utils {
  export function set<T>(object:T, f:(T) => void):T {
    var clone = _.clone(object);
    f(clone);
    return clone;
  }

  export function removeMarkings(node:HTMLElement) {
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

  interface SimpleDiff {
    deletionRange: [number,number]
    insertionLength: number
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
        insertionLength: 0
      };
    }
    var deletionRangeStart = lengthOfCommonBeginning(oldText, newText);
    var commonEndingLengthAfterDeletion = lengthOfCommonEnding(oldText.slice(deletionRangeStart), newText.slice(deletionRangeStart));
    return {
      deletionRange: [deletionRangeStart, oldText.length - commonEndingLengthAfterDeletion],
      insertionLength: newText.length - commonEndingLengthAfterDeletion - deletionRangeStart
    };
  }

  function isRangeNotOverlapping(range1:[number,number], range2:[number,number]) {
    return range1[0] >= range2[1] || range2[0] >= range1[1]
  }

  export function displaceIssues(issues:Issue[], diff:SimpleDiff):Issue[] {
    var deletionRange = diff.deletionRange;
    var unDeletedIssues = issues.filter(issue => isRangeNotOverlapping(issue.range, deletionRange));
    var displacement = diff.insertionLength + (deletionRange[0] - deletionRange[1]);
    return unDeletedIssues.map(issue => {
      if (issue.range[1] < deletionRange[0]) {
        return issue;
      } else {
        return set(issue, issue => {
          issue.range = [issue.range[0] + displacement, issue.range[1] + displacement];
        });
      }
    })
  }

  function isBreakingElement(node:Element | Node) {
    return node['tagName'] === 'DIV';
  }


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
            if (lastChild && !isBreakingElement(lastChild)) {
              return '\n' + grandChildrenText + '\n';
            } else {
              return grandChildrenText + '\n';
            }
          } else {
            return grandChildrenText;
          }
          return grandChildrenText;
        case Node.TEXT_NODE:
        default:
          return child.textContent;
      }
    }).join('');
  }

  export interface DomPosition {
    node: Node
    offset: number
  }

  function findAncestorWithSibling(node:Node) {
    var currentNode = node.parentNode;
    while (!currentNode.nextSibling && currentNode.parentNode !== currentNode) {
      currentNode = currentNode.parentNode;
    }
    return currentNode;
  }

  function virtualNodeLength(node:Node) {
    if ((node.nextSibling && isBreakingElement(node.nextSibling))
      || (node.nodeType === Node.TEXT_NODE && (!node.nextSibling) && isBreakingElement(node.parentNode))
    ) {
      return node.textContent.length + 1;
    } else {
      return node.textContent.length;
    }
  }

  export function moveDomPosition(startPos:DomPosition, characterCount:number):DomPosition {
    var currentNode = startPos.node;
    var currentNodeCharacterPos = 0 - startPos.offset;
    //debugger;
    while (currentNodeCharacterPos <= characterCount && currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        var currentNodeLength = virtualNodeLength(currentNode);
        if (characterCount - currentNodeCharacterPos < currentNodeLength) {
          return {
            node: currentNode,
            offset: characterCount - currentNodeCharacterPos
          };
        } else if (currentNode.nextSibling) {
          currentNodeCharacterPos += currentNodeLength;
          currentNode = currentNode.nextSibling
        } else {
          currentNodeCharacterPos += currentNodeLength;
          currentNode = findAncestorWithSibling(currentNode).nextSibling;
        }
      } else {
        var currentElement = <HTMLElement> currentNode;
        if (currentElement.firstChild && currentElement.style.display !== 'none') {
          currentNode = currentElement.firstChild;
        } else if (currentElement.nextSibling) {
          currentNode = currentElement.nextSibling;
        } else {
          currentNode = findAncestorWithSibling(currentElement).nextSibling;
        }
      }
    }

    throw new Error('moveDomPosition did something wrong.');
  }


}