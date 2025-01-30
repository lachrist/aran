# Aran <img src="img/aran.png" align="right" alt="aran-logo" title="Aran Linvail the shadow master"/>

Aran is a [npm module](https://www.npmjs.com/package/aran) for instrumenting
JavaScript code. Aran was designed as a generic infrastructure for building
various development-time dynamic program analyses such as: object and function
profiling, debugging, control-flow tracing, taint analysis, and concolic
testing. Aran is a JavaScript library without any dependencies that only exports
functions for manipulating [estree](https://github.com/estree/estree). Hence,
additional work is required to deploy program analysis onto projects.

**Disclaimer:** Aran started as an academic research project and is used at
[SOFT lab](http://soft.vub.ac.be/soft/) to support publications and run
experiments. Aran provides extensive support for ECMAScript2024 and achieves a
99.7% success rate against [test262](https://github.com/tc39/test262). However,
it has rarely been used to instrument large-scale programs and performance
overhead may cause issues when analyzing time-sensitive programs.

## Getting Started

Aran can be installed with `npm install aran`. Since Aran exclusively
manipulates [estree](https://github.com/estree/estree), it requires both a
parser and a code generator to function. We recommend using
[acorn](https://www.npmjs.com/package/acorn) as the parser and
[astring](https://www.npmjs.com/package/astring) as the code generator. Below is
a minimal working example demonstrating the use of `acorn.parse`,
`aran.instrument`, and `astring.generate`:

```sh
npm install aran acorn astring
```

```js
import { generate } from "astring";
import { parse } from "acorn";
import { instrument } from "aran";

globalThis._ARAN_ADVICE_ = {
  "apply@around": (_state, callee, this_arg, args, location) => {
    console.dir({ callee, this_arg, args, location });
    return Reflect.apply(callee, this_arg, args);
  },
};

globalThis.eval(
  generate(
    instrument(
      {
        kind: "eval",
        path: "main",
        root: parse("console.log('Hello!');", { ecmaVersion: 2024 }),
      },
      {
        mode: "standalone",
        advice_global_variable: "_ARAN_ADVICE_",
        pointcut: ["apply@around"],
      },
    ),
  ),
);
```

```
{
  callee: [Function: readGlobalVariable],
  this_arg: undefined,
  args: [ 'console' ],
  location: 'main#$.body.0.expression.callee.object'
}
{
  callee: [Function: getValueProperty],
  this_arg: undefined,
  args: [
    Object [console],
    'log'
  ],
  location: 'main#$.body.0.expression.callee'
}
{
  callee: [Function: log],
  this_arg: Object [console],
  args: [ 'Hello!' ],
  location: 'main#$.body.0.expression'
}
Hello!
```

## Live Demo

[live-demo](https://lachrist.github.io/aran/page/demo/index.html)

## API

[typedoc](https://lachrist.github.io/aran/page/typedoc/modules/index.html)

![Aran's flowchart](img/flowchart.png)

Aran simplifies the instrumentation of JavaScript code by transpiling it into a
minimal variant called
[AranLang](https://lachrist.github.io/aran/page/typedoc/modules/lang_syntax.html).
Instrumentation is performed on AranLang before transpiling it back to
JavaScript. Aran provides the following functions:

- [`setupile`](https://lachrist.github.io/aran/page/typedoc/functions/index.setupile.html):
  Generates a setup program (JavaScript) that should be evaluated before any
  AranLang program. This requirement can be removed by setting `conf.mode` of
  `retropile` to `"standalone"` instead of `"normal"`. The standalone mode works
  only with single-source programs.
- [`transpile`](https://lachrist.github.io/aran/page/typedoc/functions/index.transpile.html):
  Transpile an JavaScript program to AranLang.
- [`weaveStandard`](https://lachrist.github.io/aran/page/typedoc/functions/index.weaveStandard.html):
  Weave a
  [standard aspect](https://lachrist.github.io/aran/page/typedoc/types/weave_standard_aspect.AspectTyping.html)
  into an AranLang program.
- [`weaveFlexible`](https://lachrist.github.io/aran/page/typedoc/functions/index.weaveFlexible.html):
  Weave a
  [flexible aspect](https://lachrist.github.io/aran/page/typedoc/types/weave_flexible_aspect.AspectTyping.html)
  into an AranLang program.
- [`retropile`](https://lachrist.github.io/aran/page/typedoc/functions/index.retropile.html):
  Transpile an AranLang program back to JavaScript.
- [`instrument`](https://lachrist.github.io/aran/page/typedoc/functions/index.instrument.html):
  Instrument a JavaScript program by chaining: `transpile`, `weaveStandard`, and
  `retropile`.

## Known Issues

Beside performance overhead, Aran has some known issues that may cause
instrumented programs to no behave as their pre-instrumented version.

- [Corrupt error stack](./doc/issues/corrupt-error-stack.md)
- [Corrupt function string representation](./doc/issues/corrupt-function-string-representation.md)
- [Duplicate super prototype access](./doc/issues/duplicate-super-prototype-access.md)
- [Early module declaration](./doc/issues/early-module-declaration.md)
- [Early script declaration](./doc/issues/early-script-declaration.md)
- [Internal deep eval declaration](./doc/issues/internal-deep-eval-declaration.md)
- [Missing iterable return call in pattern](./doc/issues/missing-iterable-return-call-in-pattern.md)
- [No arguments two-way binding](./doc/issues/no-arguments-two-way-binding.md)
- [No dynamic function property](./doc/issues/no-dynamic-function-property.md)
- [Path membrane break local eval](./doc/issues/patch-membrane-break-local-eval.md)
- [Weave membrane miss deep eval](./doc/issues/weave-membrane-miss-deep-eval.md)
- [Wrong realm for default prototype](./doc/issues/wrong-realm-for-default-prototype.md)
- [Wrong this parameter in with in eval](./doc/issues/wrong-this-parameter-in-with-in-eval.md)

Most of these issues requires fairly convoluted code to arise. In practice, the
issue that is most susceptible to cause a program to behave differentially is
[early script declaration](./doc/issues/early-script-declaration.md).

## Acknowledgments

I'm [Laurent Christophe](https://soft.vub.ac.be/soft/members/lachrist) a phd
student at the [Vrij Universiteit of Brussel](https://www.vub.ac.be). My
promoters are [Coen De Roover](https://soft.vub.ac.be/soft/members/cderoove) and
[Wolfgang De Meuter](https://soft.vub.ac.be/soft/members/wdmeuter).

![vub](img/vub.png) ![soft](img/soft.png) ![tearless](img/tearless.png)
