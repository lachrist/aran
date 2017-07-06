
# Online Modular Instrumentation

*Outdated!*

We use [Otiluke](https://github.com/lachrist/otiluke) to demonstrate how Aran can be used to analyze modular programs.
When using Otiluke, an analysis consists in a node module which exports an instrumentation function.
This module will be executed along the program under analysis and the exported instrumentation function will be called on all its sources.

```js
var Aran = require("../../main.js");
module.exports = function (options) {
  function location (index) {
    var node = aran.node(index);
    return aran.source(index) + "#" + node.loc.start.line + ":" + node.loc.start.column;
  }
  var evalID = 0;
  global._meta_ = {};
  _meta_.eval = function (x, i) { return aran.instrument(x, "eval"+(++evalID)) };
  _meta_.apply = function (f, t, xs, i) {
    options.log("Apply " + f.name + " @ " + location(i));
    return f.apply(t, xs);
  };
  var aran = Aran({namespace:"_meta_", traps:Object.keys(_meta_), loc:true});
  return aran.instrument;
};
```

For the rest, it is assumed that [Otiluke](https://github.com/lachrist/otiluke) is accessible from this directory. 

## Online Instrumentation of Node module

Otiluke requires two information to transform node modules: the analysis module described above and the entry point of the node module under analysis:

```js
require("otiluke").node({transpile:"./analysis.js", main:"../target/commonjs/main.js"});
```

Alternatively, if Otiluke is installed globally, you can run:

```
otiluke --node --transpile ./analysis.js --main ../target/commonjs/main.js
```

If things run as expected, this command produces the following log on your machine:

```
Apply require @ /Users/soft/Desktop/workspace/aran/usage/target/commonjs/main.js#1:12
Apply require @ /Users/soft/Desktop/workspace/aran/usage/target/commonjs/solve.js#1:12
Apply solve @ /Users/soft/Desktop/workspace/aran/usage/target/commonjs/main.js#2:0
Apply delta @ /Users/soft/Desktop/workspace/aran/usage/target/commonjs/solve.js#3:29
Apply sqrt @ /Users/soft/Desktop/workspace/aran/usage/target/commonjs/solve.js#3:19
Apply delta @ /Users/soft/Desktop/workspace/aran/usage/target/commonjs/solve.js#4:29
Apply sqrt @ /Users/soft/Desktop/workspace/aran/usage/target/commonjs/solve.js#4:19
```

## Online Instrumentation of Web Pages

Otiluke can also deploy a proxy that acts as a [man-in-the-middle attack](https://en.wikipedia.org/wiki/Man-in-the-middle_attack).
Once your browser is configured according to [Otiluke's readme](https://github.com/lachrist/otiluke), you can deploy the proxy with:

```js
require("otiluke").mitm({transpile:"./analysis.js", port:8080});
```

Alternatively, if Otiluke is installed globally, you can run:

```
otiluke --mitm --transpile ./analysis.js --port 8080
```

Now, all browser's requests will be intercepted so that the analysis is run along the web page under analysis.
For testing purpose, you can serve the files of [../target/html](../target/html); for instance:

```
http-server ../target/html -p 8000
```

If things are correctly setup, visiting `http://127.0.0.1:8000` should produce the following log:

```
Apply solve @ http://127.0.0.1:8000/index.html#156#2:6
Apply delta @ http://127.0.0.1:8000/solve.js#2:29
Apply sqrt @ http://127.0.0.1:8000/solve.js#2:19
Apply delta @ http://127.0.0.1:8000/solve.js#3:29
Apply sqrt @ http://127.0.0.1:8000/solve.js#3:19
```
