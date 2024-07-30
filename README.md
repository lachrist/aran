# Aran <img src="img/aran.png" align="right" alt="aran-logo" title="Aran Linvail the shadow master"/>

**Version in the range 4.0.x should be considered early access**

Aran is a [npm module](https://www.npmjs.com/package/aran) for instrumenting
JavaScript code. Aran was designed as a generic infra-structure for building
various development-time dynamic program analyses such as: objects and functions
profiling, debugging, control-flow tracing, taint analysis and concolic testing.
Aran is a JavaScript library without any dependencies that only export pure code
generation functions. As such, additional work is required to actually conduct
program analyses.

**Disclaimer** Aran started as an academic research project, and is used at
[SOFT lab](http://soft.vub.ac.be/soft/) to support publications and run
experiments. Although Aran supports almost entirely ECMAScript2024 and is
well-tested against [test262](https://github.com/tc39/test262), it has been
seldomly used to instrument large-scale programs. The performance overhead and
even the increase size of the instrumented code may cause issues.

## Getting Started

Aran is a [npm module](https://www.npmjs.com/package/aran) that can be installed
as any other npm module with: `npm install aran`.

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

The issue that is most susceptible to cause a program to behave differentially
in practice is
[early script declaration](./doc/issues/early-script-declaration.md). Other
issues require fairly convoluted code to be triggered.

## Demonstrator

[https://lachrist.github.io/aran.html](https://lachrist.github.io/aran.html)

## Acknowledgments

I'm [Laurent Christophe](http://soft.vub.ac.be/soft/members/lachrist) a phd
student at the [Vrij Universiteit of Brussel](https://www.vub.ac.be). My
promoters are [Coen De Roover](http://soft.vub.ac.be/soft/members/cderoove) and
[Wolfgang De Meuter](http://soft.vub.ac.be/soft/members/wdmeuter).

![vub](img/vub.png) ![soft](img/soft.png) ![tearless](img/tearless.png)
