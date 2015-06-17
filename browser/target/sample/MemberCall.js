
(function () {
  var o = {
    f: function () { if (this !== o) { throw 'MemberCall' } }
  }
  o.f()
} ())
