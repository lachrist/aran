"use strict";

const global_Reflect_apply = global.Reflect.apply;
const global_RegExp_prototype_test = global.RegExp.prototype.test;

// (
//   hashbang-comment?
//   (
//     blank |
//     (
//       single-quote-string-literal
//       blank*
//       semi-colon?) |
//     (
//       double-quote-string-literal
//       blank*
//       semi-colon?))*
//   (
//     single-quote-use-strict |
//     double-quote-use-strict))

const hashbang_comment = /^\#\!.\n$/;
const blank = /^(\s|\/\/.*\n|\/\*([^\*]|(\*(?!\/)))*\*\/)$/;
const single_quote_string_literal = /\'(?!use strict')([^\'\\\n]|\\.)*\'$/;
const double_quote_string_literal = /\"(?!use strict')([^\"\\\n]|\\.)*\"$/;
const semi_colon = /^\;$/;
const single_quote_use_strict = /^'use strict';$/;
const double_quote_use_strict = /^"use strict";$/;

const regexp = /^(\#\!.\n)?((\s|\/\/.*\n|\/\*([^\*]|(\*(?!\/)))*\*\/)|\'(?!use strict')([^\'\\\n]|\\.)*\'()*\;?)/

module.exports = (code) => global_Reflect_apply(global_RegExp_prototype_test, regexp, [code]);

//;

/\s/;

//;

/\/\*([^\*]|(\*(?!\/)))*\*\//;



/\"(?!use strict")([^\"\\\n]|\\.)*\"(\s|\/\/.*\n|\/\*([^\*]|(\*(?!\/)))*\*\/)*;?/;
