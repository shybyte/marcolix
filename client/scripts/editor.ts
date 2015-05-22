/// <reference path="service-facade" />

module marcolix {
  'use strict';

  import DomPosition = utils.DomPosition;
  import MarcolixHtmlDocument = marcolix.service.document.MarcolixHtmlDocument;

  var div = React.DOM.div;
  var input = React.DOM.input;
  rangy.init();

  function addMarkingToRangyRange(rangyRange, className, id) {
    var applier = rangy.createClassApplier(className, {
      elementAttributes: {
        itemId: id,
        'data-id': id
      }
    });
    applier.applyToRange(rangyRange);
  }

  function createRange(nodes:Node[] | NodeList) {
    var r = rangy.createRange();
    r.setStartBefore(nodes[0]);
    r.setEndAfter(nodes[nodes.length - 1]);
    return r;
  }

  function setRangeText(nodes:Node[] | NodeList, text:string) {
    var range = createRange(nodes);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
  }

  function selectRange(rangyRange) {
    var sel = rangy.getSelection();
    sel.setSingleRange(rangyRange);
  }

  function selectText(nodes:Node[] | NodeList) {
    selectRange(createRange(nodes));
  }

  function getEndPos(issue:Issue, domPositions:DomPosition[]) {
    if (issue.range[1] < domPositions.length) {
      return domPositions[issue.range[1]];
    } else {
      return utils.set(_.last(domPositions), (domPos:DomPosition) => {
        domPos.offset = domPos.offset + 1;
      });
    }
  }

  function addMarkings(editableDiv, issues:Issue[]) {
    var textMapping = utils.extractTextMapping(editableDiv);
    console.log('textMapping: ', textMapping);
    var rangyRange = rangy.createRange();
    var reversedIssues = utils.reverseArray(issues);
    reversedIssues.forEach((issue:Issue, i) => {
      try {
        var prevIssue = reversedIssues[i - 1];
        if (prevIssue && issue.range[1] >= prevIssue.range[0]) {
          textMapping = utils.extractTextMapping(editableDiv);
        }
        var startPos = textMapping.domPositions[issue.range[0]];
        var endPos = getEndPos(issue, textMapping.domPositions);
        if (startPos && endPos) {
          rangyRange.setStart(startPos.node, startPos.offset);
          rangyRange.setEnd(endPos.node, endPos.offset);
          addMarkingToRangyRange(rangyRange, issue.type, issue.id);
        } else {
          console.error('Illegal mapping for :', issue, startPos, endPos);
        }
      } catch (error) {
        console.error('Error while adding Markings', error);
      }
    });
  }

  interface EditorProps {
    documentServiceFacade: marcolix.service.document.DocumentServiceFacade
    checkReport: LocalCheckReport
    selectedIssue: Issue
    onCursorOverIssue: (issueId:string) => void
  }

  export class EditorComponent extends React.Component<EditorProps,any> {
    isSaving = new Bacon.Bus()
    titleChangedEventStream = new Bacon.Bus()
    changePoll = Bacon.interval(10 * 1000, true)
    bodyChangeEventStream:Bacon.EventStream<any>

    lastSavedDocument:MarcolixHtmlDocument = {
      title: '',
      html: ''
    }
    lastSavedHtmlBeforeCleaning:string = ''

    state = {
      isRefreshOfMarkingsNeeded: true,
      title: '',
      documentLoaded: false
    }

    getEditableDiv() {
      return <HTMLElement> React.findDOMNode(this.refs['editableDiv'])
    }

    getText() {
      return utils.extractText(this.getEditableDiv());
    }

    componentDidMount() {
      var editableDiv = this.getEditableDiv();
      var issueFreeDummyText = 'This is a good text that I wrote just for you. I like it really much do you know? ';
      var textWithIssues = 'Ei heve cuked thiss soup forr mie .A crave to complicoted. It is an problemm.';
      var longDummyText = 'When they are young you have to wate 3 days. Then you can injeck them for' +
        'pneumonia diseases. You have mack shore they have drye straw.  When you clean them out you should not leave a ' +
        'falk in with them because the mother might nock it down and ' +
        'the little pigs might stab them souve. Ee give the worme pouder that is when they get the worme. This will stop ' +
        'them from going thin you should box a little place off so only the little pigs can get in it that is' +
        'so they can ge out of the way of there mother.  Some people put a light in with theme to geep them warm. You have ' +
        'to make shore that mother. ';
      //editableDiv.textContent = _.repeat(_.repeat(longDummyText, 2) + _.repeat(issueFreeDummyText, 40) + _.repeat(textWithIssues, 2), 2); //500->120
      //editableDiv.textContent = _.repeat(longDummyText, 0) + _.repeat(issueFreeDummyText, 0) + _.repeat(textWithIssues, 2);
      //editableDiv.textContent = _.repeat('This is a goodd text. I likee it. But it hass errorrs.', 1);
      //editableDiv.textContent = _.repeat('When they are young you have to wate 3 days.', 1);
      //editableDiv.textContent = textWithIssues;
      //editableDiv.innerHTML = 'Test<div>Testt</div> ';
      //editableDiv.innerHTML = _.repeat('This is a good text.<br>I likee it.<br/>But it hass errorrs.', 1);
      //editableDiv.innerHTML = _.repeat('This is a good text.<div><br></div><div><br></div>I likee it.<br/>But it hass errorrs.', 1);
      //editableDiv.innerHTML = _.repeat('Test.<div><span>Testt</span><br><div><br></div>I likee it.</div>', 1);
      //editableDiv.textContent = 'This is an test. This is an test. This is an test. This is an test.';

      var documentLoadedEventStream = new Bacon.Bus();
      this.props.documentServiceFacade.getDocument().then((document:MarcolixHtmlDocument) => {
        this.lastSavedDocument = document;
        editableDiv.innerHTML = document.html;
        // editableDiv.textContent = _.repeat(_.repeat(longDummyText, 2) + _.repeat(issueFreeDummyText, 40) + _.repeat(textWithIssues, 2), 2); //500->120
        documentLoadedEventStream.push({});
        this.setState({title: document.title, documentLoaded: true});
        setTimeout(()=> {
          if (document.title.trim() === '') {
            var title = <HTMLElement> React.findDOMNode(this.refs['documentTitle']);
            title.focus();
          } else {
            this.getEditableDiv().focus();
          }
        }, 100);
      });

      var editableDivDomNode = React.findDOMNode(this.refs['editableDiv']);
      var input = Bacon.fromEvent(editableDivDomNode, 'input');
      var cut = Bacon.fromEvent(editableDivDomNode, 'cut');
      var paste = Bacon.fromEvent(editableDivDomNode, 'paste');
      var keyPressed = Bacon.fromEvent(editableDivDomNode, 'keypress');
      this.bodyChangeEventStream = Bacon.mergeAll([input, cut, paste, keyPressed, documentLoadedEventStream]);
      this.bodyChangeEventStream.merge(this.titleChangedEventStream).debounce(500).merge(this.changePoll)
        .holdWhen(this.isSaving).throttle(100).onValue(this.onAnyPossibleChange);
    }

