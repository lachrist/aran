module.exports = {
  "type": "Program",
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
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_eval"
          },
          "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_global"
          },
          "computed": false
        },
        "right": {
          "type": "CallExpression",
          "callee": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "NAMESPACE"
            },
            "property": {
              "type": "Identifier",
              "name": "_builtin_eval"
            },
            "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_ReferenceError"
          },
          "computed": false
        },
        "right": {
          "type": "Identifier",
          "name": "ReferenceError"
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_TypeError"
          },
          "computed": false
        },
        "right": {
          "type": "Identifier",
          "name": "TypeError"
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_Object"
          },
          "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_RegExp"
          },
          "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_Reflect_has"
          },
          "computed": false
        },
        "right": {
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_Reflect_get"
          },
          "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_Reflect_set"
          },
          "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_Reflect_apply"
          },
          "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_Reflect_construct"
          },
          "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_Reflect_deleteProperty"
          },
          "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_Symbol_unscopables"
          },
          "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_Symbol_iterator"
          },
          "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_Array_of"
          },
          "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_Object_getOwnPropertyNames"
          },
          "computed": false
        },
        "right": {
          "type": "MemberExpression",
          "object": {
            "type": "Identifier",
            "name": "Object"
          },
          "property": {
            "type": "Identifier",
            "name": "getOwnPropertyNames"
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_Object_defineProperty"
          },
          "computed": false
        },
        "right": {
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
            "name": "_builtin_Object_keys"
          },
          "computed": false
        },
        "right": {
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
            "name": "_builtin_AranThrowReferenceError"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": null,
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
                    "type": "MemberExpression",
                    "object": {
                      "type": "Identifier",
                      "name": "NAMESPACE"
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "_builtin_ReferenceError"
                    },
                    "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_AranThrowTypeError"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": null,
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
                    "type": "MemberExpression",
                    "object": {
                      "type": "Identifier",
                      "name": "NAMESPACE"
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "_builtin_TypeError"
                    },
                    "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_AranHold"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": null,
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
                      "type": "VariableDeclaration",
                      "declarations": [
                        {
                          "type": "VariableDeclarator",
                          "id": {
                            "type": "Identifier",
                            "name": "names"
                          },
                          "init": {
                            "type": "CallExpression",
                            "callee": {
                              "type": "MemberExpression",
                              "object": {
                                "type": "Identifier",
                                "name": "NAMESPACE"
                              },
                              "property": {
                                "type": "Identifier",
                                "name": "_builtin_Object_getOwnPropertyNames"
                              },
                              "computed": false
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
                      "kind": "var"
                    },
                    {
                      "type": "VariableDeclaration",
                      "declarations": [
                        {
                          "type": "VariableDeclarator",
                          "id": {
                            "type": "Identifier",
                            "name": "index"
                          },
                          "init": {
                            "type": "MemberExpression",
                            "object": {
                              "type": "Identifier",
                              "name": "names"
                            },
                            "property": {
                              "type": "Identifier",
                              "name": "length"
                            },
                            "computed": false
                          }
                        }
                      ],
                      "kind": "var"
                    },
                    {
                      "type": "WhileStatement",
                      "test": {
                        "type": "UpdateExpression",
                        "operator": "--",
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
                            "type": "IfStatement",
                            "test": {
                              "type": "BinaryExpression",
                              "left": {
                                "type": "MemberExpression",
                                "object": {
                                  "type": "Identifier",
                                  "name": "names"
                                },
                                "property": {
                                  "type": "Identifier",
                                  "name": "index"
                                },
                                "computed": true
                              },
                              "operator": "===",
                              "right": {
                                "type": "Identifier",
                                "name": "name"
                              }
                            },
                            "consequent": {
                              "type": "BlockStatement",
                              "body": [
                                {
                                  "type": "ReturnStatement",
                                  "argument": {
                                    "type": "Literal",
                                    "value": true,
                                    "raw": "true"
                                  }
                                }
                              ]
                            },
                            "alternate": null
                          }
                        ]
                      }
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
                            "type": "MemberExpression",
                            "object": {
                              "type": "Identifier",
                              "name": "NAMESPACE"
                            },
                            "property": {
                              "type": "Identifier",
                              "name": "_builtin_Object_getPrototypeOf"
                            },
                            "computed": false
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_AranRest"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": null,
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
                      "name": "result"
                    },
                    "init": {
                      "type": "ArrayExpression",
                      "elements": []
                    }
                  }
                ],
                "kind": "var"
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
                        "name": "step"
                      },
                      "init": {
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
                    }
                  ],
                  "kind": "var"
                },
                "test": {
                  "type": "UnaryExpression",
                  "operator": "!",
                  "prefix": true,
                  "argument": {
                    "type": "MemberExpression",
                    "object": {
                      "type": "Identifier",
                      "name": "step"
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "done"
                    },
                    "computed": false
                  }
                },
                "update": {
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
                            "name": "result"
                          },
                          "property": {
                            "type": "MemberExpression",
                            "object": {
                              "type": "Identifier",
                              "name": "result"
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
                  ]
                }
              },
              {
                "type": "ReturnStatement",
                "argument": {
                  "type": "Identifier",
                  "name": "result"
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_AranInitializeObject"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
          "id": null,
          "expression": false,
          "generator": false,
          "async": false,
          "params": [],
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
                      "properties": []
                    }
                  }
                ],
                "kind": "var"
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
                          "name": "arguments"
                        },
                        "property": {
                          "type": "Identifier",
                          "name": "length"
                        },
                        "computed": false
                      }
                    }
                  ],
                  "kind": "var"
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
                  "type": "AssignmentExpression",
                  "operator": "+=",
                  "left": {
                    "type": "Identifier",
                    "name": "index"
                  },
                  "right": {
                    "type": "Literal",
                    "value": 3,
                    "raw": "3"
                  }
                },
                "body": {
                  "type": "BlockStatement",
                  "body": [
                    {
                      "type": "ExpressionStatement",
                      "expression": {
                        "type": "CallExpression",
                        "callee": {
                          "type": "MemberExpression",
                          "object": {
                            "type": "Identifier",
                            "name": "NAMESPACE"
                          },
                          "property": {
                            "type": "Identifier",
                            "name": "_builtin_Object_defineProperty"
                          },
                          "computed": false
                        },
                        "arguments": [
                          {
                            "type": "Identifier",
                            "name": "object"
                          },
                          {
                            "type": "MemberExpression",
                            "object": {
                              "type": "Identifier",
                              "name": "arguments"
                            },
                            "property": {
                              "type": "BinaryExpression",
                              "left": {
                                "type": "Identifier",
                                "name": "index"
                              },
                              "operator": "+",
                              "right": {
                                "type": "Literal",
                                "value": 1,
                                "raw": "1"
                              }
                            },
                            "computed": true
                          },
                          {
                            "type": "ConditionalExpression",
                            "test": {
                              "type": "BinaryExpression",
                              "left": {
                                "type": "MemberExpression",
                                "object": {
                                  "type": "Identifier",
                                  "name": "arguments"
                                },
                                "property": {
                                  "type": "Identifier",
                                  "name": "index"
                                },
                                "computed": true
                              },
                              "operator": "===",
                              "right": {
                                "type": "Literal",
                                "value": "init",
                                "raw": "\"init\""
                              }
                            },
                            "consequent": {
                              "type": "ObjectExpression",
                              "properties": [
                                {
                                  "type": "Property",
                                  "method": false,
                                  "shorthand": false,
                                  "computed": false,
                                  "key": {
                                    "type": "Identifier",
                                    "name": "configurable"
                                  },
                                  "value": {
                                    "type": "Literal",
                                    "value": true,
                                    "raw": "true"
                                  },
                                  "kind": "init"
                                },
                                {
                                  "type": "Property",
                                  "method": false,
                                  "shorthand": false,
                                  "computed": false,
                                  "key": {
                                    "type": "Identifier",
                                    "name": "writable"
                                  },
                                  "value": {
                                    "type": "Literal",
                                    "value": true,
                                    "raw": "true"
                                  },
                                  "kind": "init"
                                },
                                {
                                  "type": "Property",
                                  "method": false,
                                  "shorthand": false,
                                  "computed": false,
                                  "key": {
                                    "type": "Identifier",
                                    "name": "enumerable"
                                  },
                                  "value": {
                                    "type": "Literal",
                                    "value": true,
                                    "raw": "true"
                                  },
                                  "kind": "init"
                                },
                                {
                                  "type": "Property",
                                  "method": false,
                                  "shorthand": false,
                                  "computed": false,
                                  "key": {
                                    "type": "Identifier",
                                    "name": "value"
                                  },
                                  "value": {
                                    "type": "MemberExpression",
                                    "object": {
                                      "type": "Identifier",
                                      "name": "arguments"
                                    },
                                    "property": {
                                      "type": "BinaryExpression",
                                      "left": {
                                        "type": "Identifier",
                                        "name": "index"
                                      },
                                      "operator": "+",
                                      "right": {
                                        "type": "Literal",
                                        "value": 2,
                                        "raw": "2"
                                      }
                                    },
                                    "computed": true
                                  },
                                  "kind": "init"
                                }
                              ]
                            },
                            "alternate": {
                              "type": "ObjectExpression",
                              "properties": [
                                {
                                  "type": "Property",
                                  "method": false,
                                  "shorthand": false,
                                  "computed": false,
                                  "key": {
                                    "type": "Identifier",
                                    "name": "configurable"
                                  },
                                  "value": {
                                    "type": "Literal",
                                    "value": true,
                                    "raw": "true"
                                  },
                                  "kind": "init"
                                },
                                {
                                  "type": "Property",
                                  "method": false,
                                  "shorthand": false,
                                  "computed": false,
                                  "key": {
                                    "type": "Identifier",
                                    "name": "writable"
                                  },
                                  "value": {
                                    "type": "Literal",
                                    "value": true,
                                    "raw": "true"
                                  },
                                  "kind": "init"
                                },
                                {
                                  "type": "Property",
                                  "method": false,
                                  "shorthand": false,
                                  "computed": true,
                                  "key": {
                                    "type": "MemberExpression",
                                    "object": {
                                      "type": "Identifier",
                                      "name": "arguments"
                                    },
                                    "property": {
                                      "type": "Identifier",
                                      "name": "index"
                                    },
                                    "computed": true
                                  },
                                  "value": {
                                    "type": "MemberExpression",
                                    "object": {
                                      "type": "Identifier",
                                      "name": "arguments"
                                    },
                                    "property": {
                                      "type": "BinaryExpression",
                                      "left": {
                                        "type": "Identifier",
                                        "name": "index"
                                      },
                                      "operator": "+",
                                      "right": {
                                        "type": "Literal",
                                        "value": 2,
                                        "raw": "2"
                                      }
                                    },
                                    "computed": true
                                  },
                                  "kind": "init"
                                }
                              ]
                            }
                          }
                        ]
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_AranUnary"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
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
                "type": "ThrowStatement",
                "argument": {
                  "type": "NewExpression",
                  "callee": {
                    "type": "MemberExpression",
                    "object": {
                      "type": "Identifier",
                      "name": "NAMESPACE"
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "_builtin_TypeError"
                    },
                    "computed": false
                  },
                  "arguments": [
                    {
                      "type": "BinaryExpression",
                      "left": {
                        "type": "Literal",
                        "value": "Unrecognized operator: ",
                        "raw": "\"Unrecognized operator: \""
                      },
                      "operator": "+",
                      "right": {
                        "type": "Identifier",
                        "name": "operator"
                      }
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
            "type": "Identifier",
            "name": "NAMESPACE"
          },
          "property": {
            "type": "Identifier",
            "name": "_builtin_AranBinary"
          },
          "computed": false
        },
        "right": {
          "type": "FunctionExpression",
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
              "name": "left"
            },
            {
              "type": "Identifier",
              "name": "right"
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
                            "name": "left"
                          },
                          "operator": "==",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "!=",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "===",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "!==",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "<",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "<=",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": ">",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": ">=",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "<<",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": ">>",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": ">>>",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "+",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "-",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "*",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "/",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "%",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "|",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "^",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "&",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "in",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
                            "name": "left"
                          },
                          "operator": "instanceof",
                          "right": {
                            "type": "Identifier",
                            "name": "right"
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
              }
            ]
          }
        }
      }
    }
  ],
  "sourceType": "script"
}