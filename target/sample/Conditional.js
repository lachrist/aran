
(function () {
  if ((true?1:2) !== 1) { throw 'Conditional1' }
  if ((false?1:2) !== 2) { throw 'Conditional2' }
} ())
