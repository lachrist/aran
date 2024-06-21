// global.eval(`
(function () {
  var x = 1;
  var innerX = (function () {
    x ^= (eval("var x = 2;"), 4);
    return x;
  })();
  throw new Error(JSON.stringify({ innerX, x }));
})();
// `);

innerX 2
x 5


(function () {
  var x = 3;
  var innerX = (function() {
    x *= (eval("var x = 2;"), 4);
    return x;
  })();
  console.log({innerX, x});
  // if (innerX !== 2) {
  //   throw new Test262Error('#1: innerX === 2. Actual: ' + (innerX));
  // }
  // if (x !== 12) {
  //   throw new Test262Error('#2: x === 12. Actual: ' + (x));
  // }
} ());
