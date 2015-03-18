module marcolix {
  var div = React.createFactory('div');
  var span = React.createFactory('span');
  var button = React.createFactory('button');

  interface IssueComponentProps {
    issue: Issue
    onClick: (index:number) => void
    index: number
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
      var positionOfReplacementInTitleLeft = React.findDOMNode(this.refs['replacementInTitle'])['offsetLeft'];
      if (nextProps.expanded) {
        var issueBodyContent = <HTMLElement> React.findDOMNode(this.refs['issueBodyContent']);
        var bodyHeight = issueBodyContent.offsetHeight + 20;
        issueBody.style.maxHeight = bodyHeight + 'px';
        this.setState({replacementsInBodyMarginLeft: positionOfReplacementInTitleLeft});
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

    render() {
      var p = this.props;
      var issue = this.props.issue;

      function renderReplacementsTail() {
        return issue.replacements.slice(1, 5).map((replacement, i) =>
            span({className: 'replacement', key: i},
              makeSuffixPrefixWhiteSpaceVisible(replacement)
            )
        )
      }

      return div({className: 'issue' + (p.expanded ? ' expanded' : ''), title: issue.message},
        // title
        div({className: 'issueTitle', onClick: () => p.onClick(p.index)},
          span({className: 'icons'}, span({className: 'openCloseIcon'}, '')),
          span({className: 'surface'},
            makeSuffixPrefixWhiteSpaceVisible(issue.surface)),
          issue.replacements.length > 0 ?
            span({},
              span({className: 'arrow'}, '\u2192'),
              span({
                  className: 'replacement',
                  ref: 'replacementInTitle',
                  onMouseOver: this.onMouseOverReplacementInTitle,
                  onMouseOut: this.onMouseOutReplacementInTitle
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
  var SidebarFac = React.createFactory(IssueComponent);

  export interface SidebarProps {
    checkReport: CheckReport
    ref?: string
  }

  export class SidebarComponent extends React.Component<SidebarProps,any> {
    state = {
      expandedIssueIndex: -1
    }
    onClickIssue = (index:number) => {
      console.log('Clicked on', index);
      this.setState({expandedIssueIndex: index});
    }

    render() {
      var p = this.props;
      var state = this.state;

      if (!p.checkReport) {
        return div({}, 'No Check Result YET!')

      }
      return div({className: 'sidebar'},
        p.checkReport.issues.map((issue, i) => SidebarFac({
          onClick: this.onClickIssue,
          issue: issue,
          expanded: i === state.expandedIssueIndex,
          index: i,
          key: '' + i
        }))
      );
    }
  }

  export var Sidebar = React.createFactory(SidebarComponent);

  window['makeSuffixPrefixWhiteSpaceVisible'] = makeSuffixPrefixWhiteSpaceVisible;

}
