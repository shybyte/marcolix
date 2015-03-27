/// <reference path="editor" />
/// <reference path="sidebar" />

module marcolix {
  var div = React.createFactory('div');
  var button = React.createFactory('button');

  interface AppState {
    checkReport: CheckReport
    issues: Issue[]
    selectedIssue: Issue
  }

  export class MainComponent extends React.Component<any,AppState> {
    state = {
      checkReport: null,
      issues: [],
      selectedIssue: null
    }

    lastText = ''

    componentDidMount() {
      this.check();
      this.startNextCheckTimeout();
    }

    startNextCheckTimeout() {
      setTimeout(() => {
        this.check().then( () => {
          this.startNextCheckTimeout();
        });
      }, 5000);
    }

    check = (force?: boolean) : Promise<any> => {
      var editor = <EditorComponent> this.refs['editor'];
      var currentText = editor.getText();
      if (!force && currentText === this.lastText) {
        return new Promise(resolve => resolve());
      }
      this.lastText = currentText;
      return service.check(currentText).then((checkReport) => {
        this.setState(utils.set(this.state, (s:AppState) => {
          s.checkReport = checkReport;
          s.issues = checkReport.issues;
        }));
      });
    }

    onClickIssue = (issue:Issue) => {
      console.log('Click:', issue);
      this.setState(utils.set(this.state, (s:AppState) => {
        s.selectedIssue = issue;
      }));
    }

    onClickReplacement = (issue:Issue, index:number) => {
      console.log('Clicked Replacement:', issue, index);

      var editor = <EditorComponent> this.refs['editor'];
      editor.replaceIssue(issue, index);

      this.setState(utils.set(this.state, (s:AppState) => {
        s.issues = _.reject(s.issues, issue);
      }));
    }

    render() {
      return div({},
        button({className: 'checkButton', onClick: () => this.check(true)}, 'Check'),
        div({},
          div({className: 'editorCol'}, Editor({
            checkReport: this.state.checkReport,
            selectedIssue: this.state.selectedIssue,
            ref: 'editor'
          })),
          div({className: 'sidebarCol'}, Sidebar({
            checkReport: this.state.checkReport,
            issues: this.state.issues,
            onClickIssue: this.onClickIssue,
            onClickReplacement: this.onClickReplacement,
            ref: 'sidebar'
          }))
        )
      );
    }
  }

  if (!window['isTestRunning']) {
    React.render(React.createElement(MainComponent), document.getElementById('app'))
  }

}

