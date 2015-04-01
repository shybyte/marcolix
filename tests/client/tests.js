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
      deletionRange: [2,2],
      insertionLength: 1
    });
    assert.deepEqual(simpleDiff('0123', '01XX23'), {
      deletionRange: [2,2],
      insertionLength: 2
    });
  });

  test("just deletion", function (assert) {
    assert.deepEqual(simpleDiff('0123', '013'), {
      deletionRange: [2,3],
      insertionLength: 0
    });
    assert.deepEqual(simpleDiff('0123', '03'), {
      deletionRange: [1,3],
      insertionLength: 0
    });
  });

  test("insertion and deletion", function (assert) {
    assert.deepEqual(simpleDiff('0123', '01X3'), {
      deletionRange: [2,3],
      insertionLength: 1
    });
    assert.deepEqual(simpleDiff('0123', '0XX3'), {
      deletionRange: [1,3],
      insertionLength: 2
    });
  });


  test("repeating an existing char", function (assert) {
    assert.deepEqual(simpleDiff('0123', '01223'), {
      deletionRange: [3,3],
      insertionLength: 1
    });
    assert.deepEqual(simpleDiff('0123', '012223'), {
      deletionRange: [3,3],
      insertionLength: 2
    });
  });

  test("deleting an existing char", function (assert) {
    assert.deepEqual(simpleDiff('01223', '0123'), {
      deletionRange: [3,4],
      insertionLength: 0
    });
    assert.deepEqual(simpleDiff('012223', '0123'), {
      deletionRange: [3,5],
      insertionLength: 0
    });
  });


})();


