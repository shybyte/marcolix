/// <reference path="../../shared/shared-utils" />
/// <reference path="editor" />
/// <reference path="sidebar" />
/// <reference path="utils" />

module marcolix {
  'use strict';

  var utils = marcolix.utils;
  var div = React.createFactory('div');
  var button = React.createFactory('button');

  var ENABLE_MANUAL_CHECKING = false;

  interface AppState {
    checkReport: LocalCheckReport
    issues: Issue[]
    selectedIssue: Issue
    issueUnderCursor: Issue
  }

  export class MainComponent extends React.Component<any,AppState> {
    isChecking = new Bacon.Bus()
    replaceEventBus = new Bacon.Bus()
    changePoll = Bacon.interval(10 * 1000, true)
    lastText = ''

    state = {
      checkReport: null,
      issues: [],
      selectedIssue: null,
      issueUnderCursor: null
    }


    componentDidMount() {
      if (ENABLE_MANUAL_CHECKING) {
        return;
      }
      this.check();
      // ennable check as you type
      this.getEditor().changeEventStream.debounce(500).merge(this.replaceEventBus).merge(this.changePoll)
        .holdWhen(this.isChecking).throttle(100).onValue(() => {
          this.check();
        });
    }

    getEditor = () => (<EditorComponent> this.refs['editor'])
    getEditorText = () => this.getEditor().getText()

    check = (force?:boolean):Promise<any> => {
      console.log('Checking?');
      var time = Date.now();
      var currentText = this.getEditorText();
      //console.log('Current Text:', currentText.replace(/ /g, '_').replace(/\n/g, '\\n\n'));
      var endTime = Date.now();
      console.log('Time for TextExt:', endTime - time, currentText.split(/[\s\n]/).length);
      if (!force && currentText === this.lastText) {
        return new Promise(resolve => resolve());
      }
      this.isChecking.push(true);
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
      this.isChecking.push(false);
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
      this.getEditor().replaceIssue(issue, index);
      this.changeState(s => {
        s.issues = _.reject(s.issues, issue);
      });
      this.replaceEventBus.push(true);
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
      return div({className: 'marcolix'},
        ENABLE_MANUAL_CHECKING ?
          button({className: 'checkButton', onClick: () => this.check(true)}, 'Check') : null,
        div({className: 'editorSidebarRow'},
          Editor({
            checkReport: this.state.checkReport,
            issues: this.state.issues,
            selectedIssue: this.state.selectedIssue,
            onCursorOverIssue: this.onCursorOverIssue,
            ref: 'editor'
          }),
          Sidebar({
            checkReport: this.state.checkReport,
            issues: this.state.issues,
            selectedIssue: this.state.selectedIssue || this.state.issueUnderCursor,
            onClickIssue: this.onClickIssue,
            onClickReplacement: this.onClickReplacement,
            ref: 'sidebar'
          })
        )
      );
    }
  }

  if (!window['isTestRunning']) {
    React.render(React.createElement(MainComponent), document.getElementById('app'))
  }

}

