
(function () {
  var o = {};
  function F () { return o }
  if (new F() !== o)
    throw new Error("New");
} ());
