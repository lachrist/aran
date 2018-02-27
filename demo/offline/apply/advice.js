({
  begin: function (serial) {
    self.depth = "";
    Function.prototype.toString = function () {
      return this.name || "anonymous";
    };
  },
  apply: function (closure, strict, values, serial) {
    postMessage(depth+closure+"@"+serial+"("+values.join(", ")+")\n");
    depth += ".";
    const context = strict ? undefined : global;
    const result = Reflec.apply(closure, context, values);
    depth = depth.substring(1);
    postMessage(depth+result+"\n");
    return result;
  }
})