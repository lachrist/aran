({
  begin: function (serial) {
    self.depth = "";
    Function.prototype.toString = function () {
      return this.name || "anonymous";
    };
  },
  apply: function (strict, closure, values, serial) {
    console.log(depth+closure+"@"+serial+"("+values.join(", ")+")\n");
    depth += ".";
    const context = strict ? undefined : self;
    const result = Reflect.apply(closure, context, values);
    depth = depth.substring(1);
    console.log(depth+result+"\n");
    return result;
  }
})