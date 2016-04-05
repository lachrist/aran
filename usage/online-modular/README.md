
# Online Modular Instrumentation

We use [Otiluke](https://github.com/lachrist/otiluke) to demonstrate how Aran can be used to analyze modular programs.
When using Otiluke, an analysis consists in a node module which exports an instrumentation function.
This module will be executed along the program under analysis and the exported instrumentation function will be called on all its sources.

```javascript
var Aran = require("../../main.js");

function location (index) {
  var node = aran.search(index);
  for (var root = node; root.parent; root = root.parent);
  return root.source + "#" + node.loc.start.line + ":" + node.loc.start.column;
}

global.__hidden__ = {};
__hidden__.eval = function (x, i) { return aran.instrument(x, "eval") };
__hidden__.apply = function (f, t, xs, i) {
  console.log("Apply " + f.name + " @ " + location(i));
  return f.apply(t, xs);
};

var aran = Aran({namespace:"__hidden__", traps:Object.keys(__hidden__), loc:true});

module.exports = aran.instrument;
```

## Online Instrumentation of Node module

Otiluke requires two information to transform node modules: the analysis module described above and the entry point of the node module under analysis:

```javascript
require("otiluke").node({transform:"./analysis.js", main:"../target/commonjs/main.js"});
```

Alternatively, if Otiluke is installed globally, you can run:

```
otiluke --node --transform ./analysis.js --main ../target/commonjs/main.js
```

This command produces the following log on my machine:

```
Apply require @ /Users/soft/Desktop/workspace/aran/usage/target/node/main.js#1:12
Apply require @ /Users/soft/Desktop/workspace/aran/usage/target/node/solve.js#1:12
Apply solve @ /Users/soft/Desktop/workspace/aran/usage/target/node/main.js#2:0
Apply delta @ /Users/soft/Desktop/workspace/aran/usage/target/node/solve.js#3:29
Apply sqrt @ /Users/soft/Desktop/workspace/aran/usage/target/node/solve.js#3:19
Apply delta @ /Users/soft/Desktop/workspace/aran/usage/target/node/solve.js#4:29
Apply sqrt @ /Users/soft/Desktop/workspace/aran/usage/target/node/solve.js#4:19
```

## Online Instrumentation of Web Pages

Otiluke can also deploy a proxy that acts as a [man-in-the-middle](https://en.wikipedia.org/wiki/Man-in-the-middle_attack).
Once your browser is configured according to [Otiluke's readme](https://github.com/lachrist/otiluke), you can deploy the proxy with:

```javascript
require("otiluke").mitm({transform:"./analysis.js", port:8080});
```

Alternatively, if Otiluke is installed globally, you can run:

```
otiluke --mitm --transform ./analysis.js --port 8080
```

Now, all browser's requests will be intercepted so that the analysis is run along the web page under analysis.
For testing purpose, you can serve the files of `target/html`; for instance:

```
http-server ../target/html -p 8000
```

Visiting `http://127.0.0.1:8000` produces should then produce the following log:

```
Apply solve @ http://127.0.0.1:8000/#156#2:6
Apply delta @ http://127.0.0.1:8000/solve.js#2:29
Apply sqrt @ http://127.0.0.1:8000/solve.js#2:19
Apply delta @ http://127.0.0.1:8000/solve.js#3:29
Apply sqrt @ http://127.0.0.1:8000/solve.js#3:19
```
