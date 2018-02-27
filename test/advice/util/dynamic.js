
const $eval = global.eval;
const Function_prototype = Function.prototype;

exports.Function = (join) => {
  const Function = function Function () {
    if (arguments.length === 0) {
      var script = "(function anonymous() {\n\n})";
    } else if (arguments.length === 1) {
      var script = "(function anonymous() {\n"+arguments[0]+"\n})";
    } else {
      var script = "(function anonymous("+arguments[0];
      for (let index=1, last = arguments.length-1; index < last; index++)
        script += ","+arguments[index];
      script += "\n/*``*/){\n"+arguments[arguments.length-1]+"\n})";
    }
    return $eval(join(script, null));
  };
  Function_prototype.constructor = Function;
  Function.prototype = Function_prototype;
  return Function;
};

exports.eval = (join) => function eval (script) {
  return $eval(join(script));
};
