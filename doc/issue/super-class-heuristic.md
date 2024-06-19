Super classes must be actual classes and not just function constructors.
Currently, the spec does not provide a way to differentiate between function
constuctors and class constructor. This is a good thing because Aran desugarized
classes into function constructors. However that means that must rely on a
heuristic to detect whether a value is a class constructor or not.

no way to detect when a constructor is actually
