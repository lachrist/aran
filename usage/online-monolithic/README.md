
# Online Monolithic Instrumentation

A convenient way to solve the issues exposed in [offline-monolithic](../offline-monolithic) is to make the instrumentation happens on the same process as the analysis of the target program.
In this case, online instrumentation enables the `eval` trap to instrument dynamic code during the analysis and the `apply` trap to access the code location where the call occurred:

```js
var Aran = require("../../main.js");
var evalID = 0;
var fs = require("fs");
global._meta_ = {};
_meta_.eval = function (x, i) { return aran.instrument(x, "eval"+(++evalID)) };
_meta_.apply = function (f, t, xs, i) {
  var node = aran.node(i);
  console.log("Apply "+f.name+" at "+aran.source(i)+"#"+node.loc.start.line);
  return f.apply(t, xs);
};
var aran = Aran("_meta_");
var target = fs.readFileSync(__dirname+"/../target/monolithic.js", "utf8");
var program = Esprima.parse(target, {loc:true});
global.eval(aran.instrument(program, Object.keys(_meta_));
```

The method `aran.node` look for an [AST](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API) node at the given index.
The `loc` option given to `Aran` tells the underlying [Esprima](http://esprima.org/) parser to assign code location to AST nodes.
The second argument given to `aran.instrument` is the source of the script and is associated to all its nodes through the function `aran.source`.
Executing this last script in Node produces the below log:

```
Apply solve at target.js#7
Apply delta at target.js#3
Apply sqrt at target.js#3
Apply delta at target.js#4
Apply sqrt at target.js#4
```

It should be clear now that Aran is not meant to be directly applicable to real-world applications since it does not care about module systems.
Modules systems should be supported by third party modules as demonstrated in [online-modular](../online-modular).
