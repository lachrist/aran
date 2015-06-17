
(function () {
  var o = {a:1}
  var x
  with (o) {
    if (delete x) { throw 'IdentifierDelete1' }
    if (! delete a) { throw 'IdentifierDelete2' }
    if (! delete a$strange$id) { throw 'IdentifierDelete3' }
  }
  if ('a' in o) { throw 'IdentifierDelete4' }
} ())
