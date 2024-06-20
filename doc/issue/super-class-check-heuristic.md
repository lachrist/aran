Super classes must be actual classes and not just function constructors. To the
best of my knowledge, this is the only case where function constructors can be
differentiated from class constructors. This is actually a good thing because
Aran represent classes as functions. However that also means that

- We can be too permisive
- The check might have side effects.

no way to detect when a constructor is actually
