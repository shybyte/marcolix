/// <reference path="service-facade" />

module marcolix {
  var div = React.createFactory('div');
  rangy.init();

  function addMarkingToRangyRange(rangyRange, className, id) {
    var applier = rangy.createClassApplier(className, {
      elementAttributes: {
        itemId: id
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
      var issueFreeDummyText = _.repeat('This is a good text. I like it. ', 2);
      var textWithIssues = 'Ei heve cuked thiss soup forr mie .A crave to complicoted. It is an problemm.';
      editableDiv.textContent = issueFreeDummyText + _.repeat(textWithIssues, 2);
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
        }
      }

    }


    componentWillReceiveProps(nextProps:EditorProps) {
      if (nextProps.checkReport !== this.props.checkReport) {
        this.setState({isRefreshOfMarkingsNeeded: true});
      }
    }

    getMarkingNodes(issue:Issue) {
      return document.querySelectorAll('[itemid=\"' + issue.id + '\"]');
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
      return div({className: 'editor', contentEditable: true, ref: 'editableDiv', spellCheck: false});
    }

  }

  export var Editor = React.createFactory(EditorComponent);

}
