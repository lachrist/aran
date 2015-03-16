
(function () {
  var o = {a:1}
  if (o.a++ !== 1) { throw 'MemberUpdate1' }
  if (++o.a !== 3) { throw 'MemberUpdate2' }
} ())
