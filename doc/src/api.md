---
layout: default-title
title: API
---

![Aran's flowchart]({{ '/assets/flowchart.png' | relative_url }})

Aran simplifies the instrumentation of JavaScript code by transpiling it into a minimal variant called [AranLang]({{ '/typedoc/modules/lang_syntax.html' | relative_url }}). Instrumentation is performed on AranLang before transpiling it back to JavaScript. Aran provides the following functions:

- [`setupile`]({{ '/typedoc/functions/index.setupile.html' | relative_url }}): Generates a setup program (JavaScript) that should be evaluated before any AranLang program. This requirement can be removed by setting `conf.mode` of `retropile` to `"standalone"` instead of `"normal"`. The standalone mode works only with single-source programs.
- [`transpile`]({{ '/typedoc/functions/index.transpile.html' | relative_url }}): Transpile an JavaScript program to AranLang.
- [`weaveStandard`]({{ '/typedoc/functions/index.weaveStandard.html' | relative_url }}): Weave a [standard aspect]({{ '/typedoc/types/weave_standard_aspect.AspectTyping.html' | relative_url }}) into an AranLang program.
- [`weaveFlexible`]({{ '/typedoc/functions/index.weaveFlexible.html' | relative_url }}): Weave a [flexible aspect]({{ '/typedoc/types/weave_flexible_aspect.AspectTyping.html' | relative_url }})
  into an AranLang program.
- [`retropile`]({{ '/typedoc/functions/index.retropile.html' | relative_url }}): Transpile an AranLang program back to JavaScript.
- [`instrument`]({{ '/typedoc.md/typedoc/functions/index.instrument.html' | relative_url }}): Instrument a JavaScript program by chaining: `transpile`, `weaveStandard`, and
  `retropile`.
