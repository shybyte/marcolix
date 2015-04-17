/// <reference path="../../shared/shared-utils" />
/// <reference path="editor" />
/// <reference path="sidebar" />
/// <reference path="utils" />

module marcolix {
  var utils = marcolix.utils;
  var div = React.createFactory('div');
  var button = React.createFactory('button');

  interface AppState {
    checkReport: LocalCheckReport
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

    getEditorText = () => (<EditorComponent> this.refs['editor']).getText();

    check = (force?:boolean):Promise<any> => {
      console.log('Checking?');
      var time = Date.now();
      var currentText = this.getEditorText();
      console.log('Current Text:', currentText.replace(/ /g, '_').replace(/\n/g, '\\n\n'));
      var endTime = Date.now();
      console.log('Time for TextExt:', endTime - time, currentText.split(/[\s\n]/).length);
      if (!force && currentText === this.lastText) {
        return new Promise(resolve => resolve());
      }
      //console.log('Checking!');
      //this.lastText = currentText;
      //return service.check(currentText).then(this.onCheckResult);
      if (this.lastText) {
        console.log('Checking local...');
        var checkResultPromise = service.checkLocal(utils.simpleDiff(this.lastText, currentText));
        this.lastText = currentText;
        return checkResultPromise.then(this.onCheckResult);
      } else {
        console.log('Checking global...');
        this.lastText = currentText;
        return service.check(currentText).then(this.onCheckResult);
      }

    }

    onCheckResult = (checkReport:LocalCheckReport) => {
      var currentText = this.getEditorText();
      var diff = utils.simpleDiff(this.lastText, currentText);
      this.changeState((s:AppState) => {
        s.checkReport = checkReport;
        var oldRemainingIssues = _.reject(s.issues, issue => _.contains(checkReport.removedIssueIDs, issue.id));
        var newDisplacedIssues = sharedUtils.displaceIssues(checkReport.newIssues, diff);
        s.issues = _.sortBy(oldRemainingIssues.concat(newDisplacedIssues), (issue:Issue) => issue.range[0]);
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
            issues: this.state.issues,
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

