
(function () {
  var o = {
    a: 1,
    b: 2,
    get c () { return 1 },
    set c (v) {}
  }
  o.c=666
  if (o.c!==1) { throw 'Object' }
} ())
