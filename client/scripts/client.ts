/// <reference path="editor" />
/// <reference path="sidebar" />

module marcolix {
  var div = React.createFactory('div');
  var button = React.createFactory('button');

  interface AppState {
    checkReport: CheckReport
  }

  export class MainComponent extends React.Component<any,AppState> {
    state = {
      checkReport: null
    }

    componentDidMount() {
      this.onCheckButton();
    }

    onCheckButton() {
      var editor = <EditorComponent> this.refs['editor'];
      service.check(editor.getText()).then((checkReport) => {
        this.setState({
            checkReport: checkReport
          }
        )
      });
    }

    render() {
      return div({},
        button({className: 'checkButton', onClick: this.onCheckButton.bind(this)}, 'Check'),
        div({},
          div({className: 'editorCol'}, Editor({checkReport: this.state.checkReport, ref: 'editor'})),
          div({className: 'sidebarCol'}, Sidebar({checkReport: this.state.checkReport, ref: 'sidebar'}))
        )
      );
    }
  }

  React.render(React.createElement(MainComponent), document.getElementById('app'))

}

