
var parseInt = global.parseInt;

exports.flaten = function (array1) {
  var result=[];
  var index1 = 0;
  var length1 = array1.length;
  while (index1 < length1) {
    var array2 = array1[index1++];
    var index2 = 0;
    var length2 = array2.length;
    while (index2 < length2) {
      result[result.length] = array2[index2++];
    }
  }
  return result;
};

exports.prefix = function (array1, array2) {
  var index1 = 0;
  var length1 = array1.length;
  while (index1 < length1) {
    if (array1[index1] !== array2[index1++]) {
      return false;
    }
  }
  return true;
}

exports.concat = function () {
  var result=[];
  var index1 = 0;
  var length1 = arguments.length;
  while (index1 < length1) {
    var array2 = arguments[index1++];
    var index2 = 0;
    var length2 = array2.length;
    while (index2 < length2) {
      result[result.length] = array2[index2++];
    }
  }
  return result;
};

exports.any = function (array, predicate) {
  var index = 0;
  var length = array.length;
  while (index < length) {
    if (predicate(array[index], index++, array)) {
      return true
    }
  }
  return false;
};

exports.all = function (array, predicate) {
  var index = 0;
  var length = array.length;
  while (index < length) {
    if (!predicate(array[index], index++, array)) {
      return false;
    }
  }
  return true;
};

exports.contain = function (array, element) {
  var index = 0;
  var length = array.length;
  while (index<length) {
    if (array[index++] === element) {
      return true
    }
  }
  return false;
};

exports.map = function (array, transform) {
  var result = [];
  var index = 0;
  var length = array.length;
  while (index < length) {
    result[index] = transform(array[index], index++, array);
  }
  return result;
};

exports.zipmap = function (array, transformers) {
  var result = [];
  var index = 0;
  var length = array.length;
  while (index < length) {
    var transform = transformers[index];
    result[index] = transform ? transform(array[index], index++, array) : array[index++];
  }
  return result;
};

exports.filter = function (array, predicate) {
  var result = [];
  var index = 0;
  var length = array.length;
  while (index < length) {
    if (predicate(array[index], index, array)) {
      result[result.length] = array[index++];
    } else {
      index++;
    }
  }
  return result;
};

exports.each = function (array, procedure) {
  var index = 0;
  var length = array.length;
  while (index < length) {
    procedure(array[index], index++, array);
  }
};

exports.reduce = function (array, accumulator, result) {
  var index = 0;
  var length = array.length;
  while (index < length) {
    result = accumulator(result, array[index], index++, array);
  }
  return result;
}

exports.last = function (array) {
  return array[array.length-1];
};

exports.slice = function (array, index, length) {
  var result = [];
  index = parseInt(index);
  if (index !== index || index < 0) {
    index = 0;
  }
  length = parseInt(length);
  if (length !== length || length > array.length) {
    length = array.length
  }
  while (index < length) {
    result[result.length] = array[index++];
  }
  return result;
};
