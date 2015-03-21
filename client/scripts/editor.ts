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

  function selectText(firstNode:Node, lastNode:Node) {
    var sel = rangy.getSelection();
    var r = rangy.createRange();
    r.setStartBefore(firstNode);
    r.setEndAfter(lastNode);
    sel.setSingleRange(r);
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
      var issueFreeDummyText = _.repeat('This is a good text. I like it. ', 100);
      var textWithIssues = 'Ei heve cuked thiss soup forr mie .A crave to complicoted. It is an problemm.';
      editableDiv.textContent = issueFreeDummyText + _.repeat(textWithIssues, 10);
    }

    componentDidUpdate() {
      var editableDiv = this.getEditableDiv();

      if (this.state.isRefreshOfMarkingsNeeded) {
        console.log('Refresh Markings ...');
        var time = Date.now();
        utils.removeMarkings(editableDiv);
        if (!this.props.checkReport) {
          return;
        }
        addMarkings(editableDiv, this.props.checkReport);
        var endTime = Date.now();
        console.log('Time for Markings:', endTime - time);
        this.setState({isRefreshOfMarkingsNeeded: false});
      }

      if (this.props.selectedIssue) {
        var itemId = this.props.selectedIssue.id;
        var markingNodes = document.querySelectorAll('[itemid=\"' + itemId + '\"]');
        if (markingNodes.length > 0) {
          selectText(markingNodes[0], markingNodes[markingNodes.length - 1]);
        }
      }


    }

    componentWillReceiveProps(nextProps:EditorProps) {
      if (nextProps.checkReport !== this.props.checkReport) {
        this.setState({isRefreshOfMarkingsNeeded: true});
      }
    }


    render() {
      return div({className: 'editor', contentEditable: true, ref: 'editableDiv', spellCheck: false});
    }

  }

  export var Editor = React.createFactory(EditorComponent);

}
