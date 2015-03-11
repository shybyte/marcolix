module marcolix {
  var div = React.createFactory('div');

  export class TestComponent extends React.Component<any,any> {
    render () {
      return div({},'TestComponent');
    }
  }

  React.render(React.createElement(marcolix.TestComponent), document.getElementById('app'))

}

