/// <reference path="service-facade" />

module marcolix {
  var div = React.createFactory('div');
  var MARKING_CLASS = 'marking';

  rangy.init();

  function addMarking(node:Element, range:[number,number], className:string, extraClassNames:string[]) {
    var rangyRange = rangy.createRange();
    rangyRange.selectCharacters(node, range[0], range[1]);
    var applier = rangy.createClassApplier(className, {
      elementProperties: {
        className: extraClassNames.join(' ')
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

  interface EditorProps {
    checkReport: CheckReport
  }

  export class EditorComponent extends React.Component<EditorProps,any> {
    getEditableDiv() {
      return React.findDOMNode(this.refs['editableDiv'])
    }

    getText() {
      return rangy.innerText(this.getEditableDiv());
    }

    componentDidMount() {
      var editableDiv = this.getEditableDiv();
      editableDiv.textContent = 'Ei heve cuked thiss soup forr mie .A crave to complicoted';
      //this.getEditableDiv().textContent = 'This is super .';
    }

    componentDidUpdate() {
      var editableDiv = this.getEditableDiv();
      removeAllMarkings(editableDiv, [MARKING_CLASS, 'misspelling', 'whitespace', 'grammar']);
      if (!this.props.checkReport) {
        return;
      }
      this.props.checkReport.issues.map((issue:Issue) => {
        addMarking(editableDiv, issue.range, MARKING_CLASS, [issue.type]);
      });
    }

    render() {
      return div({className: 'editor', contentEditable: true, ref: 'editableDiv', spellCheck: false});
    }

  }

  export var Editor = React.createFactory(EditorComponent);

}
