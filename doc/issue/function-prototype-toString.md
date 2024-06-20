`Function.prototype.toString` provide a string representation of the code of the
function. In Aran, instrumented programs will observe the instrumented code of
functions rather than their original code. In practice, this should not be a big
problem because the exact format of this string is not part of the specification
and is not guaranteed to be stable across different JavaScript engines. As such,
this string is better taillored to be consumed by humans than machines.

In the test262 suite, `Function.prototype.toString` is only called to ensure
that two functions that share the same AST also share the some string
representation. In Aran, this is not necessarily the case because of compilation
variables.
