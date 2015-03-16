
(function () {
  var o = {
    f:function () { if (this!==o) { throw 'This' } }
  }
  o.f()
} ())
