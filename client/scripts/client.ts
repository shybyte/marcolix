/// <reference path="editor" />
/// <reference path="sidebar" />

module marcolix {
  var div = React.createFactory('div');
  var button = React.createFactory('button');

  interface AppState {
    checkReport: CheckReport
    issues: Issue[]
    selectedIssue: Issue
    issueUnderCursor: Issue
  }

  export class MainComponent extends React.Component<any,AppState> {
    state = {
      checkReport: null,
      issues: [],
      selectedIssue: null,
      issueUnderCursor: null
    }

    lastText = ''

    componentDidMount() {
      this.check();
      this.startNextCheckTimeout();
    }

    startNextCheckTimeout() {
      setTimeout(() => {
        this.check().then(() => {
          this.startNextCheckTimeout();
        });
      }, 5000);
    }

    check = (force?:boolean):Promise<any> => {
      var editor = <EditorComponent> this.refs['editor'];
      var currentText = editor.getText();
      if (!force && currentText === this.lastText) {
        return new Promise(resolve => resolve());
      }
      this.lastText = currentText;
      return service.check(currentText).then((checkReport) => {
        this.changeState((s:AppState) => {
          s.checkReport = checkReport;
          s.issues = checkReport.issues;
        });
      });
    }

    changeState = (f:(s:AppState) => void) => {
      this.setState(utils.set(this.state, f));
    }

    onClickIssue = (issue:Issue) => {
      console.log('Click:', issue);
      this.changeState(s => {
        s.selectedIssue = issue;
      });
    }

    onClickReplacement = (issue:Issue, index:number) => {
      console.log('Clicked Replacement:', issue, index);

      var editor = <EditorComponent> this.refs['editor'];
      editor.replaceIssue(issue, index);

      this.changeState(s => {
        s.issues = _.reject(s.issues, issue);
      });
    }

    onCursorOverIssue = (issueId:string) => {
      this.changeState(s => {
        var issueUnderCursor = _.find(s.issues, s => s.id === issueId);
        if (issueUnderCursor) {
          s.issueUnderCursor = issueUnderCursor;
          s.selectedIssue = null;
        }
      });
    }

    render() {
      return div({},
        button({className: 'checkButton', onClick: () => this.check(true)}, 'Check'),
        div({},
          div({className: 'editorCol'}, Editor({
            checkReport: this.state.checkReport,
            selectedIssue: this.state.selectedIssue,
            onCursorOverIssue: this.onCursorOverIssue,
            ref: 'editor'
          })),
          div({className: 'sidebarCol'}, Sidebar({
            checkReport: this.state.checkReport,
            issues: this.state.issues,
            selectedIssue: this.state.selectedIssue || this.state.issueUnderCursor,
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

