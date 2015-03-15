

exports.This = "var o = {f:function () {if (this!==o) {throw'This'}}}; o.f()"
exports.Array = "if ([1,2,3][0]!==1) {throw'Array'}"
exports.Object = "var o = {a:1, b:2, get c () {return 1}, set c (v) {}}; o.c=666; if (o.c!==1) {throw 'Object'}"
exports.Function = "var f = function () { return 1 }; if (f()!==1) {throw '1'}"
exports.Sequence = "if ((1,2)!==2) {throw'Sequence'}"
exports.IdentifierTypeof = "if (typeof a$very$strange$id !== 'undefined') {throw'Typeof1'} if (typeof 1 !== 'number') {throw'Typeof2'}"
exports.IdentifierDelete = "if (delete a !== true) {throw'IdentifierDelete'}"
exports.MemberDelete = "var o = {a:1}; delete o.a; if (o.a!==undefined) {throw'MemberDelete'}"
exports.Unary = "if (!true) {throw'Unary'}"
exports.Binary = "if (1+2!==3) {throw'Binary'}"
exports.IdentifierAssignment = "var x; x=1; if (x!==1) {throw'IdentifierAssignment'}"
exports.MemberAssignment = "var o = {}; o.a=1; if (o.a!==1) {throw'MemberAssignment'}"
exports.IdentifierUpdate = "var x=1; if (x++!==1) {throw'IdentifierUpdate1'}; if (++x!==3) {throw'IdentifierUpdate2'}"
exports.MemberUpdate = "var o = {a:1}; if (o.a++!==1) {throw'MemberUpdate1'}; if (++o.a!==3) {throw'MemberUpdate2'}"
exports.Logical = "if ((false||1)!==1) {throw'Logical1'}; if ((true&&1)!==1) {throw'Logical2'}"
exports.Conditional = "if ((true?1:2)!==1) {throw'Conditional1'}; if ((false?1:2)!==2) {throw'Conditional2'}"
exports.New = "var o={}; function F () {return o}; if (new F()!==o) {throw'New'}" // TODO
exports.MemberCall = "var o = {f:function () {if (this!==o) {throw'MemberCall'}}}; o.f()"
exports.EvalCall = "var x=1; if(eval('x')!==1) {throw'EvalCall'}"
exports.Call = "function f () {return 1} if (f()!==1) {throw'Call'}"
exports.Member = "if ({a:1}.a!==1) {throw'Member'}"
exports.Identifier = "var x=1; if (x!==1) {throw'Identifier'}"
exports.Literal = "null; true; false; 1; -1; 'a'; /abc/g;"


