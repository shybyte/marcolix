module marcolix {
  var div = React.createFactory('div');
  var span = React.createFactory('span');
  var button = React.createFactory('button');

  interface IssueComponentProps {
    issue: Issue
  }

  class IssueComponent extends React.Component<IssueComponentProps,any> {
    render() {
      var issue = this.props.issue;
      return div({className: 'issue', title: this.props.issue.message},
        span({className: 'surface'},
          issue.surface),
        issue.replacements.length > 0 ?
          span({},
            span({className: 'arrow'}, '\u2192'),
            span({className: 'replacement'},
              issue.replacements[0]
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
