# Aran <img src="aran.png" align="right" alt="aran-logo" title="Aran Linvail"/>

Aran is a npm module for instrumenting JavaScript code which enables amongst other things: profiling, tracing, sandboxing, and symbolic execution. Aran performs a source-to-source code transformation fully compatible with ECMAScript5 specification (see http://www.ecma-international.org/ecma-262/5.1/) and we are working toward supporting ECMAScript6 (see http://www.ecma-international.org/ecma-262/6.0/). To install, run `npm install aran`.

The snippet below demonstrate the usage of Aran.
First a target JavaScript code is being instrumented using `Aran.compile`.
The analysis code is then generated as the concatenation of:
  1. `Aran.setup` which defines the global variable `aran`.
  2. `master` which should provide the implementation of the traps indicated to `Aran.compile`.
  3. `instrumented` which is the instrumented target.

```javascript
var Aran = require('aran');
var target = [
  'function delta (a, b, c) { return  b * b - 4 * a * c}',
  'function solve (a, b, c) {',
  '  var sol1 = ((-b) + Math.sqrt(delta(a, b, c))) / (2 * a);',
  '  var sol2 = ((-b) - Math.sqrt(delta(a, b, c))) / (2 * a);',
  '  return [sol1, sol2];',
  '}',
  'solve(1, -5, 6);',
].join('\n');
var instrumented = Aran.compile({loc:true, traps:['ast', 'apply']}, target);
var master = [
  'var ast;',
  'aran.traps = {',
  '  ast: function (x, i) { ast = x },',
  '  apply: function (f, t, xs, i) {',
  '    console.log("apply "+f.name+" at line "+aran.fetch(ast, i).loc.start.line);',
  '    return f.apply(t, xs);',
  '  }',
  '};'
].join('\n');
var analysis = [Aran.setup, master, instrumented].join('\n');
eval(analysis);
```

```
apply solve at line 7
apply delta at line 3
apply sqrt at line 3
apply delta at line 4
apply sqrt at line 4
[ 3, 2 ]
```
