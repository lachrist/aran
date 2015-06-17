
(function () {
  var x = 1
  if (x++ !== 1) { throw 'IdentifierUpdate1' }
  if (++x !== 3) { throw 'IdentifierUpdate2' }
} ())
