(function () {
  var test = QUnit.test;

  var testDiv = document.getElementById('testDiv');

  QUnit.module("removeMarkings");

  var removeMarkings = marcolix.utils.removeMarkings;

  test("Should keep simple text intact.", function (assert) {
    testDiv.innerHTML = 'test';
    removeMarkings(testDiv);
    assert.equal(testDiv.innerHTML, 'test');
  });

  test("Should keep simple text inside of markings.", function (assert) {
    testDiv.innerHTML = '<span itemId="1">test</span>';
    removeMarkings(testDiv);
    assert.equal(testDiv.innerHTML, 'test');
  });

  test("Nested markings", function (assert) {
    testDiv.innerHTML = '<span itemId="1"><span itemId="2">test</span></span>';
    removeMarkings(testDiv);
    assert.equal(testDiv.innerHTML, 'test');
  });

  test("Multiple children inside of the marking", function (assert) {
    testDiv.innerHTML = '<span itemId="1">test1 <span itemId="2">test2</span> test3</span>';
    removeMarkings(testDiv);
    assert.equal(testDiv.innerHTML, 'test1 test2 test3');
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
      insertionLength: 0
    });
  });

  test("same string", function (assert) {
    assert.deepEqual(simpleDiff('same', 'same'), {
      deletionRange: [4, 4],
      insertionLength: 0
    });
  });

  test("just insertion", function (assert) {
    assert.deepEqual(simpleDiff('0123', '01X23'), {
      deletionRange: [2, 2],
      insertionLength: 1
    });
    assert.deepEqual(simpleDiff('0123', '01XX23'), {
      deletionRange: [2, 2],
      insertionLength: 2
    });
  });

  test("just deletion", function (assert) {
    assert.deepEqual(simpleDiff('0123', '013'), {
      deletionRange: [2, 3],
      insertionLength: 0
    });
    assert.deepEqual(simpleDiff('0123', '03'), {
      deletionRange: [1, 3],
      insertionLength: 0
    });
  });

  test("insertion and deletion", function (assert) {
    assert.deepEqual(simpleDiff('0123', '01X3'), {
      deletionRange: [2, 3],
      insertionLength: 1
    });
    assert.deepEqual(simpleDiff('0123', '0XX3'), {
      deletionRange: [1, 3],
      insertionLength: 2
    });
  });


  test("repeating an existing char", function (assert) {
    assert.deepEqual(simpleDiff('0123', '01223'), {
      deletionRange: [3, 3],
      insertionLength: 1
    });
    assert.deepEqual(simpleDiff('0123', '012223'), {
      deletionRange: [3, 3],
      insertionLength: 2
    });
  });

  test("deleting an existing char", function (assert) {
    assert.deepEqual(simpleDiff('01223', '0123'), {
      deletionRange: [3, 4],
      insertionLength: 0
    });
    assert.deepEqual(simpleDiff('012223', '0123'), {
      deletionRange: [3, 5],
      insertionLength: 0
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
  })

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

  QUnit.module("moveDomPosition");
  var moveDomPosition = marcolix.utils.moveDomPosition;

  test("Simple Text Nodes", function (assert) {
    testDiv.innerHTML = '0123456789';
    var firstTextNode = testDiv.firstChild;
    assert.deepEqual(moveDomPosition({node: testDiv, offset: 0}, 0),
      {node: firstTextNode, offset: 0});
    assert.deepEqual(moveDomPosition({node: testDiv, offset: 0}, 1),
      {node: firstTextNode, offset: 1});
    assert.deepEqual(moveDomPosition({node: testDiv, offset: 0}, 2),
      {node: firstTextNode, offset: 2});
    assert.deepEqual(moveDomPosition({node: testDiv, offset: 3}, 4),
      {node: firstTextNode, offset: 7});
  });

  test("Move into non breaking element", function (assert) {
    testDiv.innerHTML = '0123<span>456</span>789';
    var span = testDiv.querySelector('span');
    var startPos = {node: testDiv, offset: 0};
    assert.deepEqual(moveDomPosition(startPos, 4),
      {node: span.firstChild, offset: 0});
    assert.deepEqual(moveDomPosition(startPos, 5),
      {node: span.firstChild, offset: 1});
    assert.deepEqual(moveDomPosition(startPos, 6),
      {node: span.firstChild, offset: 2});
    assert.deepEqual(moveDomPosition(startPos, 7),
      {node: testDiv.childNodes[2], offset: 0});
  });

  test("Move into nested non breaking element", function (assert) {
    testDiv.innerHTML = '0123<span><span>456</span></span>789';
    var innerSpan = testDiv.childNodes[1].firstChild;
    var startPos = {node: testDiv, offset: 0};
    assert.deepEqual(moveDomPosition(startPos, 4),
      {node: innerSpan.firstChild, offset: 0});
    assert.deepEqual(moveDomPosition(startPos, 5),
      {node: innerSpan.firstChild, offset: 1});
    assert.deepEqual(moveDomPosition(startPos, 6),
      {node: innerSpan.firstChild, offset: 2});
    assert.deepEqual(moveDomPosition(startPos, 7),
      {node: testDiv.childNodes[2], offset: 0});
  });

  test("Ignore empty span", function (assert) {
    testDiv.innerHTML = '0123<span></span>456';
    var startPos = {node: testDiv, offset: 0};
    assert.deepEqual(moveDomPosition(startPos, 4),
      {node: testDiv.childNodes[2], offset: 0});
  });

  test("Ignore span with display none", function (assert) {
    testDiv.innerHTML = '0123<span style="display:none;"> </span>456';
    var startPos = {node: testDiv, offset: 0};
    assert.deepEqual(moveDomPosition(startPos, 4),
      {node: testDiv.childNodes[2], offset: 0});
  });

  test("Move into breaking element", function (assert) {
    testDiv.innerHTML = '012<div>456</div>89';
    var firstTextNode = testDiv.childNodes[0];
    var innerDiv = testDiv.childNodes[1];
    var startPos = {node: testDiv, offset: 0};
    assert.deepEqual(moveDomPosition(startPos, 3),
      {node: firstTextNode, offset: 3});
    assert.deepEqual(moveDomPosition(startPos, 4),
      {node: innerDiv.firstChild, offset: 0});
    assert.deepEqual(moveDomPosition(startPos, 6),
      {node: innerDiv.firstChild, offset: 2});
    assert.deepEqual(moveDomPosition(startPos, 7),
      {node: innerDiv.firstChild, offset: 3});
  });

})();


