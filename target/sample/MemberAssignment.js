
(function () {
  var o = {}
  o.a = 1
  if (o.a !== 1) { throw 'MemberAssignment1' }
  o.a += 2
  if (o.a !== 3) { throw 'MemberAssignment2' }
} ())
