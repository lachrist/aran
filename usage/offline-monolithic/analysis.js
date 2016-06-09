(function () {
  this.__hidden__ = {};
  __hidden__.apply = function (f, t, xs) {
    console.log("Apply " + f.name);
    return f.apply(t, xs);
  };
} ());