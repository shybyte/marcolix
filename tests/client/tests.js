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
    testDiv.innerHTML = '<span>test</span>';
    removeMarkings(testDiv);
    assert.equal(testDiv.innerHTML, 'test');
  });

  test("Nested markings", function (assert) {
    testDiv.innerHTML = '<span><span>test</span></span>';
    removeMarkings(testDiv);
    assert.equal(testDiv.innerHTML, 'test');
  });

  test("Multiple children inside of the marking", function (assert) {
    testDiv.innerHTML = '<span>test1 <span>test2</span> test3</span>';
    removeMarkings(testDiv);
    assert.equal(testDiv.innerHTML, 'test1 test2 test3');
  });

})();


