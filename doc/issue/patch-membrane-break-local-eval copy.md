Sometimes dynamically evaluated code must also be instrumented. Either because
such code is of interest or because the `global-declarative-record` option is
set to `"emulate"` (this option requires every bit of code to be instrumented).
To control the access of dynamic code evaluation means by the target program,
the user can patch the global object. A technique that I name _patch membrane_.
This involved redefining global variables such as `Function` and `eval` and even
DOM accessors to intercept dynamic addition of `script` elements. However, by
redefining `eval`, the user will break support local eval calls. Indeed, Aran
relies on the variable `eval` to be assigned to the intrinsic `eval` value to
support direct eval calls. This is hard to overcome because the body on
instrumented code is executed in strict mode and cannot re-assign the `eval`
variable.
