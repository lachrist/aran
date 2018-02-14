
(function () {
  for (var i=0; i<3; i++) {}
  if (i !== 3)
    throw new Error("DeclarationFor");
} ());
