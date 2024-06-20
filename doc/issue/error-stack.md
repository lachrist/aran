The instances of `Error` have a `stack` property that provides a string
representation of the callstack at the moment that the error was created. After
being instrumented by Aran, programs may observe different line numbers or
additional call frames. In practice, this should not be a big problem because
the exact format of this string is not part of the specification and is not
guaranteed to be stable across different JavaScript engines. As such, this
string is better taillored to be consumed by humans than machines.
