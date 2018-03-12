({
  begin: function (serial) {
    self.depth = "";
    Function.prototype.toString = function () {
      return this.name || "anonymous";
    };
  },
  apply: function (strict, closure, values, serial) {
    postMessage(depth+closure+"@"+serial+"("+values.join(", ")+")\n");
    depth += ".";
    const context = strict ? undefined : global;
    const result = Reflect.apply(closure, context, values);
    depth = depth.substring(1);
    postMessage(depth+result+"\n");
    return result;
  }
})