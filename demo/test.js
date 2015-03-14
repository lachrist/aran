function assert (x) { if (!x) { throw new Error("Assertion violation") } }

// Unary
assert(!false === true);

// Binary
assert(1+2 === 3);

// Get / Set
var o = {a:1, b:2};
o.c = o.a + o.b;
assert(o.c === 3);

// Delete
var o = {a:1};
delete o.a;
assert(o.a === undefined);

// Identity
var x = f(1);
function f (x) { return x }
assert(x === 1)

// Recusrive factorial
function fac_rec (n) {
  if (n===0) { return 1 }
  return n * fac_rec(n-1);
}
assert(fac_rec(6) === 720);

// Iterative factorial
function fac_iter (n) {
  var r = n;
  while (--n) { r = n*r }
  return r;
}
assert(fac_iter(6) === 720)

// Try/Catch
try { throw new Error("foo") } catch (e) { assert(e.message === "foo") }  

// Identifier increment
var x = 0;
assert(++x === 1);
assert(x++ === 1);
assert(x === 2);

// Identifier decrement
var x = 0;
assert(--x === -1);
assert(x-- === -1);
assert(x === -2);

// Member increment
var o = {a:0};
assert(++o.a === 1);
assert(o.a++ === 1);
assert(o.a === 2);

// Member decrement
var o = {a:0};
assert(--o.a === -1);
assert(o.a-- === -1);
assert(o.a === -2);

// Or
assert(true||true);
assert(true||false);
assert(false||true);
assert(!(false||false));

// And
assert(true&&true);
assert(!(true&&false));
assert(!(false&&true));
assert(!(false||false));

// Conditional
assert((true?1:2)===1);
assert((false?1:2)===2);

// Array
var xs = [1,2,3]
var sum=0
for (var i=0; i<xs.length; i++) { sum = sum + xs[i] }
assert(sum === 6)

// With
var env = {aran:1}
with (env) { aran++ }
assert(env.aran === 2)

// Assignment operation
var x = 1
x += 3
assert(x===4)
var o = {a:1}
o.a += 3
assert(o.a === 4)

// Switch
var check = 0
switch (4) {
  case 1: assert(false); break
  default: check++;
  case 4: check++; break
  case 4: assert(false); break
}
assert(check===2)

