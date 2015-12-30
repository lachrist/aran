# Aran <img src="aran.png" align="right" alt="aran-logo" title="Aran Linvail"/>

Aran is a npm module for instrumenting JavaScript code which enables amongst other things: profiling, tracing, sandboxing, and symbolic execution. Aran performs a source-to-source code transformation fully compatible with ECMAScript5 specification (see http://www.ecma-international.org/ecma-262/5.1/) and we are working toward supporting ECMAScript6 (see http://www.ecma-international.org/ecma-262/6.0/). To install, run `npm install aran`.

In Aran, an analysis consists in a set of syntactic traps that will be triggered while the program under scrutiny is being executed.
For instance, the expression `x + y` may be transformed into `aran.traps.binary('+', x, y)` which triggers the `binary` trap.
Below we demonstrate how to analyze a monolithic JavaScript program using Aran.

1. The file `target.js` is a monolithic JavaScript program that we want to analyze:

  ```javascript
  // target.js //
  function delta (a, b, c) { return  b * b - 4 * a * c}
  function solve (a, b, c) {
    var sol1 = ((-b) + Math.sqrt(delta(a, b, c))) / (2 * a);
    var sol2 = ((-b) - Math.sqrt(delta(a, b, c))) / (2 * a);
    return [sol1, sol2];
  }
  solve(1, -5, 6);
  ```

2. The file `analysis.js` provides an implementation of the syntactic traps to the predefined global variable `aran`:

  ```javascript
  // analysis.js //
  (function () {
    var ast;
    aran.traps = {};
    aran.traps.ast = function (x, i) { ast = x };
    aran.traps.apply = function (f, t, xs, i) {
      var node = aran.fetch(ast, i);
      console.log("apply "+f.name+" at line "+node.loc.start.line);
      return f.apply(t, xs);
    };
  } ());
  ```

3. The file `main.js` creates `__target__.js` as the concatenation of (*i*) `Aran.setup` which defines the global variable `aran` (*ii*) `analysis` which is the content of `analysis.js` (*iii*) `instrumented` which is the result of instrumenting `target.js`. Note that `Aran.instrument` expects an array of traps that should be inserted in the target code.

  ```javascript
  // main.js //
  var fs = require('fs');
  var Aran = require('aran');
  var target = fs.readFileSync(__dirname+'/target.js', {encoding:'utf8'});
  var instrumented = Aran.instrument({loc:true, traps:['ast', 'apply']}, target);
  var analysis = fs.readFileSync(__dirname+'/master.js', {encoding:'utf8'});
  fs.writeFileSync(__dirname+'/__target__.js', [Aran.setup, analysis, instrumented].join('\n'));
  ```

In ECMAScript5-compatible JavaScript environments, evaluating the code in `__target__.js` will produce the following log: 

```
apply solve at line 7
apply delta at line 3
apply sqrt at line 3
apply delta at line 4
apply sqrt at line 4
```

A GUI version of this demonstration is available [here](http://rawgit.com/lachrist/aran/master/glitterdust/demo.html).

<img src="demo.png" align="center" alt="demo-screenshot" title="Aran's demonstration page"/>
