
(function () {
  for (var k in {a:1}) {}
  if (k !== 'a') { throw 'DeclarationForIn' }  
} ())