    onAnyPossibleChange = () => {
      if (this.getEditableDiv().innerHTML !== this.lastSavedHtmlBeforeCleaning
        || this.state.title !== this.lastSavedDocument.title) {
        this.save();
      }
    }

    save = () => {
      var htmlBeforeCleaning = this.getEditableDiv().innerHTML;
      var newDocument = {
        title: this.state.title,
        html: utils.removeAllMarkingsFromHtmlString(htmlBeforeCleaning)
      };
      if (newDocument.html == this.lastSavedDocument.html && newDocument.title == this.lastSavedDocument.title) {
        return;
      }
      this.isSaving.push(true);
      this.props.documentServiceFacade.saveDocument(newDocument).then(() => {
        this.lastSavedDocument = newDocument;
        this.lastSavedHtmlBeforeCleaning = htmlBeforeCleaning;
        this.isSaving.push(false);
      }, (error) => {
        this.isSaving.push(false);
        console.error('Error while saving', error);
      });
    }


    checkForCursorChange = () => {
      var sel = rangy.getSelection();
      if (sel.rangeCount > 0 && sel.isCollapsed) {
        var range = sel.getRangeAt(0);
        var el = range.startContainer;
        var parent = el.parentNode;
        if (parent.dataset.id) {
          this.props.onCursorOverIssue(parent.dataset.id);
        }
      }
    }

    componentDidUpdate() {
      var props = this.props;
      if (!props.checkReport) {
        return;
      }
      var editableDiv = this.getEditableDiv();
      if (this.state.isRefreshOfMarkingsNeeded) {
        console.log('Refresh Markings ...');
        var time = Date.now();
        var savedSelection = rangy.saveSelection();
        if (props.checkReport.removeAllOldIssues) {
          utils.removeAllMarkings(editableDiv);
        } else {
          utils.removeMarkings(editableDiv, props.checkReport.removedIssueIDs);
        }
        addMarkings(editableDiv, props.checkReport.newIssues);

        if (savedSelection) {
          rangy.restoreSelection(savedSelection);
        }
        var endTime = Date.now();
        console.log('Time for Markings:', endTime - time);
        this.setState({isRefreshOfMarkingsNeeded: false});
      }

      if (props.selectedIssue) {
        var markingNodes = this.getMarkingNodes(props.selectedIssue);
        if (markingNodes.length > 0) {
          selectText(markingNodes);
          var markingTop = markingNodes[0].offsetTop;
          var scrollTop = editableDiv.scrollTop;
          if (markingTop < editableDiv.scrollTop) {
            editableDiv.scrollTop = markingTop - 20;
          } else if (markingTop > scrollTop + editableDiv.offsetHeight) {
            editableDiv.scrollTop = markingTop - editableDiv.offsetHeight + 40;
          }
        }
      }

    }


    componentWillReceiveProps(nextProps:EditorProps) {
      if (nextProps.checkReport !== this.props.checkReport) {
        this.setState({isRefreshOfMarkingsNeeded: true});
      }
    }

    getMarkingNodes(issue:Issue):HTMLElement[] {
      var nodeList = document.querySelectorAll('[itemid=\"' + issue.id + '\"]');
      return [].slice.call(nodeList);
    }

    replaceIssue = (issue:Issue, replacementIndex) => {
      console.log('Replace in editor', issue, replacementIndex);
      var markingNodes = this.getMarkingNodes(issue);
      if (markingNodes.length > 0) {
        setRangeText(markingNodes, issue.replacements[replacementIndex]);
      }
    }

    onChangeTitle = (evt) => {
      this.titleChangedEventStream.push({});
      this.setState({title: evt.target.value});
    }

    render() {
      return div({className: 'editor' + (this.state.documentLoaded ? '' : ' hidden')},
        input({
          className: 'editorTitle',
          placeholder: 'Type your title',
          value: this.state.title,
          ref: 'documentTitle',
          maxLength: 50,
          onChange: this.onChangeTitle
        }),
        div({
          className: 'editorBody',
          contentEditable: true, ref: 'editableDiv', spellCheck: false,
          onKeyDown: this.checkForCursorChange, onKeyUp: this.checkForCursorChange, onClick: this.checkForCursorChange
        })
      );
    }

  }

  export var Editor = React.createFactory(EditorComponent);

}
