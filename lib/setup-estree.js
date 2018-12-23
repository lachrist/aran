module.exports = {
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "_Array_prototype"
          },
          "init": {
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
          }
        }
      ],
      "kind": "let"
    },
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "_TypeError"
          },
          "init": {
            "type": "Identifier",
            "name": "TypeError"
          }
        }
      ],
      "kind": "let"
    },
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "_ReferenceError"
          },
          "init": {
            "type": "Identifier",
            "name": "ReferenceError"
          }
        }
      ],
      "kind": "let"
    },
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "_Object_keys"
          },
          "init": {
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
          }
        }
      ],
      "kind": "let"
    },
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "_Object_prototype"
          },
          "init": {
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
          }
        }
      ],
      "kind": "let"
    },
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "_Object_getPrototypeOf"
          },
          "init": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "Object"
            },
            "property": {
              "type": "Identifier",
              "name": "getPrototypeOf"
            },
            "computed": false
          }
        }
      ],
      "kind": "let"
    },
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "_Object_create"
          },
          "init": {
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
          }
        }
      ],
      "kind": "let"
    },
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "_Object_setPrototypeOf"
          },
          "init": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "Object"
            },
            "property": {
              "type": "Identifier",
              "name": "setPrototypeOf"
            },
            "computed": false
          }
        }
      ],
      "kind": "let"
    },
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "_Object_getOwnPropertyDescriptor"
          },
          "init": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "Object"
            },
            "property": {
              "type": "Identifier",
              "name": "getOwnPropertyDescriptor"
            },
            "computed": false
          }
        }
      ],
      "kind": "let"
    },
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "_Object_defineProperty"
          },
          "init": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "Object"
            },
            "property": {
              "type": "Identifier",
              "name": "defineProperty"
            },
            "computed": false
          }
        }
      ],
      "kind": "let"
    },
    {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "_eval"
          },
          "init": {
            "type": "Identifier",
            "name": "eval"
          }
        }
      ],
      "kind": "let"
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "builtins"
          },
          "computed": false
        },
        "right": {
          "type": "CallExpression",
          "callee": {
            "type": "Identifier",
            "name": "_Object_create"
          },
          "arguments": [
            {
              "type": "Literal",
              "value": null,
              "raw": "null"
            }
          ]
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Identifier",
            "name": "global"
          },
          "computed": false
        },
        "right": {
          "type": "CallExpression",
          "callee": {
            "type": "Identifier",
            "name": "_eval"
          },
          "arguments": [
            {
              "type": "Literal",
              "value": "this",
              "raw": "\"this\""
            }
          ]
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Identifier",
            "name": "entries"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": {
            "type": "Identifier",
            "name": "entries"
          },
          "expression": false,
          "generator": false,
          "async": false,
          "params": [
            {
              "type": "Identifier",
              "name": "object"
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
                      "name": "array"
                    },
                    "init": {
                      "type": "ArrayExpression",
                      "elements": []
                    }
                  }
                ],
                "kind": "const"
              },
              {
                "type": "ExpressionStatement",
                "expression": {
                  "type": "CallExpression",
                  "callee": {
                    "type": "Identifier",
                    "name": "_Object_setPrototypeOf"
                  },
                  "arguments": [
                    {
                      "type": "Identifier",
                      "name": "array"
                    },
                    {
                      "type": "Literal",
                      "value": null,
                      "raw": "null"
                    }
                  ]
                }
              },
              {
                "type": "VariableDeclaration",
                "declarations": [
                  {
                    "type": "VariableDeclarator",
                    "id": {
                      "type": "Identifier",
                      "name": "keys"
                    },
                    "init": {
                      "type": "CallExpression",
                      "callee": {
                        "type": "Identifier",
                        "name": "_Object_keys"
                      },
                      "arguments": [
                        {
                          "type": "Identifier",
                          "name": "object"
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
                    },
                    {
                      "type": "VariableDeclarator",
                      "id": {
                        "type": "Identifier",
                        "name": "length"
                      },
                      "init": {
                        "type": "MemberExpression",
                        "object": {
                          "type": "Identifier",
                          "name": "keys"
                        },
                        "property": {
                          "type": "Identifier",
                          "name": "length"
                        },
                        "computed": false
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
                    "type": "Identifier",
                    "name": "length"
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
                  "type": "ExpressionStatement",
                  "expression": {
                    "type": "AssignmentExpression",
                    "operator": "=",
                    "left": {
                      "type": "MemberExpression",
                      "object": {
                        "type": "Identifier",
                        "name": "array"
                      },
                      "property": {
                        "type": "Identifier",
                        "name": "index"
                      },
                      "computed": true
                    },
                    "right": {
                      "type": "ArrayExpression",
                      "elements": [
                        {
                          "type": "Identifier",
                          "name": "key"
                        },
                        {
                          "type": "MemberExpression",
                          "object": {
                            "type": "Identifier",
                            "name": "object"
                          },
                          "property": {
                            "type": "Identifier",
                            "name": "key"
                          },
                          "computed": true
                        }
                      ]
                    }
                  }
                }
              },
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "CallExpression",
                  "callee": {
                    "type": "Identifier",
                    "name": "_Object_setPrototypeOf"
                  },
                  "arguments": [
                    {
                      "type": "Identifier",
                      "name": "array"
                    },
                    {
                      "type": "Identifier",
                      "name": "_Array_prototype"
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Identifier",
            "name": "fromEntries"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": {
            "type": "Identifier",
            "name": "fromEntries"
          },
          "expression": false,
          "generator": false,
          "async": false,
          "params": [
            {
              "type": "Identifier",
              "name": "array"
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
                      "type": "CallExpression",
                      "callee": {
                        "type": "Identifier",
                        "name": "_Object_create"
                      },
                      "arguments": [
                        {
                          "type": "Literal",
                          "value": null,
                          "raw": "null"
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
                    },
                    {
                      "type": "VariableDeclarator",
                      "id": {
                        "type": "Identifier",
                        "name": "length"
                      },
                      "init": {
                        "type": "MemberExpression",
                        "object": {
                          "type": "Identifier",
                          "name": "array"
                        },
                        "property": {
                          "type": "Identifier",
                          "name": "length"
                        },
                        "computed": false
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
                    "type": "Identifier",
                    "name": "length"
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
                          "type": "MemberExpression",
                          "object": {
                            "type": "Identifier",
                            "name": "array"
                          },
                          "property": {
                            "type": "Identifier",
                            "name": "index"
                          },
                          "computed": true
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
                        "type": "MemberExpression",
                        "object": {
                          "type": "Identifier",
                          "name": "array"
                        },
                        "property": {
                          "type": "Identifier",
                          "name": "index"
                        },
                        "computed": true
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
              },
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "CallExpression",
                  "callee": {
                    "type": "Identifier",
                    "name": "_Object_setPrototypeOf"
                  },
                  "arguments": [
                    {
                      "type": "Identifier",
                      "name": "object"
                    },
                    {
                      "type": "Identifier",
                      "name": "_Object_prototype"
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Identifier",
            "name": "AranDefineDataProperty"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": {
            "type": "Identifier",
            "name": "AranDefineDataProperty"
          },
          "expression": false,
          "generator": false,
          "async": false,
          "params": [
            {
              "type": "Identifier",
              "name": "object"
            },
            {
              "type": "Identifier",
              "name": "key"
            },
            {
              "type": "Identifier",
              "name": "value"
            },
            {
              "type": "Identifier",
              "name": "writable"
            },
            {
              "type": "Identifier",
              "name": "enumerable"
            },
            {
              "type": "Identifier",
              "name": "configurable"
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
                      "name": "descriptor"
                    },
                    "init": {
                      "type": "ObjectExpression",
                      "properties": [
                        {
                          "type": "Property",
                          "method": false,
                          "shorthand": true,
                          "computed": false,
                          "key": {
                            "type": "Identifier",
                            "name": "value"
                          },
                          "kind": "init",
                          "value": {
                            "type": "Identifier",
                            "name": "value"
                          }
                        },
                        {
                          "type": "Property",
                          "method": false,
                          "shorthand": true,
                          "computed": false,
                          "key": {
                            "type": "Identifier",
                            "name": "writable"
                          },
                          "kind": "init",
                          "value": {
                            "type": "Identifier",
                            "name": "writable"
                          }
                        },
                        {
                          "type": "Property",
                          "method": false,
                          "shorthand": true,
                          "computed": false,
                          "key": {
                            "type": "Identifier",
                            "name": "enumerable"
                          },
                          "kind": "init",
                          "value": {
                            "type": "Identifier",
                            "name": "enumerable"
                          }
                        },
                        {
                          "type": "Property",
                          "method": false,
                          "shorthand": true,
                          "computed": false,
                          "key": {
                            "type": "Identifier",
                            "name": "configurable"
                          },
                          "kind": "init",
                          "value": {
                            "type": "Identifier",
                            "name": "configurable"
                          }
                        }
                      ]
                    }
                  }
                ],
                "kind": "const"
              },
              {
                "type": "ExpressionStatement",
                "expression": {
                  "type": "CallExpression",
                  "callee": {
                    "type": "Identifier",
                    "name": "_Object_setPrototypeOf"
                  },
                  "arguments": [
                    {
                      "type": "Identifier",
                      "name": "descriptor"
                    },
                    {
                      "type": "Literal",
                      "value": null,
                      "raw": "null"
                    }
                  ]
                }
              },
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "CallExpression",
                  "callee": {
                    "type": "Identifier",
                    "name": "_Object_defineProperty"
                  },
                  "arguments": [
                    {
                      "type": "Identifier",
                      "name": "object"
                    },
                    {
                      "type": "Identifier",
                      "name": "key"
                    },
                    {
                      "type": "Identifier",
                      "name": "descriptor"
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Identifier",
            "name": "AranDefineAccessorProperty"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": {
            "type": "Identifier",
            "name": "AranDefineDataProperty"
          },
          "expression": false,
          "generator": false,
          "async": false,
          "params": [
            {
              "type": "Identifier",
              "name": "object"
            },
            {
              "type": "Identifier",
              "name": "key"
            },
            {
              "type": "Identifier",
              "name": "get"
            },
            {
              "type": "Identifier",
              "name": "set"
            },
            {
              "type": "Identifier",
              "name": "enumerable"
            },
            {
              "type": "Identifier",
              "name": "configurable"
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
                      "name": "descriptor"
                    },
                    "init": {
                      "type": "ObjectExpression",
                      "properties": [
                        {
                          "type": "Property",
                          "method": false,
                          "shorthand": true,
                          "computed": false,
                          "key": {
                            "type": "Identifier",
                            "name": "get"
                          },
                          "kind": "init",
                          "value": {
                            "type": "Identifier",
                            "name": "get"
                          }
                        },
                        {
                          "type": "Property",
                          "method": false,
                          "shorthand": true,
                          "computed": false,
                          "key": {
                            "type": "Identifier",
                            "name": "set"
                          },
                          "kind": "init",
                          "value": {
                            "type": "Identifier",
                            "name": "set"
                          }
                        },
                        {
                          "type": "Property",
                          "method": false,
                          "shorthand": true,
                          "computed": false,
                          "key": {
                            "type": "Identifier",
                            "name": "enumerable"
                          },
                          "kind": "init",
                          "value": {
                            "type": "Identifier",
                            "name": "enumerable"
                          }
                        },
                        {
                          "type": "Property",
                          "method": false,
                          "shorthand": true,
                          "computed": false,
                          "key": {
                            "type": "Identifier",
                            "name": "configurable"
                          },
                          "kind": "init",
                          "value": {
                            "type": "Identifier",
                            "name": "configurable"
                          }
                        }
                      ]
                    }
                  }
                ],
                "kind": "const"
              },
              {
                "type": "ExpressionStatement",
                "expression": {
                  "type": "CallExpression",
                  "callee": {
                    "type": "Identifier",
                    "name": "_Object_setPrototypeOf"
                  },
                  "arguments": [
                    {
                      "type": "Identifier",
                      "name": "descriptor"
                    },
                    {
                      "type": "Literal",
                      "value": null,
                      "raw": "null"
                    }
                  ]
                }
              },
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "CallExpression",
                  "callee": {
                    "type": "Identifier",
                    "name": "_Object_defineProperty"
                  },
                  "arguments": [
                    {
                      "type": "Identifier",
                      "name": "object"
                    },
                    {
                      "type": "Identifier",
                      "name": "key"
                    },
                    {
                      "type": "Identifier",
                      "name": "descriptor"
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Identifier",
            "name": "AranThrowTypeError"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": {
            "type": "Identifier",
            "name": "AranThrowReferenceError"
          },
          "expression": false,
          "generator": false,
          "async": false,
          "params": [
            {
              "type": "Identifier",
              "name": "message"
            }
          ],
          "body": {
            "type": "BlockStatement",
            "body": [
              {
                "type": "ThrowStatement",
                "argument": {
                  "type": "NewExpression",
                  "callee": {
                    "type": "Identifier",
                    "name": "_TypeError"
                  },
                  "arguments": [
                    {
                      "type": "Identifier",
                      "name": "message"
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Identifier",
            "name": "AranThrowReferenceError"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": {
            "type": "Identifier",
            "name": "AranThrowTypeError"
          },
          "expression": false,
          "generator": false,
          "async": false,
          "params": [
            {
              "type": "Identifier",
              "name": "message"
            }
          ],
          "body": {
            "type": "BlockStatement",
            "body": [
              {
                "type": "ThrowStatement",
                "argument": {
                  "type": "NewExpression",
                  "callee": {
                    "type": "Identifier",
                    "name": "_ReferenceError"
                  },
                  "arguments": [
                    {
                      "type": "Identifier",
                      "name": "message"
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Identifier",
            "name": "AranRest"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": {
            "type": "Identifier",
            "name": "AranRest"
          },
          "expression": false,
          "generator": false,
          "async": false,
          "params": [
            {
              "type": "Identifier",
              "name": "iterator"
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
                      "name": "array"
                    },
                    "init": {
                      "type": "ArrayExpression",
                      "elements": []
                    }
                  }
                ],
                "kind": "let"
              },
              {
                "type": "VariableDeclaration",
                "declarations": [
                  {
                    "type": "VariableDeclarator",
                    "id": {
                      "type": "Identifier",
                      "name": "step"
                    },
                    "init": {
                      "type": "Literal",
                      "value": null,
                      "raw": "null"
                    }
                  }
                ],
                "kind": "let"
              },
              {
                "type": "WhileStatement",
                "test": {
                  "type": "UnaryExpression",
                  "operator": "!",
                  "prefix": true,
                  "argument": {
                    "type": "MemberExpression",
                    "object": {
                      "type": "AssignmentExpression",
                      "operator": "=",
                      "left": {
                        "type": "Identifier",
                        "name": "step"
                      },
                      "right": {
                        "type": "CallExpression",
                        "callee": {
                          "type": "MemberExpression",
                          "object": {
                            "type": "Identifier",
                            "name": "iterator"
                          },
                          "property": {
                            "type": "Identifier",
                            "name": "next"
                          },
                          "computed": false
                        },
                        "arguments": []
                      }
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "done"
                    },
                    "computed": false
                  }
                },
                "body": {
                  "type": "ExpressionStatement",
                  "expression": {
                    "type": "AssignmentExpression",
                    "operator": "=",
                    "left": {
                      "type": "MemberExpression",
                      "object": {
                        "type": "Identifier",
                        "name": "array"
                      },
                      "property": {
                        "type": "MemberExpression",
                        "object": {
                          "type": "Identifier",
                          "name": "array"
                        },
                        "property": {
                          "type": "Identifier",
                          "name": "length"
                        },
                        "computed": false
                      },
                      "computed": true
                    },
                    "right": {
                      "type": "MemberExpression",
                      "object": {
                        "type": "Identifier",
                        "name": "step"
                      },
                      "property": {
                        "type": "Identifier",
                        "name": "value"
                      },
                      "computed": false
                    }
                  }
                }
              },
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "Identifier",
                  "name": "array"
                }
              }
            ]
          }
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Identifier",
            "name": "AranHold"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": {
            "type": "Identifier",
            "name": "AranHold"
          },
          "expression": false,
          "generator": false,
          "async": false,
          "params": [
            {
              "type": "Identifier",
              "name": "object"
            },
            {
              "type": "Identifier",
              "name": "name"
            }
          ],
          "body": {
            "type": "BlockStatement",
            "body": [
              {
                "type": "WhileStatement",
                "test": {
                  "type": "Identifier",
                  "name": "object"
                },
                "body": {
                  "type": "BlockStatement",
                  "body": [
                    {
                      "type": "IfStatement",
                      "test": {
                        "type": "CallExpression",
                        "callee": {
                          "type": "Identifier",
                          "name": "_Object_getOwnPropertyDescriptor"
                        },
                        "arguments": [
                          {
                            "type": "Identifier",
                            "name": "object"
                          },
                          {
                            "type": "Identifier",
                            "name": "name"
                          }
                        ]
                      },
                      "consequent": {
                        "type": "ReturnStatement",
                        "argument": {
                          "type": "Literal",
                          "value": true,
                          "raw": "true"
                        }
                      },
                      "alternate": null
                    },
                    {
                      "type": "ExpressionStatement",
                      "expression": {
                        "type": "AssignmentExpression",
                        "operator": "=",
                        "left": {
                          "type": "Identifier",
                          "name": "object"
                        },
                        "right": {
                          "type": "CallExpression",
                          "callee": {
                            "type": "Identifier",
                            "name": "_Object_getPrototypeOf"
                          },
                          "arguments": [
                            {
                              "type": "Identifier",
                              "name": "object"
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              },
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "Literal",
                  "value": false,
                  "raw": "false"
                }
              }
            ]
          }
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Identifier",
            "name": "AranEnumerate"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": {
            "type": "Identifier",
            "name": "AranEnumerate"
          },
          "expression": false,
          "generator": false,
          "async": false,
          "params": [
            {
              "type": "Identifier",
              "name": "object"
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
                      "name": "keys"
                    },
                    "init": {
                      "type": "ArrayExpression",
                      "elements": []
                    }
                  }
                ],
                "kind": "const"
              },
              {
                "type": "ForInStatement",
                "left": {
                  "type": "VariableDeclaration",
                  "declarations": [
                    {
                      "type": "VariableDeclarator",
                      "id": {
                        "type": "Identifier",
                        "name": "key"
                      },
                      "init": null
                    }
                  ],
                  "kind": "let"
                },
                "right": {
                  "type": "Identifier",
                  "name": "object"
                },
                "body": {
                  "type": "ExpressionStatement",
                  "expression": {
                    "type": "AssignmentExpression",
                    "operator": "=",
                    "left": {
                      "type": "MemberExpression",
                      "object": {
                        "type": "Identifier",
                        "name": "keys"
                      },
                      "property": {
                        "type": "MemberExpression",
                        "object": {
                          "type": "Identifier",
                          "name": "keys"
                        },
                        "property": {
                          "type": "Identifier",
                          "name": "length"
                        },
                        "computed": false
                      },
                      "computed": true
                    },
                    "right": {
                      "type": "Identifier",
                      "name": "key"
                    }
                  }
                }
              },
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "Identifier",
                  "name": "keys"
                }
              }
            ]
          }
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "eval",
            "raw": "\"eval\""
          },
          "computed": true
        },
        "right": {
          "type": "Identifier",
          "name": "eval"
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "RegExp",
            "raw": "\"RegExp\""
          },
          "computed": true
        },
        "right": {
          "type": "Identifier",
          "name": "RegExp"
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Reflect.get",
            "raw": "\"Reflect.get\""
          },
          "computed": true
        },
        "right": {
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
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Reflect.set",
            "raw": "\"Reflect.set\""
          },
          "computed": true
        },
        "right": {
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
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Reflect.construct",
            "raw": "\"Reflect.construct\""
          },
          "computed": true
        },
        "right": {
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
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Reflect.apply",
            "raw": "\"Reflect.apply\""
          },
          "computed": true
        },
        "right": {
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
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Reflect.deleteProperty",
            "raw": "\"Reflect.deleteProperty\""
          },
          "computed": true
        },
        "right": {
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
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Symbol.unscopables",
            "raw": "\"Symbol.unscopables\""
          },
          "computed": true
        },
        "right": {
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
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Symbol.iterator",
            "raw": "\"Symbol.iterator\""
          },
          "computed": true
        },
        "right": {
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
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Object",
            "raw": "\"Object\""
          },
          "computed": true
        },
        "right": {
          "type": "Identifier",
          "name": "Object"
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Object.setPrototypeOf",
            "raw": "\"Object.setPrototypeOf\""
          },
          "computed": true
        },
        "right": {
          "type": "MemberExpression",
          "object": {
            "type": "Identifier",
            "name": "Object"
          },
          "property": {
            "type": "Identifier",
            "name": "setPrototypeOf"
          },
          "computed": false
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Object.create",
            "raw": "\"Object.create\""
          },
          "computed": true
        },
        "right": {
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
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Object.prototype",
            "raw": "\"Object.prototype\""
          },
          "computed": true
        },
        "right": {
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
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Array.of",
            "raw": "\"Array.of\""
          },
          "computed": true
        },
        "right": {
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
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Array.prototype.concat",
            "raw": "\"Array.prototype.concat\""
          },
          "computed": true
        },
        "right": {
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
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Array.prototype[Symbol.iterator]",
            "raw": "\"Array.prototype[Symbol.iterator]\""
          },
          "computed": true
        },
        "right": {
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
          "computed": true
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Function.prototype",
            "raw": "\"Function.prototype\""
          },
          "computed": true
        },
        "right": {
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
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Object.getOwnPropertyDescriptor(Function.prototype, \"arguments\").get",
            "raw": "\"Object.getOwnPropertyDescriptor(Function.prototype, \\\"arguments\\\").get\""
          },
          "computed": true
        },
        "right": {
          "type": "MemberExpression",
          "object": {
            "type": "CallExpression",
            "callee": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Object"
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
                "raw": "\"arguments\""
              }
            ]
          },
          "property": {
            "type": "Identifier",
            "name": "get"
          },
          "computed": false
        }
      }
    },
    {
      "type": "ExpressionStatement",
      "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "builtins"
            },
            "computed": false
          },
          "property": {
            "type": "Literal",
            "value": "Object.getOwnPropertyDescriptor(Function.prototype, \"arguments\").set",
            "raw": "\"Object.getOwnPropertyDescriptor(Function.prototype, \\\"arguments\\\").set\""
          },
          "computed": true
        },
        "right": {
          "type": "MemberExpression",
          "object": {
            "type": "CallExpression",
            "callee": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Object"
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
                "raw": "\"arguments\""
              }
            ]
          },
          "property": {
            "type": "Identifier",
            "name": "set"
          },
          "computed": false
        }
      }
    }
  ],
  "sourceType": "script"
}