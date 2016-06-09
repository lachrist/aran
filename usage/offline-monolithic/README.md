
# Offline Monolithic Instrumentation

In offline instrumentation, the analysis consists in declaring a global variable, here arbitrarly named `__hidden__`.
It is best to choose a variable name that is unlikely to be accessed by the program under analysis.
This global variable refers to an object containing the traps that will be called during the analysis.
Here, the only implemented trap is `apply` which is triggered on function calls.

```javascript
(function () {
  this.__hidden__ = {};
  __hidden__.apply = function (f, t, xs) {
    console.log("Apply " + f.name);
    return f.apply(t, xs);
  };
} ());
```

To perform instrumentation, Aran needs to know the name of the global variable referencing the traps as well as the names of the traps implemented by the user.
The returned instrumentation function simply replaces language constructs with call to traps functions.
To create a standalone analysis of the target, it suffices to concatenate the analysis with the instrumented code.

```javascript
var Aran = require("../../main.js");
var fs = require("fs");
var target = fs.readFileSync(__dirname+"/../target/monolithic.js", "utf8");
var analysis = fs.readFileSync(__dirname+"/analysis.js", "utf8");
var aran = Aran({namespace:"__hidden__", traps:["apply"]});
fs.writeFileSync("./run.js", analysis + "\n" + aran.instrument(target));
```

Executing `run.js` in any compatible [ECMAScript5](http://www.ecma-international.org/ecma-262/5.1/) environment produces the following log:

```
Apply solve
Apply delta
Apply sqrt
Apply delta
Apply sqrt
```

The problem with such instrumentation process is that the analysis has no mean to communicate with the instrumentation process.
In particular the analysis does not have any information about the AST nodes that triggered its traps and it cannot dynamically instrument code when for instance the `eval` function is called.
The online instrumentation process exposed in [online-monolithic](../online-monolithic) is designed to solve these issues.
