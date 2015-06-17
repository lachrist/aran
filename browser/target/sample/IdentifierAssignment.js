
(function () {
  var x
  x = 1
  if (x !== 1) { throw 'IdentifierAssignment1' }
  x += 2
  if (x !== 3) { throw 'IdentifierAssignment2' }
} ())
