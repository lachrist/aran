
const replace = (key, transformers) => points[key] = {
  forward: Build[key],
  cut: function () { return trap(key, transformers.map((f, i) => t(arguments[i]))) }};

const produce = (key) => points[key] = {
  forward: Build[key],
  cut: function (x1, x2, x3) { return trap(key, [Build[key](x1, x2, x3)]) }};

const consume = (key) => points[key] = {
  forward: identity,
  cut: (x) => trap(key, x) };

const inform = (key, transformers) => points[key] = {
  forward: noop,
  cut: function () { return trap(key, transformers.map((f, i) => t(arguments[i]))) }};

Replace
=======
get :: expression -> expression -> expression
set :: expression -> expression -> expression -> expression
delete :: expression -> expression -> expression
enumerate :: expression -> expression
apply :: expression -> expression -> [expression] -> expression
construct :: expression -> [expression] -> expression
unary :: String -> expression -> expression
binary :: String -> expression -> expression -> expression

Produce
=======
global :: expression -> expression
this :: expression -> expression
arguments :: expression -> expression
discard :: expression -> expression

primitive :: expression -> expression
array :: expression -> expression
object :: expression -> expression
regexp :: expression -> expression
closure :: expression -> expression

Consume
=======
test :: expression -> expression
with :: expression -> expression
throw :: expression -> expression
return :: expression -> expression
eval :: expression -> expression

Inform
======
enter :: String -> (expression | null)
leave :: String -> (expression | null)
strict :: (expression | null)
label :: String -> (expression | null)
continue :: String -> (expression | null)
break :: String -> (expression | null)
drop :: (expression | null)
copy :: (expression | null)
swap :: Number -> Number -> (expression | null)


points.read = {};
points.read.forward = Build.identifier;
points.read.cut = (tag) => trap("read", [Build.primitive(tag), Build.identifier(tag)]);

points.write = {};
points.write.froward = Build

points.discard = {};
points.discard.forward = (tag) => Build.unary("delete", Build.identifier(tag));
points.discard.cut = (tag) => trap("discard", [Build.unary("delete", Build.identifier(tag))]);

read :: String -> expression // read("foo", foo)
discard :: String -> expression
declare :: String -> expression -> expression //
write :: String -> expression -> expression // foo = x >> foo = write("foo", x)
