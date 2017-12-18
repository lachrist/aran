
// High-performance array flatening...
// Why? Because I can!

module.exports = function () {
  var array = [];
  var length = 0;
  var length1 = arguments.length;
  for (var index1=0; index1<length1; index1++) {
    var argument = arguments[index1];
    var length2 = argument.length;
    for (var index2=0; index2<length2; index2++) {
      array[length++] = argument[index2];
    }
  }
  return array;
};
