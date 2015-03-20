/// <reference path="service-facade" />

module marcolix {
  var div = React.createFactory('div');
  var MARKING_CLASS = 'marking';

  rangy.init();

  function addMarking(node:Element, range:[number,number], className:string, id:string) {
    var rangyRange = rangy.createRange();
    rangyRange.selectCharacters(node, range[0], range[1]);
    var applier = rangy.createClassApplier(className, {
      elementAttributes: {
        itemId: id
      }
    });
    applier.applyToRange(rangyRange);
  }

  function removeAllMarkings(node:Element, classNames:string[]) {
    var rangyRange = rangy.createRange();
    rangyRange.selectNode(node);
    classNames.forEach((className => {
      var applier = rangy.createClassApplier(className);
      applier.undoToRange(rangyRange);
    }))
  }

  function selectText(firstNode:Node, lastNode:Node) {
    var sel = rangy.getSelection();
    var r = rangy.createRange();
    r.setStartBefore(firstNode);
    r.setEndAfter(lastNode);
    sel.setSingleRange(r);
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
      return React.findDOMNode(this.refs['editableDiv'])
    }

    getText() {
      return rangy.innerText(this.getEditableDiv());
    }

    componentDidMount() {
      var editableDiv = this.getEditableDiv();
      editableDiv.textContent = 'Ei heve cuked thiss soup forr mie .A crave to complicoted. It is an problemm.';
      //this.getEditableDiv().textContent = 'This is super .';
    }

    componentDidUpdate() {
      var editableDiv = this.getEditableDiv();

      if (this.state.isRefreshOfMarkingsNeeded) {
        console.log('Refresh Markings ...');
        removeAllMarkings(editableDiv, ['misspelling', 'whitespace', 'grammar']);
        if (!this.props.checkReport) {
          return;
        }
        this.props.checkReport.issues.map((issue:Issue) => {
          addMarking(editableDiv, issue.range, issue.type, issue.id);
        });

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
