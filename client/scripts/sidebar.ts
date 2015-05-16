module marcolix {
  'use strict';

  var div = React.createFactory('div');
  var span = React.createFactory('span');
  var button = React.createFactory('button');

  interface IssueComponentProps {
    issue: Issue
    onClick: (issue:Issue) => void
    onClickReplacement: (issue:Issue, index:number) => void
    onClickAddToDictionary: (issue:Issue) => void
    expanded: boolean
  }

  function makeSuffixPrefixWhiteSpaceVisible(s:string) {
    if (/^\s|\s$/.test(s)) {
      return '"' + s + '"';
    } else {
      return s;
    }
  }

  class IssueComponent extends React.Component<IssueComponentProps,any> {
    state = {
      isMouseOverReplacementInTitle: false,
      isMouseOverReplacementPopup: false,
      replacementPopupPositionLeft: 0,
      replacementsInBodyMarginLeft: 0
    }


    componentWillReceiveProps = (nextProps:IssueComponentProps) => {
      var issueBody = <HTMLElement> React.findDOMNode(this.refs['issueBody']);
      if (nextProps.expanded) {
        var issueBodyContent = <HTMLElement> React.findDOMNode(this.refs['issueBodyContent']);
        var bodyHeight = issueBodyContent.offsetHeight + 20;
        issueBody.style.maxHeight = bodyHeight + 'px';

        var replacementInTitle = <HTMLElement>  React.findDOMNode(this.refs['replacementInTitle']);
        if (replacementInTitle) {
          var positionOfReplacementInTitleLeft = replacementInTitle.offsetLeft;
          this.setState({replacementsInBodyMarginLeft: positionOfReplacementInTitleLeft});
        }

      } else {
        issueBody.style.maxHeight = '0px';
      }
    }

    onMouseOverReplacementInTitle = () => {
      if (this.props.expanded) {
        return;
      }
      var positionOfReplacementInTitleLeft = React.findDOMNode(this.refs['replacementInTitle'])['offsetLeft'];
      this.setState({
        isMouseOverReplacementInTitle: true,
        replacementPopupPositionLeft: positionOfReplacementInTitleLeft - 16
      });
    }

    onMouseOutReplacementInTitle = () => {
      this.setState({isMouseOverReplacementInTitle: false})
    }

    onMouseOverReplacementPopup = () => {
      this.setState({isMouseOverReplacementPopup: true})
    }

    onMouseOutReplacementPopup = () => {
      this.setState({isMouseOverReplacementPopup: false})
    }

    isReplacementPopupOpen = () => (this.state.isMouseOverReplacementInTitle || this.state.isMouseOverReplacementPopup)

    onClickReplacement = (event:Event, replacementIndex:number) => {
      event.stopPropagation();
      this.props.onClickReplacement(this.props.issue, replacementIndex);
    }

    onClickAddToDictionary = () => {
      this.props.onClickAddToDictionary(this.props.issue);
    }

    render() {
      var p = this.props;
      var issue = this.props.issue;
      var onClickReplacement = this.onClickReplacement;


      function renderReplacementsTail() {
        return issue.replacements.slice(1, 5).map((replacement, i) =>
            span({
                className: 'replacement',
                key: i,
                onClick: (ev) => onClickReplacement(ev, i + 1)
              },
              makeSuffixPrefixWhiteSpaceVisible(replacement)
            )
        )
      }

      return div({className: 'issue' + (p.expanded ? ' expanded' : ''), title: issue.message},
        // title
        div({className: 'issueTitle', onClick: () => p.onClick(p.issue)},
          span({className: 'icons'},
            span({
              className: 'addToDictionaryIcon',
              title: 'Add to Dictionary',
              onClick: this.onClickAddToDictionary
            }, ''),
            span({className: 'openCloseIcon'}, '')
          ),
          span({className: 'surface'},
            makeSuffixPrefixWhiteSpaceVisible(issue.surface)),
          issue.replacements.length > 0 ?
            span({},
              span({className: 'arrow'}, '\u2192'),
              span({
                  className: 'replacement',
                  ref: 'replacementInTitle',
                  onMouseOver: this.onMouseOverReplacementInTitle,
                  onMouseOut: this.onMouseOutReplacementInTitle,
                  onClick: (ev) => onClickReplacement(ev, 0)
                },
                makeSuffixPrefixWhiteSpaceVisible(issue.replacements[0]))
            ) : null),

        // replacementsPopupContainer
        issue.replacements.length > 1 ? div({className: 'replacementsPopupContainer'},
          div({
              className: 'replacementsPopup ' + ( this.isReplacementPopupOpen() ? 'open' : ''),
              ref: 'replacementsPopup',
              onMouseOver: this.onMouseOverReplacementPopup,
              onMouseOut: this.onMouseOutReplacementPopup,
              style: {
                left: this.state.replacementPopupPositionLeft
              }
            },
            renderReplacementsTail()
          )
        ) : null,

        // body
        div({className: 'issueBody', ref: 'issueBody'},
          div({className: 'issueBodyContent', ref: 'issueBodyContent'},
            div({
                style: {
                  marginLeft: this.state.replacementsInBodyMarginLeft
                }
              },
              renderReplacementsTail()),
            div({className: 'issueMessage'}, issue.message)
          )
        )
      );
    }
  }
  var IssueFac = React.createFactory(IssueComponent);

  export interface SidebarProps {
    checkReport: CheckReport
    issues: Issue[]
    selectedIssue: Issue
    onClickIssue: (Isssue) => void
    onClickReplacement: (issue:Issue, index:number) => void
    onClickAddToDictionary: (issue:Issue) => void
    ref?: string
  }

  export class SidebarComponent extends React.Component<SidebarProps,any> {
    state = {}

    onClickIssue = (issue:Issue) => {
      this.props.onClickIssue(issue);
    }

    componentDidUpdate() {
      var selectedIssue = this.props.selectedIssue;
      if (selectedIssue) {
        // refactor, similar to editor.ts
        var sidebarEl = <HTMLElement> React.findDOMNode(this);
        var issueEl = <HTMLElement> React.findDOMNode(this.refs[selectedIssue.id]);
        if (!issueEl) {
          return;
        }
        var issueTop = issueEl.offsetTop;
        var scrollTop = sidebarEl.scrollTop;
        var sidebarHeight = sidebarEl.offsetHeight;
        if ((issueTop < sidebarEl.scrollTop) || (issueTop > scrollTop + sidebarHeight)) {
          sidebarEl.scrollTop = issueTop - Math.floor(sidebarHeight * 3 / 4);
        }
      }
    }

    render() {
      var p = this.props;
      var state = this.state;

      if (!p.checkReport) {
        return div({className: 'sidebar'}, 'No Check Result YET!')
      }
      return div({className: 'sidebar'},
        div({className: 'sidebarHeader'},
          div({},'Issues: ' + p.issues.length),
          div({},'Words: ' + p.checkReport.statistics.wordCount),
          div({},'Flesch: ' + p.checkReport.statistics.fleshReadingEase.toFixed(2))
        ),
        div({className: 'issues'},
          p.issues.map((issue) => IssueFac({
            onClick: () => this.onClickIssue(issue),
            onClickReplacement: this.props.onClickReplacement,
            onClickAddToDictionary: this.props.onClickAddToDictionary,
            issue: issue,
            expanded: issue === p.selectedIssue,
            key: issue.id,
            ref: issue.id
          })))
      );
    }
  }

  export var Sidebar = React.createFactory(SidebarComponent);

  window['makeSuffixPrefixWhiteSpaceVisible'] = makeSuffixPrefixWhiteSpaceVisible;

}
