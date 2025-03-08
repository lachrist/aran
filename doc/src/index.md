---
layout: default
title: Aran
---

# Aran <img src="{{ '/assets/aran.png' | relative_url }}" align="right" alt="aran-logo" title="Aran Linvail, the shadow master"/>

Aran is a [npm module](https://www.npmjs.com/package/aran) for instrumenting JavaScript code. Aran was designed as a generic infrastructure for building various development-time dynamic program analyses such as: object and function profiling, debugging, control-flow tracing, taint analysis, and concolic testing. Aran is a JavaScript library without any dependencies that only exports functions for manipulating [estree](https://github.com/estree/estree). Hence, additional work is required to deploy program analysis onto projects.

**Disclaimer:** Aran started as an academic research project and is used at [SOFT lab](http://soft.vub.ac.be/soft/) to support publications and run experiments. Aran provides extensive support for ECMAScript2024 and achieves a 99.7% success rate against [test262](https://github.com/tc39/test262). However, it has rarely been used to instrument large-scale programs and performance overhead may cause issues when analyzing time-sensitive programs.
