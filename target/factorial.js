
function facrec (n) {
  if (n === 0) { return 1 }
  return n * facrec(n-1)
}

function faciter (n, prod) {
  if (n === 0) { return prod }
  return faciter (n-1, n*prod)
}

function facloop (n) {
  var prod = 1
  while (n) {
    prod *= n
    n--
  }
  return prod
}

var x
if ((x=facrec(6)) !== 720) { throw new Error("factorial failure, got: "+x) }
if ((x=faciter(6)) !== 720) { throw new Error("factorial failure, got: "+x) }
if ((x=facloop(6)) !== 720) { throw new Error("factorial failure, got: "+x) }
