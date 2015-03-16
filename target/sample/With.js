
(function () {
  with ({a:1}) {
    if (a!==1) { throw 'With' }
  }
} ())
