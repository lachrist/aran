exports.builtins = {
  "type": "ObjectExpression",
  "properties": [
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Identifier",
        "name": "__proto__"
      },
      "value": {
        "type": "Literal",
        "value": null,
        "raw": "null"
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "global",
        "raw": "\"global\""
      },
      "value": {
        "type": "CallExpression",
        "callee": {
          "type": "NewExpression",
          "callee": {
            "type": "Identifier",
            "name": "Function"
          },
          "arguments": [
            {
              "type": "Literal",
              "value": "return this",
              "raw": "\"return this\""
            }
          ]
        },
        "arguments": []
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "eval",
        "raw": "\"eval\""
      },
      "value": {
        "type": "Identifier",
        "name": "eval"
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "RegExp",
        "raw": "\"RegExp\""
      },
      "value": {
        "type": "Identifier",
        "name": "RegExp"
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "ReferenceError",
        "raw": "\"ReferenceError\""
      },
      "value": {
        "type": "Identifier",
        "name": "ReferenceError"
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "TypeError",
        "raw": "\"TypeError\""
      },
      "value": {
        "type": "Identifier",
        "name": "TypeError"
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Reflect.get",
        "raw": "\"Reflect.get\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Reflect"
        },
        "property": {
          "type": "Identifier",
          "name": "get"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Reflect.set",
        "raw": "\"Reflect.set\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Reflect"
        },
        "property": {
          "type": "Identifier",
          "name": "set"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Reflect.has",
        "raw": "\"Reflect.has\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Reflect"
        },
        "property": {
          "type": "Identifier",
          "name": "has"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Reflect.construct",
        "raw": "\"Reflect.construct\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Reflect"
        },
        "property": {
          "type": "Identifier",
          "name": "construct"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Reflect.apply",
        "raw": "\"Reflect.apply\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Reflect"
        },
        "property": {
          "type": "Identifier",
          "name": "apply"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Reflect.deleteProperty",
        "raw": "\"Reflect.deleteProperty\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Reflect"
        },
        "property": {
          "type": "Identifier",
          "name": "deleteProperty"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Reflect.setPrototypeOf",
        "raw": "\"Reflect.setPrototypeOf\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Reflect"
        },
        "property": {
          "type": "Identifier",
          "name": "setPrototypeOf"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Reflect.getPrototypeOf",
        "raw": "\"Reflect.getPrototypeOf\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Reflect"
        },
        "property": {
          "type": "Identifier",
          "name": "getPrototypeOf"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Reflect.defineProperty",
        "raw": "\"Reflect.defineProperty\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Reflect"
        },
        "property": {
          "type": "Identifier",
          "name": "defineProperty"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Reflect.getOwnPropertyDescriptor",
        "raw": "\"Reflect.getOwnPropertyDescriptor\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Reflect"
        },
        "property": {
          "type": "Identifier",
          "name": "getOwnPropertyDescriptor"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Symbol.unscopables",
        "raw": "\"Symbol.unscopables\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Symbol"
        },
        "property": {
          "type": "Identifier",
          "name": "unscopables"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Symbol.iterator",
        "raw": "\"Symbol.iterator\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Symbol"
        },
        "property": {
          "type": "Identifier",
          "name": "iterator"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Object",
        "raw": "\"Object\""
      },
      "value": {
        "type": "Identifier",
        "name": "Object"
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Object.freeze",
        "raw": "\"Object.freeze\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Object"
        },
        "property": {
          "type": "Identifier",
          "name": "freeze"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Object.keys",
        "raw": "\"Object.keys\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Object"
        },
        "property": {
          "type": "Identifier",
          "name": "keys"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Object.create",
        "raw": "\"Object.create\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Object"
        },
        "property": {
          "type": "Identifier",
          "name": "create"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Object.prototype",
        "raw": "\"Object.prototype\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Object"
        },
        "property": {
          "type": "Identifier",
          "name": "prototype"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Array.of",
        "raw": "\"Array.of\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "Identifier",
          "name": "Array"
        },
        "property": {
          "type": "Identifier",
          "name": "of"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Array.prototype.concat",
        "raw": "\"Array.prototype.concat\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "MemberExpression",
          "object": {
            "type": "Identifier",
            "name": "Array"
          },
          "property": {
            "type": "Identifier",
            "name": "prototype"
          },
          "computed": false
        },
        "property": {
          "type": "Identifier",
          "name": "concat"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Array.prototype.values",
        "raw": "\"Array.prototype.values\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "MemberExpression",
          "object": {
            "type": "Identifier",
            "name": "Array"
          },
          "property": {
            "type": "Identifier",
            "name": "prototype"
          },
          "computed": false
        },
        "property": {
          "type": "Identifier",
          "name": "values"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Array.prototype.includes",
        "raw": "\"Array.prototype.includes\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "MemberExpression",
          "object": {
            "type": "Identifier",
            "name": "Array"
          },
          "property": {
            "type": "Identifier",
            "name": "prototype"
          },
          "computed": false
        },
        "property": {
          "type": "Identifier",
          "name": "includes"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Array.prototype.push",
        "raw": "\"Array.prototype.push\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "MemberExpression",
          "object": {
            "type": "Identifier",
            "name": "Array"
          },
          "property": {
            "type": "Identifier",
            "name": "prototype"
          },
          "computed": false
        },
        "property": {
          "type": "Identifier",
          "name": "push"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get",
        "raw": "\"Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "CallExpression",
          "callee": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "Reflect"
            },
            "property": {
              "type": "Identifier",
              "name": "getOwnPropertyDescriptor"
            },
            "computed": false
          },
          "arguments": [
            {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Function"
              },
              "property": {
                "type": "Identifier",
                "name": "prototype"
              },
              "computed": false
            },
            {
              "type": "Literal",
              "value": "arguments",
              "raw": "'arguments'"
            }
          ]
        },
        "property": {
          "type": "Identifier",
          "name": "get"
        },
        "computed": false
      },
      "kind": "init"
    },
    {
      "type": "Property",
      "method": false,
      "shorthand": false,
      "computed": false,
      "key": {
        "type": "Literal",
        "value": "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set",
        "raw": "\"Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set\""
      },
      "value": {
        "type": "MemberExpression",
        "object": {
          "type": "CallExpression",
          "callee": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "Reflect"
            },
            "property": {
              "type": "Identifier",
              "name": "getOwnPropertyDescriptor"
            },
            "computed": false
          },
          "arguments": [
            {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Function"
              },
              "property": {
                "type": "Identifier",
                "name": "prototype"
              },
              "computed": false
            },
            {
              "type": "Literal",
              "value": "arguments",
              "raw": "'arguments'"
            }
          ]
        },
        "property": {
          "type": "Identifier",
          "name": "set"
        },
        "computed": false
      },
      "kind": "init"
    }
  ]
}

