
exports.join = function (array, separator) {
  if (array.length === 0)
    return "";
  var last = array.length-1;
  var index = 0;
  var result = "";
  while (index < last) {
    result += array[index++] + separator; 
  }
  return result + array[last];
};

exports.flaten = function (array1) {
  var result = [];
  var length = 0
  var index1 = 0;
  var length1 = array1.length;
  while (index1 < length1) {
    var array2 = array1[index1++];
    var index2 = 0;
    var length2 = array2.length;
    while (index2 < length2) {
      result[length++] = array2[index2++];
    }
  }
  return result;
};

exports.concat = function () {
  var result = [];
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

exports.some = function (array, predicate) {
  var index = 0;
  var length = array.length;
  while (index < length) {
    if (predicate(array[index], index++, array)) {
      return true
    }
  }
  return false;
};

exports.every = function (array, predicate) {
  var index = 0;
  var length = array.length;
  while (index < length) {
    if (!predicate(array[index], index++, array)) {
      return false;
    }
  }
  return true;
};

exports.includes = function (array, element) {
  var index = 0;
  var length = array.length;
  while (index<length) {
    if (array[index++] === element) {
      return true
    }
  }
  return false;
};

exports.reverse = function (array) {
  var index = array.length-1;
  var result = [];
  var length = 0;
  while (index >= 0) {
    result[length++] = array[index--];
  }
  return result;
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

exports.flatenMap = function (array1, transform) {
  var result = [];
  var length = 0;
  var index1 = 0;
  var length1 = array1.length;
  while (index1 < length1) {
    var array2 = transform(array1[index1], index1++, array1);
    var index2 = 0;
    var length2 = array2.length;
    while (index2 < length2) {
      result[length++] = array2[index2++];
    }
  }
  return result;
}

exports.zipMap = function (array, transformers) {
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

exports.forEach = function (array, procedure) {
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
};

exports.indexOf = function (array, value) {
  var index = 0;
  var length = array.length;
  while (index < length) {
    if (array[index] === value) {
      return index;
    }
    index++;
  }
  return -1;
};

exports.find = function (array, predicate) {
  var index = 0;
  var length = array.length;
  while (index < length) {
    if (predicate(array[index], index, array)) {
      return array[index];
    }
    index++;
  }
};

exports.findIndex = function (array, predicate) {
  var index = 0;
  var length = array.length;
  while (index < length) {
    if (predicate(array[index], index, array)) {
      return index;
    }
    index++
  }
  return -1;
}

exports.lastIndexOf = function (array, value) {
  var index = array.length-1;
  while (index >= 0) {
    if (array[index] === value) {
      return index;
    }
    index--;
  }
  return -1;
};

exports.slice = function (array, index, length) {
  var result = [];
  if (!index) {
    index = 0;
  }
  if (!length || length > array.length) {
    length = array.length
  }
  while (index < length) {
    result[result.length] = array[index++];
  }
  return result;
};
