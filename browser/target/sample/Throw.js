
(function () {
  var c = false
  var f = false
  try {
    throw 'ok'
    throw 'BOUM'
  }
  catch (e) { c = e }
  finally { f = true }
  if (c !== 'ok') { throw 'Throw1' }
  if (!f) { throw 'Throw2' }
} ())
