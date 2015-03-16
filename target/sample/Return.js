
(function () {
  function f () {
    return
    throw 'Return1'
  }
  if (f() !== undefined) { throw 'Return2'}
} ())
