
(function () {

  aran.fetch = function (ast, idx) {
    if (ast.index === idx)
      return ast;
    var childs = aran.childs[ast.type](ast);
    for (var i=0; i<childs.length; i++)
      if (idx >= childs[i].index && idx <= childs[i].maxIndex)
        return aran.fetch(childs[i], idx);
  };

} ());
