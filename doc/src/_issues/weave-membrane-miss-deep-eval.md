---
layout: default-title
title: Patch Membrane Miss Deep Eval
---

Sometimes dynamically evaluated code must also be instrumented. Either because such code is of interest for the analysis or because the `global-declarative-record` option is set to `"emulate"` (this option requires all code to be instrumented). This requires the user to control the access to dynamic code evaluation means by the target program. To that end the user can weave the `apply@around` and `construct@around` join points. A technique that I name _weave membrane_. This is less intrusive than the patch membrane but it requires additional work to intercept dynamic code evaluation in external code area. For instance, `Reflect.apply(eval, undefined, "123;")` triggers a global `eval` call inside that implementation of the `Reflect.apply` intrinsic.
