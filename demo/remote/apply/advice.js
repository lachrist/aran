({
  begin: function (serial) {
    (function () {
      this.depth = "";
      this.global = this;
    } ());
    Function.prototype.toString = function () {
      return this.name || "anonymous";
    };
  },
  apply: function (strict, callee, values, serial) {
    console.log(depth+callee+"@"+serial+"("+values.join(", ")+")");
    depth += ".";
    const value = strict ? undefined : global;
    const result = Reflect.apply(callee, value, values);
    depth = depth.substring(1);
    console.log(depth+result);
    return result;
  }
})