(function () {
  this._meta_ = {};
  _meta_.apply = function (f, t, xs) {
    console.log("Apply "+f.name);
    return f.apply(t, xs);
  };
} ());