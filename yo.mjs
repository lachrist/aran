var returnCount = 0;
var unreachable = 0;
var iterable = {};
var iterator = {
  return: function () {
    returnCount += 1;
    throw "BOUM";
  },
};
var iter;
iterable[Symbol.iterator] = function () {
  return iterator;
};

function* g() {
  var result;
  var vals = iterable;

  result = [{}[yield]] = vals;

  unreachable += 1;
}

iter = g();
iter.next();
iter.return();
