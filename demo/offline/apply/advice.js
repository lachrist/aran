({
  begin: function (ser) {
    self.depth = "";
    Function.prototype.toString = function () {
      return this.name || "anonymous";
    };
  },
  apply: function (closure, values, serial) {
    postMessage(depth+closure+"@"+serial+"("+values.join(", ")+")\n");
    depth += ".";
    const result = closure(...values);
    depth = depth.substring(1);
    postMessage(depth+result+"\n");
    return result;
  }
})