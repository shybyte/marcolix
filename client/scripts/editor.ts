/// <reference path="service-facade" />

module marcolix {
  var div = React.createFactory('div');
  rangy.init();

  function addMarkingToRangyRange(rangyRange, className, id) {
    var applier = rangy.createClassApplier(className, {
      elementAttributes: {
        itemId: id,
        'data-id': id
      }
    });
    applier.applyToRange(rangyRange);
  }

  function createRange(nodes:Node[] | NodeList) {
    var r = rangy.createRange();
    r.setStartBefore(nodes[0]);
    r.setEndAfter(nodes[nodes.length - 1]);
    return r;
  }

  function setRangeText(nodes:Node[] | NodeList, text:string) {
    var range = createRange(nodes);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
  }

  function selectRange(rangyRange) {
    var sel = rangy.getSelection();
    sel.setSingleRange(rangyRange);
  }

  function selectText(nodes:Node[] | NodeList) {
    selectRange(createRange(nodes));
  }

  function addMarkings(editableDiv, checkReport) {
    var range = [0, 0];
    var rangyRange = rangy.createRange();
    rangyRange.selectCharacters(editableDiv, range[0], range[1]);
    checkReport.issues.forEach((issue:Issue) => {
      rangyRange.collapse(true);
      rangyRange.moveStart('character', issue.range[0] - range[0]);
      rangyRange.moveEnd('character', issue.range[1] - issue.range[0]);
      addMarkingToRangyRange(rangyRange, issue.type, issue.id);
      range = issue.range;
    });
  }

  interface EditorProps {
    checkReport: CheckReport
    selectedIssue: Issue
    onCursorOverIssue: (issueId: string) => void
  }

  export class EditorComponent extends React.Component<EditorProps,any> {
    state = {
      isRefreshOfMarkingsNeeded: true
    }

    getEditableDiv() {
      return <HTMLElement> React.findDOMNode(this.refs['editableDiv'])
    }

    getText() {
      return rangy.innerText(this.getEditableDiv());
    }

    componentDidMount() {
      var editableDiv = this.getEditableDiv();
      var issueFreeDummyText = 'This is a good text that I wrote just for you. I like it really much do you know? ';
      var textWithIssues = 'Ei heve cuked thiss soup forr mie .A crave to complicoted. It is an problemm.';
      var longDummyText = 'When they are young you have to wate 3 days. Then you can injeck them for' +
        'pneumonia diseases. You have mack shore they have drye straw.  When you clean them out you should not leave a ' +
        'falk in with them because the mother might nock it down and ' +
        'the little pigs might stab them souve. Ee give the worme pouder that is when they get the worme. This will stop ' +
        'them from going thin you should box a little place off so only the little pigs can get in it that is' +
        'so they can ge out of the way of there mother.  Some people put a light in with theme to geep them warm. You have ' +
        'to make shore that mother. ';
      editableDiv.textContent = _.repeat(longDummyText, 2) + _.repeat(issueFreeDummyText, 20) + _.repeat(textWithIssues, 2);
      //editableDiv.textContent = _.repeat(longDummyText, 0) + _.repeat(issueFreeDummyText, 0) + _.repeat(textWithIssues, 2);
      //editableDiv.textContent = _.repeat('This is a goodd text. I likee it. But it hass errorrs.', 1);
      //editableDiv.textContent = 'This is an test. This is an test. This is an test. This is an test.';
      //setInterval(this.checkForChange, 5000);
    }

    checkForChange = () => {
      console.log('checkForChange');
      var sel = rangy.getSelection();
      if (sel.rangeCount>0 && sel.isCollapsed) {
        var range = sel.getRangeAt(0);
        var el = range.startContainer;
        var parent = el.parentNode;
        if (parent.dataset.id) {
          this.props.onCursorOverIssue(parent.dataset.id);
        }
      }
    }

    componentDidUpdate() {
      var editableDiv = this.getEditableDiv();

      if (this.state.isRefreshOfMarkingsNeeded) {
        console.log('Refresh Markings ...');
        var time = Date.now();
        var savedSelection = rangy.saveSelection();
        utils.removeMarkings(editableDiv);
        if (!this.props.checkReport) {
          return;
        }
        addMarkings(editableDiv, this.props.checkReport);
        if (savedSelection) {
          rangy.restoreSelection(savedSelection);
        }
        var endTime = Date.now();
        console.log('Time for Markings:', endTime - time);
        this.setState({isRefreshOfMarkingsNeeded: false});
      }

      if (this.props.selectedIssue) {
        var markingNodes = this.getMarkingNodes(this.props.selectedIssue);
        if (markingNodes.length > 0) {
          selectText(markingNodes);
          var markingTop = markingNodes[0].offsetTop;
          var scrollTop = editableDiv.scrollTop;
          if (markingTop < editableDiv.scrollTop) {
            editableDiv.scrollTop = markingTop - 20;
          } else if (markingTop > scrollTop + editableDiv.offsetHeight) {
            editableDiv.scrollTop = markingTop - editableDiv.offsetHeight + 40;
          }
        }
      }

    }


    componentWillReceiveProps(nextProps:EditorProps) {
      if (nextProps.checkReport !== this.props.checkReport) {
        this.setState({isRefreshOfMarkingsNeeded: true});
      }
    }

    getMarkingNodes(issue:Issue):HTMLElement[] {
      var nodeList = document.querySelectorAll('[itemid=\"' + issue.id + '\"]');
      return [].slice.call(nodeList);
    }

    replaceIssue = (issue:Issue, replacementIndex) => {
      console.log('Replace in editor', issue, replacementIndex);
      var itemId = issue.id;
      var markingNodes = this.getMarkingNodes(issue);
      if (markingNodes.length > 0) {
        setRangeText(markingNodes, issue.replacements[replacementIndex]);
      }
    }


    render() {
      return div({
        className: 'editor', contentEditable: true, ref: 'editableDiv', spellCheck: false,
        onKeyDown: this.checkForChange,onKeyUp: this.checkForChange,onClick: this.checkForChange
      });
    }

  }

  export var Editor = React.createFactory(EditorComponent);

}