exports.unary = {
  "type": "ArrowFunctionExpression",
  "id": null,
  "expression": false,
  "generator": false,
  "async": false,
  "params": [
    {
      "type": "Identifier",
      "name": "operator"
    },
    {
      "type": "Identifier",
      "name": "argument"
    }
  ],
  "body": {
    "type": "BlockStatement",
    "body": [
      {
        "type": "SwitchStatement",
        "discriminant": {
          "type": "Identifier",
          "name": "operator"
        },
        "cases": [
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "UnaryExpression",
                  "operator": "-",
                  "prefix": true,
                  "argument": {
                    "type": "Identifier",
                    "name": "argument"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "-",
              "raw": "\"-\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "UnaryExpression",
                  "operator": "+",
                  "prefix": true,
                  "argument": {
                    "type": "Identifier",
                    "name": "argument"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "+",
              "raw": "\"+\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "UnaryExpression",
                  "operator": "!",
                  "prefix": true,
                  "argument": {
                    "type": "Identifier",
                    "name": "argument"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "!",
              "raw": "\"!\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "UnaryExpression",
                  "operator": "~",
                  "prefix": true,
                  "argument": {
                    "type": "Identifier",
                    "name": "argument"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "~",
              "raw": "\"~\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "UnaryExpression",
                  "operator": "typeof",
                  "prefix": true,
                  "argument": {
                    "type": "Identifier",
                    "name": "argument"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "typeof",
              "raw": "\"typeof\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "UnaryExpression",
                  "operator": "void",
                  "prefix": true,
                  "argument": {
                    "type": "Identifier",
                    "name": "argument"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "void",
              "raw": "\"void\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "UnaryExpression",
                  "operator": "delete",
                  "prefix": true,
                  "argument": {
                    "type": "Identifier",
                    "name": "argument"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "delete",
              "raw": "\"delete\""
            }
          }
        ]
      },
      {
        "type": "ReturnStatement",
        "argument": {
          "type": "UnaryExpression",
          "operator": "void",
          "prefix": true,
          "argument": {
            "type": "Literal",
            "value": 0,
            "raw": "0"
          }
        }
      }
    ]
  }
}

exports.binary = {
  "type": "ArrowFunctionExpression",
  "id": null,
  "expression": false,
  "generator": false,
  "async": false,
  "params": [
    {
      "type": "Identifier",
      "name": "operator"
    },
    {
      "type": "Identifier",
      "name": "argument1"
    },
    {
      "type": "Identifier",
      "name": "argument2"
    }
  ],
  "body": {
    "type": "BlockStatement",
    "body": [
      {
        "type": "SwitchStatement",
        "discriminant": {
          "type": "Identifier",
          "name": "operator"
        },
        "cases": [
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "==",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "==",
              "raw": "\"==\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "!=",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "!=",
              "raw": "\"!=\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "===",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "===",
              "raw": "\"===\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "!==",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "!==",
              "raw": "\"!==\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "<",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "<",
              "raw": "\"<\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "<=",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "<=",
              "raw": "\"<=\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": ">",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": ">",
              "raw": "\">\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": ">=",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": ">=",
              "raw": "\">=\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "<<",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "<<",
              "raw": "\"<<\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": ">>",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": ">>",
              "raw": "\">>\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": ">>>",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": ">>>",
              "raw": "\">>>\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "+",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "+",
              "raw": "\"+\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "-",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "-",
              "raw": "\"-\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "*",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "*",
              "raw": "\"*\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "/",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "/",
              "raw": "\"/\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "%",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "%",
              "raw": "\"%\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "|",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "|",
              "raw": "\"|\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "^",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "^",
              "raw": "\"^\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "&",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "&",
              "raw": "\"&\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "in",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "in",
              "raw": "\"in\""
            }
          },
          {
            "type": "SwitchCase",
            "consequent": [
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "argument1"
                  },
                  "operator": "instanceof",
                  "right": {
                    "type": "Identifier",
                    "name": "argument2"
                  }
                }
              }
            ],
            "test": {
              "type": "Literal",
              "value": "instanceof",
              "raw": "\"instanceof\""
            }
          }
        ]
      },
      {
        "type": "ReturnStatement",
        "argument": {
          "type": "UnaryExpression",
          "operator": "void",
          "prefix": true,
          "argument": {
            "type": "Literal",
            "value": 0,
            "raw": "0"
          }
        }
      }
    ]
  }
}

