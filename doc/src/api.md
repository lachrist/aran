---
layout: default
title: API
---

# API

![Aran's flowchart](/assets/flowchart.png)

Aran simplifies the instrumentation of JavaScript code by transpiling it into a minimal variant called [AranLang](/typedoc/modules/lang_syntax.html). Instrumentation is performed on AranLang before transpiling it back to JavaScript. Aran provides the following functions:

- [`setupile`](/page/typedoc/functions/index.setupile.html): Generates a setup program (JavaScript) that should be evaluated before any AranLang program. This requirement can be removed by setting `conf.mode` of `retropile` to `"standalone"` instead of `"normal"`. The standalone mode works only with single-source programs.
- [`transpile`](/typedoc/functions/index.transpile.html): Transpile an JavaScript program to AranLang.
- [`weaveStandard`](/typedoc/functions/index.weaveStandard.html): Weave a [standard aspect](/typedoc/types/weave_standard_aspect.AspectTyping.html) into an AranLang program.
- [`weaveFlexible`](/typedoc/functions/index.weaveFlexible.html): Weave a [flexible aspect](https://lachrist.github.io/aran/page/typedoc/types/weave_flexible_aspect.AspectTyping.html)
  into an AranLang program.
- [`retropile`](/typedoc/functions/index.retropile.html): Transpile an AranLang program back to JavaScript.
- [`instrument`](/typedoc/functions/index.instrument.html): Instrument a JavaScript program by chaining: `transpile`, `weaveStandard`, and
  `retropile`.
