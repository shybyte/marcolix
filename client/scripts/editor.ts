/// <reference path="service-facade" />

module marcolix {
  var div = React.createFactory('div');

  export class EditorComponent extends React.Component<any,any> {
    getEditableDiv()  {
      return React.findDOMNode(this.refs['editableDiv'])
    }

    getText() {
      return this.getEditableDiv().textContent;
    }

    componentDidMount() {
      this.getEditableDiv().textContent = 'Ei heve cuked thiss soup forr mie. complicoted';
    }

    render() {
      return div({className: 'editor', contentEditable: true, ref: 'editableDiv'});
    }

  }

  export var Editor = React.createFactory(EditorComponent);

}
