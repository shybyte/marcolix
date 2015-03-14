module marcolix {
  var div = React.createFactory('div');
  var span = React.createFactory('span');
  var button = React.createFactory('button');

  interface IssueComponentProps {
    issue: Issue
  }


  class IssueComponent extends React.Component<IssueComponentProps,any> {
    state = {
      isMouseOverReplacementInTitle: false,
      isMouseOverReplacementPopup: false,
      replacementPopupPositionLeft: 0
    }

    onMouseOverReplacementInTitle = () => {
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
      var issue = this.props.issue;
      return div({className: 'issue', title: this.props.issue.message},
        div({className: 'issueTitle'},
          span({className: 'surface'},
            issue.surface),
          issue.replacements.length > 0 ?
            span({},
              span({className: 'arrow'}, '\u2192'),
              span({
                  className: 'replacement',
                  ref: 'replacementInTitle',
                  onMouseOver: this.onMouseOverReplacementInTitle,
                  onMouseOut: this.onMouseOutReplacementInTitle
                },
                issue.replacements[0])
            ) : null),
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
            issue.replacements.slice(1, 5).map((replacement, i) =>
                span({className: 'replacement', key: i},
                  replacement
                )
            )
          )
        ) : null
      );
    }
  }
  var SidebarFac = React.createFactory(IssueComponent);

  export interface SidebarProps {
    checkReport: CheckReport
    ref?: string
  }

  export class SidebarComponent extends React.Component<SidebarProps,any> {
    render() {
      var p = this.props;

      if (!p.checkReport) {
        return div({}, 'No Check Result YET!')

      }
      return div({className: 'sidebar'},
        p.checkReport.issues.map((issue, i) => SidebarFac({issue: issue, key: '' + i}))
      );
    }
  }

  export var Sidebar = React.createFactory(SidebarComponent);

}
