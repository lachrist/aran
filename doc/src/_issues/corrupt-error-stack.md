---
layout: default
title: Corrupt Error Stack
---

The instances of `Error` have a `stack` property that provides a string representation of the call stack at the moment that the error was created. After being instrumented by Aran, different line numbers or additional call frames may be observed. Note that format of `stack` is not part of the ECMAScript specification and is not guaranteed to be stable across different JavaScript engines anyway.
