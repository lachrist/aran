---
layout: default-title
title: API
---

![Aran's flowchart](/aran/assets/flowchart.png)

Aran simplifies the instrumentation of JavaScript code by transpiling it into a minimal variant called [AranLang](/aran/typedoc/modules/lang_syntax.html). Instrumentation is performed on AranLang before transpiling it back to JavaScript. Aran provides the following functions:

- [`setupile`](/aran/typedoc/functions/index.setupile.html): Generates a setup program (JavaScript) that should be evaluated before any AranLang program. This requirement can be removed by setting `conf.mode` of `retropile` to `"standalone"` instead of `"normal"`. The standalone mode works only with single-source programs.
- [`transpile`](/aran/typedoc/functions/index.transpile.html): Transpile an JavaScript program to AranLang.
- [`weaveStandard`](/aran/typedoc/functions/index.weaveStandard.html): Weave a [standard aspect](/aran/typedoc/types/weave_standard_aspect.AspectTyping.html) into an AranLang program.
- [`weaveFlexible`](/aran/typedoc/functions/index.weaveFlexible.html): Weave a [flexible aspect](/aran/typedoc/types/weave_flexible_aspect.AspectTyping.html)
  into an AranLang program.
- [`retropile`](/aran/typedoc/functions/index.retropile.html): Transpile an AranLang program back to JavaScript.
- [`instrument`](/aran/typedoc.md/typedoc/functions/index.instrument.html): Instrument a JavaScript program by chaining: `transpile`, `weaveStandard`, and
  `retropile`.