exports.object = {
  "type": "ArrowFunctionExpression",
  "id": null,
  "expression": false,
  "generator": false,
  "async": false,
  "params": [
    {
      "type": "Identifier",
      "name": "prototype"
    },
    {
      "type": "Identifier",
      "name": "bindings"
    }
  ],
  "body": {
    "type": "BlockStatement",
    "body": [
      {
        "type": "VariableDeclaration",
        "declarations": [
          {
            "type": "VariableDeclarator",
            "id": {
              "type": "Identifier",
              "name": "object"
            },
            "init": {
              "type": "ObjectExpression",
              "properties": [
                {
                  "type": "Property",
                  "method": false,
                  "shorthand": false,
                  "computed": false,
                  "key": {
                    "type": "Identifier",
                    "name": "__proto__"
                  },
                  "value": {
                    "type": "Literal",
                    "value": null,
                    "raw": "null"
                  },
                  "kind": "init"
                }
              ]
            }
          }
        ],
        "kind": "const"
      },
      {
        "type": "ForStatement",
        "init": {
          "type": "VariableDeclaration",
          "declarations": [
            {
              "type": "VariableDeclarator",
              "id": {
                "type": "Identifier",
                "name": "index"
              },
              "init": {
                "type": "Literal",
                "value": 0,
                "raw": "0"
              }
            }
          ],
          "kind": "let"
        },
        "test": {
          "type": "BinaryExpression",
          "left": {
            "type": "Identifier",
            "name": "index"
          },
          "operator": "<",
          "right": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "bindings"
            },
            "property": {
              "type": "Identifier",
              "name": "length"
            },
            "computed": false
          }
        },
        "update": {
          "type": "UpdateExpression",
          "operator": "++",
          "prefix": false,
          "argument": {
            "type": "Identifier",
            "name": "index"
          }
        },
        "body": {
          "type": "BlockStatement",
          "body": [
            {
              "type": "ExpressionStatement",
              "expression": {
                "type": "AssignmentExpression",
                "operator": "=",
                "left": {
                  "type": "MemberExpression",
                  "object": {
                    "type": "Identifier",
                    "name": "object"
                  },
                  "property": {
                    "type": "MemberExpression",
                    "object": {
                      "type": "Identifier",
                      "name": "bindings"
                    },
                    "property": {
                      "type": "Literal",
                      "value": 0,
                      "raw": "0"
                    },
                    "computed": true
                  },
                  "computed": true
                },
                "right": {
                  "type": "MemberExpression",
                  "object": {
                    "type": "Identifier",
                    "name": "bindings"
                  },
                  "property": {
                    "type": "Literal",
                    "value": 1,
                    "raw": "1"
                  },
                  "computed": true
                }
              }
            }
          ]
        }
      },
      {
        "type": "ReturnStatement",
        "argument": {
          "type": "Identifier",
          "name": "object"
        }
      }
    ]
  }
}

