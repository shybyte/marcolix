module marcolix {
  var div = React.createFactory('div');
  var button = React.createFactory('button');

  export interface SidebarProps {
    checkReport: Object
    ref?: string
  }

  export class SidebarComponent extends React.Component<SidebarProps,any> {
    render() {
      console.log(this.props);
      return div({className: 'sidebar'},
        JSON.stringify(this.props.checkReport)
      );
    }
  }

  export var Sidebar = React.createFactory(SidebarComponent);

}
