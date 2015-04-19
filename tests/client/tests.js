(function () {
  'use strict';

  var test = QUnit.test;

  var testDiv = document.getElementById('testDiv');

  QUnit.module("removeAllMarkings");

  var removeAllMarkings = marcolix.utils.removeAllMarkings;

  test("Should keep simple text intact.", function (assert) {
    testDiv.innerHTML = 'test';
    removeAllMarkings(testDiv);
    assert.equal(testDiv.innerHTML, 'test');
  });

  test("Should keep simple text inside of markings.", function (assert) {
    testDiv.innerHTML = '<span itemId="1">test</span>';
    removeAllMarkings(testDiv);
    assert.equal(testDiv.innerHTML, 'test');
  });

  test("Nested markings", function (assert) {
    testDiv.innerHTML = '<span itemId="1"><span itemId="2">test</span></span>';
    removeAllMarkings(testDiv);
    assert.equal(testDiv.innerHTML, 'test');
  });

  test("Multiple children inside of the marking", function (assert) {
    testDiv.innerHTML = '<span itemId="1">test1 <span itemId="2">test2</span> test3</span>';
    removeAllMarkings(testDiv);
    assert.equal(testDiv.innerHTML, 'test1 test2 test3');
  });

  QUnit.module("removeMarkings");
  var removeMarkings = marcolix.utils.removeMarkings;

  test("Remove only the intended marking", function (assert) {
    testDiv.innerHTML = '<span itemid="1">test1</span> <span itemid="2">test2</span> <span itemid="3">test3</span>';
    removeMarkings(testDiv,['2']);
    assert.equal(testDiv.innerHTML, '<span itemid="1">test1</span> test2 <span itemid="3">test3</span>');
  });


  QUnit.module("simpleDiff");
  var simpleDiff = marcolix.utils.simpleDiff;
  var NULL_DIFF = {
    deletionRange: [0, 0],
    insertionLength: 0
  };

  test("empty string", function (assert) {
    assert.deepEqual(simpleDiff('', ''), {
      deletionRange: [0, 0],
      insertionLength: 0,
      insertion: ''
    });
  });

  test("same string", function (assert) {
    assert.deepEqual(simpleDiff('same', 'same'), {
      deletionRange: [4, 4],
      insertionLength: 0,
      insertion: ''
    });
  });

  test("just insertion", function (assert) {
    assert.deepEqual(simpleDiff('0123', '01X23'), {
      deletionRange: [2, 2],
      insertionLength: 1,
      insertion: 'X'
    });
    assert.deepEqual(simpleDiff('0123', '01XX23'), {
      deletionRange: [2, 2],
      insertionLength: 2,
      insertion: 'XX'
    });
  });

  test("just deletion", function (assert) {
    assert.deepEqual(simpleDiff('0123', '013'), {
      deletionRange: [2, 3],
      insertionLength: 0,
      insertion: ''
    });
    assert.deepEqual(simpleDiff('0123', '03'), {
      deletionRange: [1, 3],
      insertionLength: 0,
      insertion: ''
    });
  });

  test("insertion and deletion", function (assert) {
    assert.deepEqual(simpleDiff('0123', '01X3'), {
      deletionRange: [2, 3],
      insertionLength: 1,
      insertion: 'X'
    });
    assert.deepEqual(simpleDiff('0123', '0XX3'), {
      deletionRange: [1, 3],
      insertionLength: 2,
      insertion: 'XX'
    });
  });


  test("repeating an existing char", function (assert) {
    assert.deepEqual(simpleDiff('0123', '01223'), {
      deletionRange: [3, 3],
      insertionLength: 1,
      insertion: '2'
    });
    assert.deepEqual(simpleDiff('0123', '012223'), {
      deletionRange: [3, 3],
      insertionLength: 2,
      insertion: '22'
    });
  });

  test("deleting an existing char", function (assert) {
    assert.deepEqual(simpleDiff('01223', '0123'), {
      deletionRange: [3, 4],
      insertionLength: 0,
      insertion: ''
    });
    assert.deepEqual(simpleDiff('012223', '0123'), {
      deletionRange: [3, 5],
      insertionLength: 0,
      insertion: ''
    });
  });

  QUnit.module("text-extraction");
  var extractText = marcolix.utils.extractText;

  test("Simple Text", function (assert) {
    testDiv.innerHTML = 'Text';
    assert.equal(extractText(testDiv), 'Text');
  });

  test("Handles DIV like an linebreak", function (assert) {
    testDiv.innerHTML = '<div>Text1</div>Text2';
    assert.equal(extractText(testDiv), 'Text1\nText2');
  });

  test("Handles DIVs like linebreaks", function (assert) {
    testDiv.innerHTML = '<div>Text1</div>Text2<div>Text3</div>';
    assert.equal(extractText(testDiv), 'Text1\nText2\nText3\n');
  });

  test("Handles BRs like linebreaks", function (assert) {
    testDiv.innerHTML = 'Text1<br/>Text2<br>Text3';
    assert.equal(extractText(testDiv), 'Text1\nText2\nText3');
  });

  test("Handles <div><br></div> as one empty line", function (assert) {
    testDiv.innerHTML = 'Text1<div><br></div>Text2';
    assert.equal(extractText(testDiv), 'Text1\n\nText2');
  });

  test("Handles <div><br></div><div><br></div> as two empty line", function (assert) {
    testDiv.innerHTML = 'Text1<div><br></div><div><br></div>Text2';
    assert.equal(extractText(testDiv), 'Text1\n\n\nText2');
  });

  test("Is fast", function (assert) {
    var innerHTML = _.repeat('<div>Text1</div>Text2', 10000);
    console.log('htmlLength', innerHTML.length);
    testDiv.innerHTML = innerHTML;
    var startTime = Date.now();
    extractText(testDiv)
    var neededTime = Date.now() - startTime;
    assert.ok(neededTime < 500, 'Should not need ' + neededTime + ' ms.');
    console.log('Time in ms: ', neededTime);
  });

  //test("Rangy is slow", function (assert) {
  //  testDiv.innerHTML = _.repeat('<div>Text1</div>Text2', 10);
  //  var startTime = Date.now();
  //  rangy.innerText(testDiv);
  //  var neededTime = Date.now() - startTime;
  //  assert.ok(neededTime < 1000, 'Should not need ' + neededTime + ' ms.');
  //});

  QUnit.module("TextMapping");
  var concatTextMappings = marcolix.utils.concatTextMappings;
  var textMapping = marcolix.utils.textMapping;
  var domPosition = marcolix.utils.domPosition;


  test("concatTextMappings", function (assert) {
    testDiv.innerHTML = '<span>0</span><span>12</span>';
    var textMapping0 = textMapping('0', [domPosition(testDiv.childNodes[0], 0)]);
    var textMapping1 = textMapping('12', [domPosition(testDiv.childNodes[1], 0), domPosition(testDiv.childNodes[1], 1)]);
    assert.deepEqual(concatTextMappings([]), textMapping('', []));
    assert.deepEqual(concatTextMappings([textMapping0]), textMapping0);
    assert.deepEqual(concatTextMappings([textMapping0, textMapping1]),
      textMapping('012', [textMapping0.domPositions[0], textMapping1.domPositions[0], textMapping1.domPositions[1]]));
  });

  QUnit.module("extractTextMapping");
  var extractTextMapping = marcolix.utils.extractTextMapping;

  test("empty Text ", function (assert) {
    testDiv.innerHTML = '';
    assert.deepEqual(extractTextMapping(testDiv), textMapping('', []));
  });

  test("simple textnode with length 1", function (assert) {
    testDiv.innerHTML = '0';
    assert.deepEqual(extractTextMapping(testDiv), textMapping('0', [domPosition(testDiv.firstChild, 0)]));
  });

  test("simple textnode with length 2", function (assert) {
    testDiv.innerHTML = '01';
    assert.deepEqual(extractTextMapping(testDiv),
      textMapping('01', [domPosition(testDiv.firstChild, 0), domPosition(testDiv.firstChild, 1)])
    );
  });

  test("Handles DIV like an linebreak", function (assert) {
    testDiv.innerHTML = '<div>012</div>456';
    var expectedText = '012\n456';
    var tm = extractTextMapping(testDiv);
    assert.equal(tm.text, expectedText);
    assert.equal(tm.domPositions.length, expectedText.length);
    var textNode012 = testDiv.firstChild.firstChild;
    var textNode456 = testDiv.childNodes[1];
    assert.deepEqual(tm.domPositions[0], domPosition(textNode012, 0));
    assert.deepEqual(tm.domPositions[1], domPosition(textNode012, 1));
    assert.deepEqual(tm.domPositions[3], domPosition(textNode012, 3));
    assert.deepEqual(tm.domPositions[4], domPosition(textNode456, 0));
  });

  test("Handles DIV content", function (assert) {
    testDiv.innerHTML = '012<div>456</div>89';
    var expectedText = '012\n456\n89';
    var tm = extractTextMapping(testDiv);
    assert.equal(tm.text, expectedText);
    assert.equal(tm.domPositions.length, expectedText.length);
    var textNode456 = testDiv.childNodes[1].firstChild;
    assert.deepEqual(tm.domPositions[4], domPosition(textNode456, 0));
    assert.deepEqual(tm.domPositions[7], domPosition(textNode456, 3));
  });

  test("Handles display:none elements", function (assert) {
    testDiv.innerHTML = '<div>012<span style="display: none;">X</span></div>456';
    var expectedText = '012\n456';
    var tm = extractTextMapping(testDiv);
    var textNode456 = testDiv.childNodes[1];
    assert.equal(tm.text, expectedText);
    assert.deepEqual(tm.domPositions[4], domPosition(textNode456, 0));
  });

  test("Handles div br elements", function (assert) {
    testDiv.innerHTML = '012<div><br/></div>56';
    var expectedText = '012\n\n56';
    var tm = extractTextMapping(testDiv);
    var textNode56 = testDiv.childNodes[2];
    assert.equal(tm.text, expectedText);
    assert.deepEqual(tm.domPositions[5], domPosition(textNode56, 0));
  });



  //test("simple Texxt ", function (assert) {
  //  testDiv.innerHTML = '<span>0</span><span>12</span>';
  //  var expected = textMapping('012', [])
  //  var textMapping0 = textMapping('0', [domPosition(testDiv.childNodes[0], 0)]);
  //  var textMapping1 = textMapping('12', [domPosition(testDiv.childNodes[1], 0), domPosition(testDiv.childNodes[1], 1)]);
  //  assert.deepEqual(concatTextMappings([]), textMapping('', []));
  //  assert.deepEqual(concatTextMappings([textMapping0]), textMapping0);
  //  assert.deepEqual(concatTextMappings([textMapping0, textMapping1]),
  //    textMapping('012', [textMapping0.domPositions[0], textMapping1.domPositions[0], textMapping1.domPositions[1]]));
  //});



})();


