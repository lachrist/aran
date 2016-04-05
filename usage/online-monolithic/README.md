
# Online Monolithic Instrumentation

A convenient way to solve the issues exposed in [offline-monolithic](../offline-monolithic) is to make the instrumentation happens on the same process as the analysis of the target program.
In this case, online instrumentation enables the `eval` trap to instrument dynamic code during the analysis and the `apply` trap to access the code location where the call occured:

```javascript
var Aran = require("../../main.js");
var evalID = 0;
var fs = require("fs");
global.__hidden__ = {};
__hidden__.eval = function (x, i) { return aran.instrument(x, "eval#"+(++evalID)) };
__hidden__.apply = function (f, t, xs, i) {
  var node = aran.search(i);
  console.log("Apply " + f.name + " at line " + node.loc.start.line);
  return f.apply(t, xs);
};
var aran = Aran({namespace:"__hidden__", traps:Object.keys(__hidden__), loc:true});
var target = fs.readFileSync(__dirname+"/../target/monolithic.js", "utf8");
global.eval(aran.instrument(target));
```

The method `aran.search` look for an [AST](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API) node at the given index.
The `loc` option given to `Aran` tells the underlying [Esprima](http://esprima.org/) parser to assign code location to AST nodes.
Executing this last script in Node produces the below log:

```
Apply solve at line 8
Apply delta at line 4
Apply sqrt at line 4
Apply delta at line 5
Apply sqrt at line 5
```

Note that Aran can be ported to browsers using bundling libraries such as [Browserify](http://browserify.org/).
Note that Aran's is not meant to be directly applicable to real-world applications since it does not care about module systems.
Modules systems should be supported by third party module as demonstrated in [online-modular](../online-modular).
