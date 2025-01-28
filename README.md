# Aran <img src="img/aran.png" align="right" alt="aran-logo" title="Aran Linvail the shadow master"/>

Aran is a [npm module](https://www.npmjs.com/package/aran) for instrumenting
JavaScript code. Aran was designed as a generic infrastructure for building
various development-time dynamic program analyses such as: objects and functions
profiling, debugging, control-flow tracing, taint analysis and concolic testing.
Aran is a JavaScript library without any dependencies that only export functions
for manipulating [estree](https://github.com/estree/estree). Hence, additional
work is required to deploy program analysis onto projects.

**Disclaimer** Aran started as an academic research project, and is used at
[SOFT lab](http://soft.vub.ac.be/soft/) to support publications and run
experiments. Aran extensively supports ECMAScript2024 and has a 99.7% success
rate against [test262](https://github.com/tc39/test262). However, it has rarely
been used to instrument large-scale programs and performance overhead may cause
issues while analyzing time-sensitive programs.

## Getting Started

Aran is a [npm module](https://www.npmjs.com/package/aran) that can be installed
as any other npm module with: `npm install aran`. The fastest way to get started
is to use the functions `aran.generateSetup` and `aran.instrument`.
`generateSetup` creates an [estree.Program](https://github.com/estree/estree)
that should be evaluated before evaluating any instrumented code.

```sh
npm install aran acorn astring
```

```js
import { generate } from "astring";
import { parse } from "acorn";
import { instrument, generateSetup } from "aran";

globalThis._ARAN_ADVICE_ = {
  "apply@around": (_state, callee, this_, arguments_, path) => {
    console.dir({ callee, this: this_, arguments: arguments_, path });
    return Reflect.apply(callee, this_, arguments_);
  },
};

globalThis.eval(generate(generateSetup()));

globalThis.eval(
  generate(
    instrument(
      {
        kind: "eval",
        root: parse("console.log('Hello!');", { ecmaVersion: 2024 }),
      },
      {
        advice_global_variable: "_ARAN_ADVICE_",
        pointcut: ["apply@around"],
      },
    ),
  ),
);
```

## API

[typedoc](https://lachrist.github.io/aran/page/typedoc/modules/index.html)

Aran simplifies the instrumentation of JavaScript code by transpiling it into a
minimal variant called AranLang. Instrumentations is performed on AranLang
before transpiling it back to JavaScript. Aran provides the following functions:

- [`generateSetup`](https://lachrist.github.io/aran/page/typedoc/functions/index.generateSetup.html):
  Creates an `estree.Program` that should be evaluated before any AranLang
  programs.
- [`transpile`](https://lachrist.github.io/aran/page/typedoc/functions/index.transpile.html):
  Transpile an AranLang program to JavaScript.
- [`weaveStandard`](https://lachrist.github.io/aran/page/typedoc/functions/index.weaveStandard.html):
  Weave a standard aspect into an AranLang program.
- [`weaveFlexible`](https://lachrist.github.io/aran/page/typedoc/functions/index.weaveFlexible.html):
  Weave a flexible aspect into an AranLang program.
- [`retropile`](https://lachrist.github.io/aran/page/typedoc/functions/index.retropile.html):
  Transpile an AranLang program back to JavaScript.
- [`instrument`](https://lachrist.github.io/aran/page/typedoc/functions/index.instrument.html):
  Chain together `transpile`, `weaveStandard` and `retropile` to instrument a
  program.

Other types of interest are:

- [AranLang](https://lachrist.github.io/aran/page/typedoc/modules/lang_syntax.html)
- [Library Interface](file:///Users/lachrist/Desktop/workspace/aran/page/typedoc/modules/index.html)
- [Standard Aspect](https://lachrist.github.io/aran/page/typedoc/types/weave_standard_aspect.AspectTyping.html)
- [Flexible Aspect](https://lachrist.github.io/aran/page/typedoc/types/weave_flexible_aspect.AspectTyping.html)

## Live Demo

[live-demo](https://lachrist.github.io/aran/page/demo/index.html)

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

In practice, the issue that is most susceptible to cause a program to behave
differentially is
[early script declaration](./doc/issues/early-script-declaration.md). Other
issues require fairly convoluted code to arise.

## Acknowledgments

I'm [Laurent Christophe](http://soft.vub.ac.be/soft/members/lachrist) a phd
student at the [Vrij Universiteit of Brussel](https://www.vub.ac.be). My
promoters are [Coen De Roover](http://soft.vub.ac.be/soft/members/cderoove) and
[Wolfgang De Meuter](http://soft.vub.ac.be/soft/members/wdmeuter).

![vub](img/vub.png) ![soft](img/soft.png) ![tearless](img/tearless.png)
