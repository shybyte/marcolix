/// <reference path="editor" />
/// <reference path="sidebar" />

module marcolix {
  var div = React.createFactory('div');
  var button = React.createFactory('button');

  interface AppState {
    sidebarProps: SidebarProps
  }

  export class MainComponent extends React.Component<any,AppState> {
    state = {
      sidebarProps: {
        checkReport: null,
        ref: 'sidebar'
      }
    }

    componentDidMount() {
      this.onCheckButton();
    }

    onCheckButton() {
      var editor = <EditorComponent> this.refs['editor'];
      service.check(editor.getText()).then((checkReport) => {
        this.setState({
            sidebarProps: {
              checkReport: checkReport
            }
          }
        )
      });
    }

    render() {
      return div({},
        button({className: 'checkButton', onClick: this.onCheckButton.bind(this)}, 'Check'),
        div({},
          div({className: 'editorCol'}, Editor({ref: 'editor'})),
          div({className: 'sidebarCol'}, Sidebar(this.state.sidebarProps))
        )
      );
    }
  }

  React.render(React.createElement(MainComponent), document.getElementById('app'))

}

