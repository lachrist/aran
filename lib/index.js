'use strict';
const global_Object = global.Object;
const global_Map = global.Map;
const global_Reflect_apply = global.Reflect.apply;
const global_Object_assign = global.Object.assign;
const global_RegExp_prototype_test = global.RegExp.prototype.test;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const ArrayLite = require('array-lite');
const Tree = require('./tree.js');
const Stratum = require('./stratum.js');
const Parse = require('./parse.js');
const Transpile = require('./transpile');
const Instrument = require('./instrument.js');
const Generate = require('./generate.js');
const undefined_primitive_matcher = [
  'primitive',
  void 0
];
const array_of_intrinsic_matcher = [
  'intrinsic',
  'Array.of'
];
const get_advice_matcher = [
  'apply',
  [
    'intrinsic',
    'Reflect.get'
  ],
  [
    'primitive',
    void 0
  ],
  [
    [
      'intrinsic',
      'aran.advice'
    ],
    [
      'primitive',
      (context, primitive) => typeof primitive === 'string' && global_Reflect_apply(global_RegExp_prototype_test, /^[a-z]+$/, [primitive])
    ]
  ]
];
const advice_matcher = [
  'intrinsic',
  'aran.advice'
];
const get_advice_extractor = (context, node, expression1, expression2, expressions) => Tree._extract(null, expressions[1], 'primitive', primitive_extractor);
const primitive_extractor = (context, node, primitive) => primitive;
const namespace_instrument_options = {
  __proto__: null,
  ['overwritten-callee']: 'callee'
};
const unmangle_instrument_options = {
  __proto__: null,
  label: Stratum._get_body,
  identifier: identifier => Stratum._is_meta(identifier) ? '%' + Stratum._get_body(Stratum._get_body(identifier)) : Stratum._is_base(identifier) ? Stratum._is_meta(Stratum._get_body(identifier)) ? '#' + Stratum._get_body(Stratum._get_body(identifier)) : Stratum._get_body(Stratum._get_body(identifier)) : '@'
};
const enclave_prefix = '__ARAN__';
const namespace_generate_options = {
  __proto__: null,
  ['actual-callee']: 'CALLEE',
  intrinsic: 'INTRINSIC',
  arguments: 'ARGUMENTS',
  error: 'ERROR',
  export: 'EXPORT',
  import: 'IMPORT'
};
const generate_generate_options = {
  __proto__: null,
  identifier: identifier => identifier,
  label: label => label,
  construct: (expression, expressions, result, results) => null,
  apply: (expression1, expression2, expressions, result, nullable_result, results, _name) => Tree._match(null, expression1, array_of_intrinsic_matcher) && Tree._match(null, expression2, undefined_primitive_matcher) ? typeof result === 'string' ? `[${ ArrayLite.join(results, ',') }]` : {
    type: 'ArrayExpression',
    elements: results
  } : Tree._match(null, expression1, get_advice_matcher) && Tree._match(null, expression2, advice_matcher) ? (_name = Tree._extract(null, expression1, 'apply', get_advice_extractor), typeof result === 'string' ? `(${ nullable_result }.${ _name }(${ ArrayLite.join(results, ',') }))` : {
    type: 'CallExpression',
    optional: false,
    callee: {
      type: 'MemberExpression',
      computed: false,
      optional: false,
      object: nullable_result,
      property: {
        type: 'Identifier',
        name: _name
      }
    },
    arguments: results
  }) : null
};
const prototype = {
  parse(code, options) {
    return Parse(code, global_Object_assign({
      __proto__: null,
      source: 'script',
      context: null,
      serial: null,
      scopes: this.scopes,
      parser: this.parser,
      parserOptions: null
    }, options));
  },
  transpile(estree, options) {
    return Transpile(estree, global_Object_assign({
      __proto__: null,
      source: 'script',
      enclave: false,
      serial: null,
      scope: null,
      globals: this.globals,
      serials: new global_Map(),
      nodes: this.nodes,
      scopes: this.scopes
    }, options));
  },
  instrument(program, options) {
    return Instrument(program, global_Object_assign({
      __proto__: null,
      source: 'script',
      pointcut: null,
      serials: new global_Map(),
      namespace: namespace_instrument_options,
      unmangle: unmangle_instrument_options
    }, options));
  },
  generate(program, options) {
    return Generate(program, global_Object_assign({
      __proto__: null,
      source: 'script',
      prefix: options !== null && options !== void 0 && global_Reflect_getOwnPropertyDescriptor(global_Object(options), 'enclave') !== void 0 && options.enclave ? '__ARAN__' : '',
      output: 'code',
      newline: '\n',
      indent: '  ',
      intrinsic: this.namespace,
      namespace: namespace_generate_options,
      generate: generate_generate_options
    }, options));
  },
  weave(input, options, _serials) {
    return _serials = new global_Map(), this.generate(this.instrument(this.transpile(typeof input === 'string' ? this.parse(input, options) : input, global_Object_assign({
      __proto__: null,
      serials: _serials
    }, options)), global_Object_assign({
      __proto__: null,
      serials: _serials
    }, options)), options);
  },
  intrinsic: {
    __proto__: null,
    names: [
      'aran.globalObjectRecord',
      'aran.globalDeclarativeRecord',
      'aran.advice',
      'aran.deadzoneMarker',
      'Object',
      'Reflect.defineProperty',
      'eval',
      'Symbol.unscopables',
      'Symbol.iterator',
      'Function.prototype.arguments@get',
      'Function.prototype.arguments@set',
      'Array.prototype.values',
      'Object.prototype',
      'String',
      'Array.from',
      'Object.create',
      'Array.of',
      'Array',
      'Proxy',
      'RegExp',
      'TypeError',
      'ReferenceError',
      'SyntaxError',
      'Reflect.get',
      'Reflect.has',
      'Reflect.construct',
      'Reflect.apply',
      'Reflect.getPrototypeOf',
      'Reflect.ownKeys',
      'Reflect.isExtensible',
      'Object.keys',
      'Array.prototype.concat',
      'Array.prototype.includes',
      'Array.prototype.slice',
      'Reflect.set',
      'Reflect.deleteProperty',
      'Reflect.setPrototypeOf',
      'Reflect.getOwnPropertyDescriptor',
      'Reflect.preventExtensions',
      'Object.assign',
      'Object.freeze',
      'Object.defineProperty',
      'Object.setPrototypeOf',
      'Object.preventExtensions',
      'Array.prototype.fill',
      'Array.prototype.push'
    ],
    object: {
      __proto__: null,
      ['aran.globalObjectRecord']: new Function('return this;')(),
      ['aran.globalDeclarativeRecord']: { __proto__: null },
      ['aran.advice']: { __proto__: null },
      ['aran.deadzoneMarker']: { __proto__: null },
      ['Object']: Object,
      ['Reflect.defineProperty']: Reflect['defineProperty'],
      ['eval']: eval,
      ['Symbol.unscopables']: Symbol['unscopables'],
      ['Symbol.iterator']: Symbol['iterator'],
      ['Function.prototype.arguments@get']: Reflect.getOwnPropertyDescriptor(Function['prototype'], 'arguments').get,
      ['Function.prototype.arguments@set']: Reflect.getOwnPropertyDescriptor(Function['prototype'], 'arguments').set,
      ['Array.prototype.values']: Array['prototype']['values'],
      ['Object.prototype']: Object['prototype'],
      ['String']: String,
      ['Array.from']: Array['from'],
      ['Object.create']: Object['create'],
      ['Array.of']: Array['of'],
      ['Array']: Array,
      ['Proxy']: Proxy,
      ['RegExp']: RegExp,
      ['TypeError']: TypeError,
      ['ReferenceError']: ReferenceError,
      ['SyntaxError']: SyntaxError,
      ['Reflect.get']: Reflect['get'],
      ['Reflect.has']: Reflect['has'],
      ['Reflect.construct']: Reflect['construct'],
      ['Reflect.apply']: Reflect['apply'],
      ['Reflect.getPrototypeOf']: Reflect['getPrototypeOf'],
      ['Reflect.ownKeys']: Reflect['ownKeys'],
      ['Reflect.isExtensible']: Reflect['isExtensible'],
      ['Object.keys']: Object['keys'],
      ['Array.prototype.concat']: Array['prototype']['concat'],
      ['Array.prototype.includes']: Array['prototype']['includes'],
      ['Array.prototype.slice']: Array['prototype']['slice'],
      ['Reflect.set']: Reflect['set'],
      ['Reflect.deleteProperty']: Reflect['deleteProperty'],
      ['Reflect.setPrototypeOf']: Reflect['setPrototypeOf'],
      ['Reflect.getOwnPropertyDescriptor']: Reflect['getOwnPropertyDescriptor'],
      ['Reflect.preventExtensions']: Reflect['preventExtensions'],
      ['Object.assign']: Object['assign'],
      ['Object.freeze']: Object['freeze'],
      ['Object.defineProperty']: Object['defineProperty'],
      ['Object.setPrototypeOf']: Object['setPrototypeOf'],
      ['Object.preventExtensions']: Object['preventExtensions'],
      ['Array.prototype.fill']: Array['prototype']['fill'],
      ['Array.prototype.push']: Array['prototype']['push']
    },
    script: '({\n  __proto__: null,\n  ["aran.globalObjectRecord"]: ((new Function("return this;"))()),\n["aran.globalDeclarativeRecord"]: {__proto__:null},\n["aran.advice"]: {__proto__:null},\n["aran.deadzoneMarker"]: {__proto__:null},\n["Object"]: Object,\n["Reflect.defineProperty"]: Reflect["defineProperty"],\n["eval"]: eval,\n["Symbol.unscopables"]: Symbol["unscopables"],\n["Symbol.iterator"]: Symbol["iterator"],\n["Function.prototype.arguments@get"]: Reflect.getOwnPropertyDescriptor(Function["prototype"], "arguments").get,\n["Function.prototype.arguments@set"]: Reflect.getOwnPropertyDescriptor(Function["prototype"], "arguments").set,\n["Array.prototype.values"]: Array["prototype"]["values"],\n["Object.prototype"]: Object["prototype"],\n["String"]: String,\n["Array.from"]: Array["from"],\n["Object.create"]: Object["create"],\n["Array.of"]: Array["of"],\n["Array"]: Array,\n["Proxy"]: Proxy,\n["RegExp"]: RegExp,\n["TypeError"]: TypeError,\n["ReferenceError"]: ReferenceError,\n["SyntaxError"]: SyntaxError,\n["Reflect.get"]: Reflect["get"],\n["Reflect.has"]: Reflect["has"],\n["Reflect.construct"]: Reflect["construct"],\n["Reflect.apply"]: Reflect["apply"],\n["Reflect.getPrototypeOf"]: Reflect["getPrototypeOf"],\n["Reflect.ownKeys"]: Reflect["ownKeys"],\n["Reflect.isExtensible"]: Reflect["isExtensible"],\n["Object.keys"]: Object["keys"],\n["Array.prototype.concat"]: Array["prototype"]["concat"],\n["Array.prototype.includes"]: Array["prototype"]["includes"],\n["Array.prototype.slice"]: Array["prototype"]["slice"],\n["Reflect.set"]: Reflect["set"],\n["Reflect.deleteProperty"]: Reflect["deleteProperty"],\n["Reflect.setPrototypeOf"]: Reflect["setPrototypeOf"],\n["Reflect.getOwnPropertyDescriptor"]: Reflect["getOwnPropertyDescriptor"],\n["Reflect.preventExtensions"]: Reflect["preventExtensions"],\n["Object.assign"]: Object["assign"],\n["Object.freeze"]: Object["freeze"],\n["Object.defineProperty"]: Object["defineProperty"],\n["Object.setPrototypeOf"]: Object["setPrototypeOf"],\n["Object.preventExtensions"]: Object["preventExtensions"],\n["Array.prototype.fill"]: Array["prototype"]["fill"],\n["Array.prototype.push"]: Array["prototype"]["push"]});',
    estree: {
      'type': 'Program',
      'body': [{
          'type': 'ExpressionStatement',
          'expression': {
            'type': 'ObjectExpression',
            'properties': [
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': false,
                'key': {
                  'type': 'Identifier',
                  'name': '__proto__'
                },
                'value': {
                  'type': 'Literal',
                  'value': null,
                  'raw': 'null'
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'aran.globalObjectRecord',
                  'raw': '"aran.globalObjectRecord"'
                },
                'value': {
                  'type': 'CallExpression',
                  'callee': {
                    'type': 'NewExpression',
                    'callee': {
                      'type': 'Identifier',
                      'name': 'Function'
                    },
                    'arguments': [{
                        'type': 'Literal',
                        'value': 'return this;',
                        'raw': '"return this;"'
                      }]
                  },
                  'arguments': [],
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'aran.globalDeclarativeRecord',
                  'raw': '"aran.globalDeclarativeRecord"'
                },
                'value': {
                  'type': 'ObjectExpression',
                  'properties': [{
                      'type': 'Property',
                      'method': false,
                      'shorthand': false,
                      'computed': false,
                      'key': {
                        'type': 'Identifier',
                        'name': '__proto__'
                      },
                      'value': {
                        'type': 'Literal',
                        'value': null,
                        'raw': 'null'
                      },
                      'kind': 'init'
                    }]
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'aran.advice',
                  'raw': '"aran.advice"'
                },
                'value': {
                  'type': 'ObjectExpression',
                  'properties': [{
                      'type': 'Property',
                      'method': false,
                      'shorthand': false,
                      'computed': false,
                      'key': {
                        'type': 'Identifier',
                        'name': '__proto__'
                      },
                      'value': {
                        'type': 'Literal',
                        'value': null,
                        'raw': 'null'
                      },
                      'kind': 'init'
                    }]
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'aran.deadzoneMarker',
                  'raw': '"aran.deadzoneMarker"'
                },
                'value': {
                  'type': 'ObjectExpression',
                  'properties': [{
                      'type': 'Property',
                      'method': false,
                      'shorthand': false,
                      'computed': false,
                      'key': {
                        'type': 'Identifier',
                        'name': '__proto__'
                      },
                      'value': {
                        'type': 'Literal',
                        'value': null,
                        'raw': 'null'
                      },
                      'kind': 'init'
                    }]
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Object',
                  'raw': '"Object"'
                },
                'value': {
                  'type': 'Identifier',
                  'name': 'Object'
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Reflect.defineProperty',
                  'raw': '"Reflect.defineProperty"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Reflect'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'defineProperty',
                    'raw': '"defineProperty"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'eval',
                  'raw': '"eval"'
                },
                'value': {
                  'type': 'Identifier',
                  'name': 'eval'
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Symbol.unscopables',
                  'raw': '"Symbol.unscopables"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Symbol'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'unscopables',
                    'raw': '"unscopables"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Symbol.iterator',
                  'raw': '"Symbol.iterator"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Symbol'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'iterator',
                    'raw': '"iterator"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Function.prototype.arguments@get',
                  'raw': '"Function.prototype.arguments@get"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'CallExpression',
                    'callee': {
                      'type': 'MemberExpression',
                      'object': {
                        'type': 'Identifier',
                        'name': 'Reflect'
                      },
                      'property': {
                        'type': 'Identifier',
                        'name': 'getOwnPropertyDescriptor'
                      },
                      'computed': false,
                      'optional': false
                    },
                    'arguments': [
                      {
                        'type': 'MemberExpression',
                        'object': {
                          'type': 'Identifier',
                          'name': 'Function'
                        },
                        'property': {
                          'type': 'Literal',
                          'value': 'prototype',
                          'raw': '"prototype"'
                        },
                        'computed': true,
                        'optional': false
                      },
                      {
                        'type': 'Literal',
                        'value': 'arguments',
                        'raw': '"arguments"'
                      }
                    ],
                    'optional': false
                  },
                  'property': {
                    'type': 'Identifier',
                    'name': 'get'
                  },
                  'computed': false,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Function.prototype.arguments@set',
                  'raw': '"Function.prototype.arguments@set"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'CallExpression',
                    'callee': {
                      'type': 'MemberExpression',
                      'object': {
                        'type': 'Identifier',
                        'name': 'Reflect'
                      },
                      'property': {
                        'type': 'Identifier',
                        'name': 'getOwnPropertyDescriptor'
                      },
                      'computed': false,
                      'optional': false
                    },
                    'arguments': [
                      {
                        'type': 'MemberExpression',
                        'object': {
                          'type': 'Identifier',
                          'name': 'Function'
                        },
                        'property': {
                          'type': 'Literal',
                          'value': 'prototype',
                          'raw': '"prototype"'
                        },
                        'computed': true,
                        'optional': false
                      },
                      {
                        'type': 'Literal',
                        'value': 'arguments',
                        'raw': '"arguments"'
                      }
                    ],
                    'optional': false
                  },
                  'property': {
                    'type': 'Identifier',
                    'name': 'set'
                  },
                  'computed': false,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Array.prototype.values',
                  'raw': '"Array.prototype.values"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'MemberExpression',
                    'object': {
                      'type': 'Identifier',
                      'name': 'Array'
                    },
                    'property': {
                      'type': 'Literal',
                      'value': 'prototype',
                      'raw': '"prototype"'
                    },
                    'computed': true,
                    'optional': false
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'values',
                    'raw': '"values"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Object.prototype',
                  'raw': '"Object.prototype"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Object'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'prototype',
                    'raw': '"prototype"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'String',
                  'raw': '"String"'
                },
                'value': {
                  'type': 'Identifier',
                  'name': 'String'
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Array.from',
                  'raw': '"Array.from"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Array'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'from',
                    'raw': '"from"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Object.create',
                  'raw': '"Object.create"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Object'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'create',
                    'raw': '"create"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Array.of',
                  'raw': '"Array.of"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Array'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'of',
                    'raw': '"of"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Array',
                  'raw': '"Array"'
                },
                'value': {
                  'type': 'Identifier',
                  'name': 'Array'
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Proxy',
                  'raw': '"Proxy"'
                },
                'value': {
                  'type': 'Identifier',
                  'name': 'Proxy'
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'RegExp',
                  'raw': '"RegExp"'
                },
                'value': {
                  'type': 'Identifier',
                  'name': 'RegExp'
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'TypeError',
                  'raw': '"TypeError"'
                },
                'value': {
                  'type': 'Identifier',
                  'name': 'TypeError'
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'ReferenceError',
                  'raw': '"ReferenceError"'
                },
                'value': {
                  'type': 'Identifier',
                  'name': 'ReferenceError'
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'SyntaxError',
                  'raw': '"SyntaxError"'
                },
                'value': {
                  'type': 'Identifier',
                  'name': 'SyntaxError'
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Reflect.get',
                  'raw': '"Reflect.get"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Reflect'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'get',
                    'raw': '"get"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Reflect.has',
                  'raw': '"Reflect.has"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Reflect'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'has',
                    'raw': '"has"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Reflect.construct',
                  'raw': '"Reflect.construct"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Reflect'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'construct',
                    'raw': '"construct"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Reflect.apply',
                  'raw': '"Reflect.apply"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Reflect'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'apply',
                    'raw': '"apply"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Reflect.getPrototypeOf',
                  'raw': '"Reflect.getPrototypeOf"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Reflect'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'getPrototypeOf',
                    'raw': '"getPrototypeOf"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Reflect.ownKeys',
                  'raw': '"Reflect.ownKeys"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Reflect'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'ownKeys',
                    'raw': '"ownKeys"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Reflect.isExtensible',
                  'raw': '"Reflect.isExtensible"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Reflect'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'isExtensible',
                    'raw': '"isExtensible"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Object.keys',
                  'raw': '"Object.keys"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Object'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'keys',
                    'raw': '"keys"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Array.prototype.concat',
                  'raw': '"Array.prototype.concat"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'MemberExpression',
                    'object': {
                      'type': 'Identifier',
                      'name': 'Array'
                    },
                    'property': {
                      'type': 'Literal',
                      'value': 'prototype',
                      'raw': '"prototype"'
                    },
                    'computed': true,
                    'optional': false
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'concat',
                    'raw': '"concat"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Array.prototype.includes',
                  'raw': '"Array.prototype.includes"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'MemberExpression',
                    'object': {
                      'type': 'Identifier',
                      'name': 'Array'
                    },
                    'property': {
                      'type': 'Literal',
                      'value': 'prototype',
                      'raw': '"prototype"'
                    },
                    'computed': true,
                    'optional': false
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'includes',
                    'raw': '"includes"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Array.prototype.slice',
                  'raw': '"Array.prototype.slice"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'MemberExpression',
                    'object': {
                      'type': 'Identifier',
                      'name': 'Array'
                    },
                    'property': {
                      'type': 'Literal',
                      'value': 'prototype',
                      'raw': '"prototype"'
                    },
                    'computed': true,
                    'optional': false
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'slice',
                    'raw': '"slice"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Reflect.set',
                  'raw': '"Reflect.set"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Reflect'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'set',
                    'raw': '"set"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Reflect.deleteProperty',
                  'raw': '"Reflect.deleteProperty"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Reflect'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'deleteProperty',
                    'raw': '"deleteProperty"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Reflect.setPrototypeOf',
                  'raw': '"Reflect.setPrototypeOf"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Reflect'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'setPrototypeOf',
                    'raw': '"setPrototypeOf"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Reflect.getOwnPropertyDescriptor',
                  'raw': '"Reflect.getOwnPropertyDescriptor"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Reflect'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'getOwnPropertyDescriptor',
                    'raw': '"getOwnPropertyDescriptor"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Reflect.preventExtensions',
                  'raw': '"Reflect.preventExtensions"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Reflect'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'preventExtensions',
                    'raw': '"preventExtensions"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Object.assign',
                  'raw': '"Object.assign"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Object'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'assign',
                    'raw': '"assign"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Object.freeze',
                  'raw': '"Object.freeze"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Object'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'freeze',
                    'raw': '"freeze"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Object.defineProperty',
                  'raw': '"Object.defineProperty"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Object'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'defineProperty',
                    'raw': '"defineProperty"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Object.setPrototypeOf',
                  'raw': '"Object.setPrototypeOf"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Object'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'setPrototypeOf',
                    'raw': '"setPrototypeOf"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Object.preventExtensions',
                  'raw': '"Object.preventExtensions"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'Identifier',
                    'name': 'Object'
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'preventExtensions',
                    'raw': '"preventExtensions"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Array.prototype.fill',
                  'raw': '"Array.prototype.fill"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'MemberExpression',
                    'object': {
                      'type': 'Identifier',
                      'name': 'Array'
                    },
                    'property': {
                      'type': 'Literal',
                      'value': 'prototype',
                      'raw': '"prototype"'
                    },
                    'computed': true,
                    'optional': false
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'fill',
                    'raw': '"fill"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              },
              {
                'type': 'Property',
                'method': false,
                'shorthand': false,
                'computed': true,
                'key': {
                  'type': 'Literal',
                  'value': 'Array.prototype.push',
                  'raw': '"Array.prototype.push"'
                },
                'value': {
                  'type': 'MemberExpression',
                  'object': {
                    'type': 'MemberExpression',
                    'object': {
                      'type': 'Identifier',
                      'name': 'Array'
                    },
                    'property': {
                      'type': 'Literal',
                      'value': 'prototype',
                      'raw': '"prototype"'
                    },
                    'computed': true,
                    'optional': false
                  },
                  'property': {
                    'type': 'Literal',
                    'value': 'push',
                    'raw': '"push"'
                  },
                  'computed': true,
                  'optional': false
                },
                'kind': 'init'
              }
            ]
          }
        }],
      'sourceType': 'script'
    }
  },
  unary: {
    __proto__: null,
    operators: [
      '-',
      '+',
      '!',
      '~',
      'typeof',
      'void',
      'delete'
    ],
    closure: (operator, argument) => {
      switch (operator) {
      case '-':
        return -argument;
      case '+':
        return +argument;
      case '!':
        return !argument;
      case '~':
        return ~argument;
      case 'typeof':
        return typeof argument;
      case 'void':
        return void argument;
      case 'delete':
        return true;
      }
      throw 'invalid unary operator';
    },
    script: '\n  ((operator, argument) => {\n    switch (operator) {\n          case "-": return - argument;\n    case "+": return + argument;\n    case "!": return ! argument;\n    case "~": return ~ argument;\n    case "typeof": return typeof argument;\n    case "void": return void argument;\n    case "delete": return true;}\n    throw "invalid unary operator";});',
    estree: {
      'type': 'Program',
      'body': [{
          'type': 'ExpressionStatement',
          'expression': {
            'type': 'ArrowFunctionExpression',
            'id': null,
            'expression': false,
            'generator': false,
            'async': false,
            'params': [
              {
                'type': 'Identifier',
                'name': 'operator'
              },
              {
                'type': 'Identifier',
                'name': 'argument'
              }
            ],
            'body': {
              'type': 'BlockStatement',
              'body': [
                {
                  'type': 'SwitchStatement',
                  'discriminant': {
                    'type': 'Identifier',
                    'name': 'operator'
                  },
                  'cases': [
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'UnaryExpression',
                            'operator': '-',
                            'prefix': true,
                            'argument': {
                              'type': 'Identifier',
                              'name': 'argument'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '-',
                        'raw': '"-"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'UnaryExpression',
                            'operator': '+',
                            'prefix': true,
                            'argument': {
                              'type': 'Identifier',
                              'name': 'argument'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '+',
                        'raw': '"+"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'UnaryExpression',
                            'operator': '!',
                            'prefix': true,
                            'argument': {
                              'type': 'Identifier',
                              'name': 'argument'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '!',
                        'raw': '"!"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'UnaryExpression',
                            'operator': '~',
                            'prefix': true,
                            'argument': {
                              'type': 'Identifier',
                              'name': 'argument'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '~',
                        'raw': '"~"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'UnaryExpression',
                            'operator': 'typeof',
                            'prefix': true,
                            'argument': {
                              'type': 'Identifier',
                              'name': 'argument'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': 'typeof',
                        'raw': '"typeof"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'UnaryExpression',
                            'operator': 'void',
                            'prefix': true,
                            'argument': {
                              'type': 'Identifier',
                              'name': 'argument'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': 'void',
                        'raw': '"void"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'Literal',
                            'value': true,
                            'raw': 'true'
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': 'delete',
                        'raw': '"delete"'
                      }
                    }
                  ]
                },
                {
                  'type': 'ThrowStatement',
                  'argument': {
                    'type': 'Literal',
                    'value': 'invalid unary operator',
                    'raw': '"invalid unary operator"'
                  }
                }
              ]
            }
          }
        }],
      'sourceType': 'script'
    }
  },
  binary: {
    __proto__: null,
    operators: [
      '==',
      '!=',
      '===',
      '!==',
      '<',
      '<=',
      '>',
      '>=',
      '<<',
      '>>',
      '>>>',
      '+',
      '-',
      '*',
      '/',
      '%',
      '|',
      '^',
      '&',
      'in',
      'instanceof'
    ],
    closure: (operator, argument1, argument2) => {
      switch (operator) {
      case '==':
        return argument1 == argument2;
      case '!=':
        return argument1 != argument2;
      case '===':
        return argument1 === argument2;
      case '!==':
        return argument1 !== argument2;
      case '<':
        return argument1 < argument2;
      case '<=':
        return argument1 <= argument2;
      case '>':
        return argument1 > argument2;
      case '>=':
        return argument1 >= argument2;
      case '<<':
        return argument1 << argument2;
      case '>>':
        return argument1 >> argument2;
      case '>>>':
        return argument1 >>> argument2;
      case '+':
        return argument1 + argument2;
      case '-':
        return argument1 - argument2;
      case '*':
        return argument1 * argument2;
      case '/':
        return argument1 / argument2;
      case '%':
        return argument1 % argument2;
      case '|':
        return argument1 | argument2;
      case '^':
        return argument1 ^ argument2;
      case '&':
        return argument1 & argument2;
      case 'in':
        return argument1 in argument2;
      case 'instanceof':
        return argument1 instanceof argument2;
      }
      throw 'invalid binary operator';
    },
    script: '\n  ((operator, argument1, argument2) => {\n    switch (operator) {\n            case "==": return argument1 == argument2;\n      case "!=": return argument1 != argument2;\n      case "===": return argument1 === argument2;\n      case "!==": return argument1 !== argument2;\n      case "<": return argument1 < argument2;\n      case "<=": return argument1 <= argument2;\n      case ">": return argument1 > argument2;\n      case ">=": return argument1 >= argument2;\n      case "<<": return argument1 << argument2;\n      case ">>": return argument1 >> argument2;\n      case ">>>": return argument1 >>> argument2;\n      case "+": return argument1 + argument2;\n      case "-": return argument1 - argument2;\n      case "*": return argument1 * argument2;\n      case "/": return argument1 / argument2;\n      case "%": return argument1 % argument2;\n      case "|": return argument1 | argument2;\n      case "^": return argument1 ^ argument2;\n      case "&": return argument1 & argument2;\n      case "in": return argument1 in argument2;\n      case "instanceof": return argument1 instanceof argument2;}\n    throw "invalid binary operator";});',
    estree: {
      'type': 'Program',
      'body': [{
          'type': 'ExpressionStatement',
          'expression': {
            'type': 'ArrowFunctionExpression',
            'id': null,
            'expression': false,
            'generator': false,
            'async': false,
            'params': [
              {
                'type': 'Identifier',
                'name': 'operator'
              },
              {
                'type': 'Identifier',
                'name': 'argument1'
              },
              {
                'type': 'Identifier',
                'name': 'argument2'
              }
            ],
            'body': {
              'type': 'BlockStatement',
              'body': [
                {
                  'type': 'SwitchStatement',
                  'discriminant': {
                    'type': 'Identifier',
                    'name': 'operator'
                  },
                  'cases': [
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '==',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '==',
                        'raw': '"=="'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '!=',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '!=',
                        'raw': '"!="'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '===',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '===',
                        'raw': '"==="'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '!==',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '!==',
                        'raw': '"!=="'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '<',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '<',
                        'raw': '"<"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '<=',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '<=',
                        'raw': '"<="'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '>',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '>',
                        'raw': '">"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '>=',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '>=',
                        'raw': '">="'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '<<',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '<<',
                        'raw': '"<<"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '>>',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '>>',
                        'raw': '">>"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '>>>',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '>>>',
                        'raw': '">>>"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '+',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '+',
                        'raw': '"+"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '-',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '-',
                        'raw': '"-"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '*',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '*',
                        'raw': '"*"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '/',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '/',
                        'raw': '"/"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '%',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '%',
                        'raw': '"%"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '|',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '|',
                        'raw': '"|"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '^',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '^',
                        'raw': '"^"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': '&',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': '&',
                        'raw': '"&"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': 'in',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': 'in',
                        'raw': '"in"'
                      }
                    },
                    {
                      'type': 'SwitchCase',
                      'consequent': [{
                          'type': 'ReturnStatement',
                          'argument': {
                            'type': 'BinaryExpression',
                            'left': {
                              'type': 'Identifier',
                              'name': 'argument1'
                            },
                            'operator': 'instanceof',
                            'right': {
                              'type': 'Identifier',
                              'name': 'argument2'
                            }
                          }
                        }],
                      'test': {
                        'type': 'Literal',
                        'value': 'instanceof',
                        'raw': '"instanceof"'
                      }
                    }
                  ]
                },
                {
                  'type': 'ThrowStatement',
                  'argument': {
                    'type': 'Literal',
                    'value': 'invalid binary operator',
                    'raw': '"invalid binary operator"'
                  }
                }
              ]
            }
          }
        }],
      'sourceType': 'script'
    }
  },
  object: {
    __proto__: null,
    closure: (prototype, entries) => {
      const object = { __proto__: null };
      for (let index = 0; index < entries.length; index++) {
        object[entries[index][0]] = entries[index][1];
      }
      return prototype === null ? object : Object.assign({ __proto__: prototype }, object);
    },
    script: '\n  ((prototype, entries) => {\n    const object = {__proto__: null};\n    for (let index = 0; index < entries.length; index ++) {\n      object[entries[index][0]] = entries[index][1];}\n    return prototype === null ? object : Object.assign({__proto__:prototype}, object);});',
    estree: {
      'type': 'Program',
      'body': [{
          'type': 'ExpressionStatement',
          'expression': {
            'type': 'ArrowFunctionExpression',
            'id': null,
            'expression': false,
            'generator': false,
            'async': false,
            'params': [
              {
                'type': 'Identifier',
                'name': 'prototype'
              },
              {
                'type': 'Identifier',
                'name': 'entries'
              }
            ],
            'body': {
              'type': 'BlockStatement',
              'body': [
                {
                  'type': 'VariableDeclaration',
                  'declarations': [{
                      'type': 'VariableDeclarator',
                      'id': {
                        'type': 'Identifier',
                        'name': 'object'
                      },
                      'init': {
                        'type': 'ObjectExpression',
                        'properties': [{
                            'type': 'Property',
                            'method': false,
                            'shorthand': false,
                            'computed': false,
                            'key': {
                              'type': 'Identifier',
                              'name': '__proto__'
                            },
                            'value': {
                              'type': 'Literal',
                              'value': null,
                              'raw': 'null'
                            },
                            'kind': 'init'
                          }]
                      }
                    }],
                  'kind': 'const'
                },
                {
                  'type': 'ForStatement',
                  'init': {
                    'type': 'VariableDeclaration',
                    'declarations': [{
                        'type': 'VariableDeclarator',
                        'id': {
                          'type': 'Identifier',
                          'name': 'index'
                        },
                        'init': {
                          'type': 'Literal',
                          'value': 0,
                          'raw': '0'
                        }
                      }],
                    'kind': 'let'
                  },
                  'test': {
                    'type': 'BinaryExpression',
                    'left': {
                      'type': 'Identifier',
                      'name': 'index'
                    },
                    'operator': '<',
                    'right': {
                      'type': 'MemberExpression',
                      'object': {
                        'type': 'Identifier',
                        'name': 'entries'
                      },
                      'property': {
                        'type': 'Identifier',
                        'name': 'length'
                      },
                      'computed': false,
                      'optional': false
                    }
                  },
                  'update': {
                    'type': 'UpdateExpression',
                    'operator': '++',
                    'prefix': false,
                    'argument': {
                      'type': 'Identifier',
                      'name': 'index'
                    }
                  },
                  'body': {
                    'type': 'BlockStatement',
                    'body': [{
                        'type': 'ExpressionStatement',
                        'expression': {
                          'type': 'AssignmentExpression',
                          'operator': '=',
                          'left': {
                            'type': 'MemberExpression',
                            'object': {
                              'type': 'Identifier',
                              'name': 'object'
                            },
                            'property': {
                              'type': 'MemberExpression',
                              'object': {
                                'type': 'MemberExpression',
                                'object': {
                                  'type': 'Identifier',
                                  'name': 'entries'
                                },
                                'property': {
                                  'type': 'Identifier',
                                  'name': 'index'
                                },
                                'computed': true,
                                'optional': false
                              },
                              'property': {
                                'type': 'Literal',
                                'value': 0,
                                'raw': '0'
                              },
                              'computed': true,
                              'optional': false
                            },
                            'computed': true,
                            'optional': false
                          },
                          'right': {
                            'type': 'MemberExpression',
                            'object': {
                              'type': 'MemberExpression',
                              'object': {
                                'type': 'Identifier',
                                'name': 'entries'
                              },
                              'property': {
                                'type': 'Identifier',
                                'name': 'index'
                              },
                              'computed': true,
                              'optional': false
                            },
                            'property': {
                              'type': 'Literal',
                              'value': 1,
                              'raw': '1'
                            },
                            'computed': true,
                            'optional': false
                          }
                        }
                      }]
                  }
                },
                {
                  'type': 'ReturnStatement',
                  'argument': {
                    'type': 'ConditionalExpression',
                    'test': {
                      'type': 'BinaryExpression',
                      'left': {
                        'type': 'Identifier',
                        'name': 'prototype'
                      },
                      'operator': '===',
                      'right': {
                        'type': 'Literal',
                        'value': null,
                        'raw': 'null'
                      }
                    },
                    'consequent': {
                      'type': 'Identifier',
                      'name': 'object'
                    },
                    'alternate': {
                      'type': 'CallExpression',
                      'callee': {
                        'type': 'MemberExpression',
                        'object': {
                          'type': 'Identifier',
                          'name': 'Object'
                        },
                        'property': {
                          'type': 'Identifier',
                          'name': 'assign'
                        },
                        'computed': false,
                        'optional': false
                      },
                      'arguments': [
                        {
                          'type': 'ObjectExpression',
                          'properties': [{
                              'type': 'Property',
                              'method': false,
                              'shorthand': false,
                              'computed': false,
                              'key': {
                                'type': 'Identifier',
                                'name': '__proto__'
                              },
                              'value': {
                                'type': 'Identifier',
                                'name': 'prototype'
                              },
                              'kind': 'init'
                            }]
                        },
                        {
                          'type': 'Identifier',
                          'name': 'object'
                        }
                      ],
                      'optional': false
                    }
                  }
                }
              ]
            }
          }
        }],
      'sourceType': 'script'
    }
  }
};
module.exports = function Aran(options) {
  return global_Object_assign({
    __proto__: prototype,
    parser: null,
    namespace: '__aran__',
    globals: [],
    scopes: {},
    nodes: []
  }, options);
};