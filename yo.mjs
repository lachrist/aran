// Copyright (C) 2015 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.
/*---
es6id: 12.3.5.1
description: >
    Runtime Semantics: Evaluation

    SuperCall : super Arguments

    ...
    7. Let result be Construct(func, argList, newTarget).
    ...
    10. Return thisER.BindThisValue(result)


    8.1.1.3.1 BindThisValue(V)

    ...
    3. If envRec.[[thisBindingStatus]] is "initialized", throw a ReferenceError exception.
    ...
---*/

var count = 0;

class A {
  constructor() {
    count++;
  }
}

class B extends A {
  constructor() {
    super();
    super();
  }
}

try {
  new B();
} catch (error) {
  console.log({ error, count });
}
