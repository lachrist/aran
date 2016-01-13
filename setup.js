(function (aran) {

  if (aran.__setup__)
     return;
  aran.__setup__ = true;

  var defineProperties = Object.defineProperties;

  aran.__apply__ = function (fct, ths, args) { return fct.apply(ths, args) };
  aran.__apply__ = typeof Reflect === "undefined" ? aran.__apply__ : Reflect.apply;

  aran.__enumerate__ = function (obj) {
    var arr = [];
    for (var str in obj)
      arr[arr.length] = str;
    return arr;
  };
  aran.__enumerate__ = typeof Reflect === "undefined" ? aran.__enumerate__ : Reflect.enumerate;

  aran.__eval__ = eval;

  aran.__object__ = function (arr) {
    var obj1 = {};
    for (var i=0; i<arr.length; i++) {
      if (!obj1[arr[i][0]])
        obj1[arr[i][0]] = {enumerate:true, configurable: true}
      var obj2 = obj1[arr[i][0]];
      if (arr[i][1] === "init") {
        (delete obj2.get, delete obj2.set);
        (obj2.writable = true, obj2.value = arr[i][2]);
      } else {
        (delete obj2.writable, delete obj2.value);
        obj2[arr[i][1]] = arr[i][2];
      }
    }
    return defineProperties({}, obj1);
  }

  aran.__search__ = function (ast, idx) {
    // console.log((ast && ast.index) + " " + idx);
    // if (idx === 7 && ast && ast.type === "IfStatement")
    //   debugger;
    if (ast && typeof ast === "object") {
      if (ast.index === idx)
        return ast;
      if (!ast.index || (ast.index < idx && ast.maxIndex >= idx)) {
        for (var k in ast) {
          if (k !== "loc" && k !== "range") {
            var tmp = aran.__search__(ast[k], idx);
            if (tmp)
              return tmp;
          }
        }
      }
    }
  };

} (ARAN));