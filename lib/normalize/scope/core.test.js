"use strict";

const Assert = require("assert").strict;
const Core = require("./core.js");
const State = require("../state.js");
const Build = require("../../build.js");

const tag1 = {};
const context1 = {};
const result1 = {};
const result3 = {};

const nodes = [];
const serials = new Map();
const evals = {__proto__:null};
const program = {
  sourceType: "script",
  type: "Program",
  body: []
};
const aran_expression = Build.primitive(123);
const aran_statement = ["Expression", aran_expression]

State.session({nodes, serials, evals}, program, () => {

  // is_strict //
  [true, false].forEach((is_use_strict_1) => {
    Assert.deepEqual(Core.extend_global(is_use_strict_1, (scope) => {
      Assert.equal(Core.is_strict(scope), is_use_strict_1);
      [true, false].forEach((is_use_strict_2) => {
        Assert.deepEqual(Core.extend_closure(scope, is_use_strict_2, (scope) => {
          Assert.equal(Core.is_strict(scope), is_use_strict_1 || is_use_strict_2);
          return [];
        }), Build.BLOCK([], []));
      });
      return [];
    }), Build.BLOCK([], []));
  });

  // get_depth //
  Assert.deepEqual(Core.extend_global(false, (scope) => {
    Assert.equal(Core.get_depth(scope), 1);
    Assert.deepEqual(Core.extend_regular(scope, (scope) => {
      Assert.equal(Core.get_depth(scope), 2);
      return [];
    }), Build.BLOCK([], []));
    return [];
  }), Build.BLOCK([], []));

  // declare, is_declared && initialized //
  Assert.deepEqual(Core.extend_global(false, (scope) => {
    Assert.throws(() => Core.initialize(scope, "x", "tag"), new Error("Cannot initialize undeclared identifier"));
    Assert.equal(Core.is_declared(scope, "x"), false);
    Assert.equal(Core.declare(scope, "x", "tag"), undefined);
    Assert.throws(() => Core.declare(scope, "x", "tag"), new Error("Identifier already declared"));
    Assert.equal(Core.is_declared(scope, "x"), true);
    const aran_expression = Core.initialize(scope, "x", Build.primitive(123));
    Assert.throws(() => Core.initialize(scope, "x", Build.primitive(123)), new Error("Identifier already initialized"));
    return [Build.Expression(aran_expression)];
  }), Build.BLOCK(["$x"], [Build.Expression(Build.write("$x", Build.primitive(123)))]));

  // declare && uninitialized //
  Assert.throws(() => Core.extend_global(false, (scope) => {
    Assert.equal(Core.is_declared(scope, "x"), false);
    Assert.equal(Core.declare(scope, "x", "tag"), undefined);
    Assert.equal(Core.is_declared(scope, "x"), true);
    Assert.throws(() => Core.declare(scope, "x", "tag"), new Error("Identifier already declared"));
    return [];
  }), new Error("Uninitialized identifier"));
  
  // initialize //
  Assert.deepEqual(Core.extend_global(false, (scope) => {
    Assert.throws(() => Core.initialize(scope, "x", Build.primitive(123)), new Error("Cannot initialize undeclared identifier"));
    Assert.equal(Core.declare(scope, "x", "tag"), undefined);
    const aran_expression = Core.initialize(scope, "x", Build.primitive(123));
    Assert.throws(() => Core.initialize(scope, "x", "tag"), new Error("Identifier already initialized"));
    return [Build.Expression(aran_expression)];
  }), Build.BLOCK(["$x"], [Build.Expression(Build.write("$x", Build.primitive(123)))]));

  // parameter //
  Assert.deepEqual(Core.extend_global(false, (scope) => {
    return [Build.Expression(Core.parameter(scope, "new.target"))];
  }), Build.BLOCK([], [Build.Expression(Build.read("NEW_TARGET"))]));

  // lookup-miss && shadowing //
  Assert.deepEqual(Core.extend_global(false, (scope) => {
    const aran_expression = Core.lookup(scope, "x", {
      on_miss: (context) => {
        Assert.equal(context, "ctx");
        return Build.primitive(123);
      },
      on_dynamic_frame: Assert.fail.bind(Assert),
      on_dead_hit: Assert.fail.bind(Assert),
      on_live_hit: Assert.fail.bind(Assert)
    }, "ctx");
    Assert.throws(() => Core.declare(scope, "x", "tag"), new Error("Illegal identifier shadowing"));
    Assert.equal(Core.declare(scope, "y", "tag"), undefined);
    return [
      Build.Expression(aran_expression),
      Build.Expression(Core.initialize(scope, "y", Build.primitive(456)))
    ];
  }), Build.BLOCK(["$y"], [
    Build.Expression(Build.primitive(123)),
    Build.Expression(Build.write("$y", Build.primitive(456)))
  ]));

  // lookup-live //
  Assert.deepEqual(Core.extend_global(false, (scope) => {
    Assert.equal(Core.declare(scope, "x", "tag"), undefined);
    return [
      Build.Expression(Core.initialize(scope, "x", Build.primitive(123))),
      Build.Expression(Core.lookup(scope, "x", {
        on_miss: Assert.fail.bind(Assert),
        on_dynamic_frame: Assert.fail.bind(Assert),
        on_dead_hit: Assert.fail.bind(Assert),
        on_live_hit: (context, tag, access) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Build.sequence(access(null), access(Build.primitive(456)));
        }
      }, "ctx"))
    ];
  }), Build.BLOCK(["$x"], [
    Build.Expression(Build.write("$x", Build.primitive(123))),
    Build.Expression(Build.sequence(Build.read("$x"), Build.write("$x", Build.primitive(456))))
  ]));

  // lookup-hit-dead-static //
  Assert.deepEqual(Core.extend_global(false, (scope) => {
    Assert.equal(Core.declare(scope, "x", "tag"), undefined);
    return [
      Build.Expression(Core.lookup(scope, "x", {
        on_miss: Assert.fail.bind(Assert),
        on_dynamic_frame: Assert.fail.bind(Assert),
        on_dead_hit: (context, tag) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Build.primitive(456);
        },
        on_live_hit: Assert.fail.bind(Assert)
      }, "ctx")),
      Build.Expression(Core.initialize(scope, "x", Build.primitive(123)))
    ];
  }), Build.BLOCK(["$x"], [
    Build.Expression(Build.primitive(456)),
    Build.Expression(Build.write("$x", Build.primitive(123)))
  ]));
  
  // lookup-hit-dead-dynamic //
  Assert.deepEqual(Core.extend_global(false, (scope) => {
    Assert.equal(Core.declare(scope, "x", "tag"), undefined);
    Assert.deepEqual(Core.extend_closure(scope, false, (scope) => {
      return [
        Build.Expression(Core.lookup(scope, "x", {
          on_miss: Assert.fail.bind(Assert),
          on_dynamic_frame: Assert.fail.bind(Assert),
          on_dead_hit: (context, tag) => {
            Assert.equal(context, "ctx");
            Assert.equal(tag, "tag");
            return Build.primitive(456)
          },
          on_live_hit: (context, tag, access) => {
            Assert.equal(context, "ctx");
            Assert.equal(tag, "tag");
            return access(null);
          }
        }, "ctx"))
      ];
    }), Build.BLOCK([], [
      Build.Expression(Build.conditional(Build.read("_x"), Build.read("$x"), Build.primitive(456)))
    ]));
    return [
      Build.Expression(Core.initialize(scope, "x", Build.primitive(123)))
    ];
  }), Build.BLOCK(["$x", "_x"], [
    Build.Expression(Build.write("_x", Build.primitive(false))),
    Build.Expression(Build.sequence(Build.write("$x", Build.primitive(123)), Build.write("_x", Build.primitive(true)))),
  ]));
  
  // lookup-dynamic-frame //
  Assert.deepEqual(Core.extend_global(false, (scope) => {
    Assert.deepEqual(Core.extend_dynamic(scope, "dyn", (scope) => {
      Assert.deepEqual(Core.lookup(scope, "x", {
        on_miss: (context) => {
          Assert.equal(context, "ctx");
          return Build.primitive(123);
        },
        on_live_hit: Assert.fail.bind(Assert),
        on_dead_hit: Assert.fail.bind(Assert),
        on_dynamic_frame: (context, dynamic, aran_expression) => {
          Assert.equal(context, "ctx");
          Assert.equal(dynamic, "dyn");
          Assert.deepEqual(aran_expression, Build.primitive(123));
          return Build.primitive(456);
        }
      }, "ctx"), Build.primitive(456));
      return []
    }), Build.BLOCK([], []));
    return [];
  }), Build.BLOCK([], []));
  
  // eval //
  Assert.deepEqual(Core.extend_global(true, (scope) => {
    Core.declare(scope, "x", "tag");
    return [
      Build.Expression(Core.eval(scope, Build.primitive(123))),
      Build.Expression(Core.initialize(scope, "x", Build.primitive(456)))
    ];
  }), Build.BLOCK(["$x"], [
    Build.Expression(Build.eval(["$x"], Build.primitive(123))),
    Build.Expression(Build.write("$x", Build.primitive(456)))
  ]));

  // extend-eval //
  [evals[0], JSON.parse(JSON.stringify(evals[0]))].forEach((frame_array) => {
    Assert.deepEqual(Core.extend_eval(frame_array, false, (scope) => {
      Assert.equal(Core.is_strict(scope), true);
      Assert.equal(Core.get_depth(scope), 2);
      return [
        Build.Expression(Core.lookup(scope, "x", {
          on_miss: Assert.fail.bind(Assert),
          on_dynamic_frame: Assert.fail.bind(Assert),
          on_live_hit: Assert.fail.bind(Assert),
          on_dead_hit: (context, tag) => {
            Assert.equal(context, "ctx");
            Assert.equal(tag, "tag");
            return Build.primitive(123);
          }
        }, "ctx")),
        Build.Expression(Core.lookup(scope, "y", {
          on_miss: (context) => {
            Assert.equal(context, "ctx");
            return Build.primitive(456);
          },
          on_dynamic_frame: Assert.fail.bind(Assert),
          on_live_hit: Assert.fail.bind(Assert),
          on_dead_hit: Assert.fail.bind(Assert)
        }, "ctx"))
      ];
    }), Build.BLOCK([], [
      Build.Expression(Build.primitive(123)),
      Build.Expression(Build.primitive(456))
    ]));
  });

  // eval-escaped //
  Assert.deepEqual(Core.extend_global(false, (scope) => {
    Core.declare(scope, "x", "tag");
    return [
      Build.Lone(Core.extend_closure(scope, false, (scope) => {
        return [
          Build.Expression(Core.eval(scope, Build.primitive(123)))
        ];
      })),
      Build.Expression(Core.initialize(scope, "x", Build.primitive(456)))
    ];
  }), Build.BLOCK(["$x", "_x"], [
    Build.Expression(Build.write("_x", Build.primitive(false))),
    Build.Lone(Build.BLOCK([], [Build.Expression(Build.eval(["$x", "_x"], Build.primitive(123)))])),
    Build.Expression(Build.sequence(Build.write("$x", Build.primitive(456)), Build.write("_x", Build.primitive(true))))
  ]));
  
  // eval-duplicate //
  Assert.deepEqual(Core.extend_global(false, (scope) => {
    Core.declare(scope, "x", "tag");
    Core.declare(scope, "y", "tag");
    return [
      Build.Expression(Core.initialize(scope, "x", Build.primitive(12))),
      Build.Expression(Core.initialize(scope, "y", Build.primitive(34))),
      Build.Lone(Core.extend_regular(scope, (scope) => {
        Core.declare(scope, "x", "tag");
        return [
          Build.Expression(Core.initialize(scope, "x", Build.primitive(56))),
          Build.Expression(Core.eval(scope, Build.primitive(78)))
        ];
      }))
    ];
  }), Build.BLOCK(["$x", "$y"], [
    Build.Expression(Build.write("$x", Build.primitive(12))),
    Build.Expression(Build.write("$y", Build.primitive(34))),
    Build.Lone(Build.BLOCK(["$x"], [
      Build.Expression(Build.write("$x", Build.primitive(56))),
      Build.Expression(Build.eval(["$x", "$y"], Build.primitive(78)))
    ]))
  ]));

  

  // 
  // // declare -> uninitialize
  // Assert.throws(() => Core.extend_global(false, (scope) => {
  //   Core.declare(scope, "x", null);
  //   return [];
  // }), new Error("Uninitialized identifier"));
  // 
  // // lookup-on-miss
  // Core.extend_global(false, (scope) => {
  //   Assert.deepEqual(Core.lookup(scope, "x", {
  //     on_miss: (context) => {
  //       Assert.equal(context, "ctx");
  //       return Build.primitive(123);
  //     },
  //     on_dynamic: Assert.fail.bind(Assert),
  //     on_live_hit: Assert.fail.bind(Assert),
  //     on_dead_hit: Assert.fail.bind(Assert)
  //   }, "ctx"), Build.primitive(123));
  //   Assert.throws(() => Core.declare(scope, "x", "tag"), new Error("Illegal identifier shadowing"));
  //   return [];
  // });
  // 
  // 
  // 
  // 
  // 
  //   Assert.deepEqual(Core.lookup(scope, "x", {
  //     on_miss: (context) => {
  //       Assert.equal(context, "ctx");
  //       return Build.primitive(123);
  //     },
  //     on_dynamic: Assert.fail.bind(Assert),
  //     on_live_hit: Assert.fail.bind(Assert),
  //     on_dead_hit: Assert.fail.bind(Assert)
  //   }, "ctx"), Build.primitive(123));
  //   Assert.throws(() => Core.declare(scope, "x", "tag"), new Error("Illegal identifier shadowing"));
  //   return [];
  // });
  // 
  // // extend >> dynamic deadzone //
  // Assert.deepEqual(Core.extend_global(false, (scope) => {
  //   scope.bindings["x"] = {
  //     initialized: true,
  //     has_dynamic_deadzone: true,
  //     tag: "foo"
  //   };
  //   return [Build.Debugger()];
  // }), Build.BLOCK(["$x", "_x"], [Build.Expression(Build.write("_x", Build.primitive(false))), Build.Debugger()]));
  // 
  // // extend >> uninitialized //
  // Assert.throws(() => Core.extend_global(false, (scope) => {
  //   scope.bindings["x"] = {
  //     initialized: false,
  //     has_dynamic_deadzone: true,
  //     tag: "foo"
  //   };
  //   return Build.Debugger();
  // }), new Error("Uninitialized identifier"));
  // 
  // // extend_global //
  // [true, false].forEach((is_use_strict) => {
  //   Core.extend_global(is_use_strict, (scope) => {
  //     Assert.deepEqual(scope, {
  //       parent: null,
  //       is_closure: false,
  //       is_use_strict,
  //       dynamic: null,
  //       misses: [],
  //       bindings: {__proto__:null}
  //     });
  //     return [];
  //   });
  // });
  // 
  // // extend_regular //
  // Core.extend_global(false, (scope1) => {
  //   Core.extend_regular(scope1, (scope2) => {
  //     Assert.deepEqual(scope2, {
  //       parent: scope1,
  //       is_closure: false,
  //       is_use_strict: false,
  //       dynamic: null,
  //       misses: [],
  //       bindings: {__proto__:null}
  //     });
  //     return [];
  //   });
  //   return [];
  // });
  // 
  // // extend_dynamic //
  // Core.extend_global(false, (scope1) => {
  //   Core.extend_dynamic(scope1, "foobar", (scope2) => {
  //     Assert.deepEqual(scope2, {
  //       parent: scope1,
  //       is_closure: false,
  //       is_use_strict: false,
  //       dynamic: "foobar",
  //       misses: [],
  //       bindings: {__proto__:null}
  //     });
  //     return [];
  //   });
  //   return [];
  // });
  // 
  // // extend_closure //
  // [true, false].forEach((is_use_strict) => {
  //   Core.extend_global(false, (scope1) => {
  //     Core.extend_closure(scope1, is_use_strict, (scope2) => {
  //       Assert.deepEqual(scope2, {
  //         parent: scope1,
  //         is_closure: true,
  //         is_use_strict,
  //         dynamic: null,
  //         misses: [],
  //         bindings: {__proto__:null}
  //       });
  //       return [];
  //     });
  //     return [];
  //   });
  // });
  // 
  // // is_strict //
  // Core.extend_global(false, (scope) => {
  //   Assert.equal(Core.is_strict(scope), false);
  //   Core.extend_closure(scope, true, (scope) => {
  //     Assert.equal(Core.is_strict(scope), true);
  //     return [];
  //   });
  //   return [];
  // });
  // 
  // // get_depth
  // Core.extend_global(false, (scope) => {
  //   Assert.equal(Core.get_depth(scope), 1);
  //   Core.extend_regular(scope, (scope) => {
  //     Assert.equal(Core.get_depth(scope), 2);
  //     return [];
  //   });
  //   return [];
  // });
  // 
  // // declare is_declared
  // {
  //   const scope = {
  //     parent: null,
  //     is_closure: false,
  //     is_use_strict: false,
  //     dynamic: null,
  //     misses: [],
  //     bindings: {__proto__:null}
  //   };
  //   Assert.equal(Core.is_declared(scope, "x"), false);
  //   Core.declare(scope, "x", "tag");
  //   Assert.equal(Core.is_declared(scope, "x"), true);
  //   Assert.throws(() => { Core.declare(scope, "x", "tag") }, new Error("Identifier already declared"));
  //   Assert.deepEqual(scope, {
  //     parent: null,
  //     is_closure: false,
  //     is_use_strict: false,
  //     dynamic: null,
  //     misses: [],
  //     bindings: {
  //       __proto__:null,
  //       x: {
  //         initialized: false,
  //         has_dynamic_deadzone: false,
  //         tag: "tag"
  //       }
  //     }
  //   });
  //   scope.misses = ["y"];
  //   Assert.throws(() => { Core.declare(scope, "y", "tag") }, new Error("Unexpected identifier shadowing"));
  // }

});


// 
// 
// 
//   const aran_identifier_1 = "foo";
//   Assert.equal(Core.get_declared(scope1, aran_identifier_1), false);
//   Assert.equal(Core.lookup(scope1, aran_identifier_1, {
//     on_hit: (context2, initialized, escaped, tag, access) => {
//       Assert.fail("expected a miss");
//     },
//     on_miss: (context2) => {
//       Assert.equal(context2, context1);
//       return result1;
//     },
//     on_dynamic: (context2, result2, dynamic2) => {
//       Assert.equal(context2, context1);
//       Assert.equal(dynamic2, dynamic1);
//       Assert.equal(result2, result1);
//       return result3;
//     },
//   }, context1), result3);
//   Assert.throws(() => { Core.declare(scope1, aran_identifier_1, tag1) }, new Error("Unexpected shadowing"));
//   Assert.throws(() => { Core.initialize(scope1, aran_identifier_1, tag1) }, new Error("Cannot initialize undeclared identifier"));
// 
//   const aran_identifier_2 = "bar";
//   Assert.equal(Core.declare(scope1, aran_identifier_2, tag1), undefined);
//   Assert.throws(() => { Core.declare(scope1, aran_identifier_2, tag1) }, new Error("Already declared"));
//   Assert.equal(Core.get_declared(scope1, aranidentifier_2), true);
//   Assert.equal(Core.get_initialized(scope1, aran_identifier_2), false);
//   Assert.equal(Core.get_lookedup(scope1, aran_identifier_2), false);
//   Assert.equal(Core.get_tag(scope1, aran_identifier_2), tag1);
//   Assert.equal(Core.lookup(scope1, aran_identifier_2, {
//     on_hit: (context2, initialized, escaped, tag2, access) => {
//       Assert.equal(context2, context1);
//       Assert.equal(initialized, false);
//       Assert.equal(escaped, false);
//       Assert.equal(tag2, tag1);
//       Assert.deepEqual(access(null), ["read", aran_identifier_2]);
//       Assert.deepEqual(access(aran_expression), ["write", aran_identifier_2, aran_expression]);
//       return result1;
//     },
//     on_miss: (context2) => {
//       Assert.fail("expected a hit");
//     },
//     on_dynamic: (context2, result2, dynamic2) => {
//       Assert.fail("expected a direct hit");
//     },
//   }, context1), result1);
//   Assert.equal(Core.get_lookedup(scope1, aran_identifier_2), true);
//   Assert.deepEqual(Core.initialize(scope1, aran_identifier_2, aran_expression), ["write", aran_identifier_2, aran_expression]);
//   Assert.throws(() => { Core.initialize(scope1, aran_identifier_2, null) }, new Error("Already initialized"));
//   Assert.equal(Core.get_initialized(scope1, aran_identifier_2), true);
// 
//   const scope2 = Core.extend(scope1, true, true, null);
//   Assert.equal(Core.get_depth(scope2), 2);
//   Assert.equal(Core.get_is_strict(scope2), true);
//   Assert.equal(Core.lookup(scope2, aran_identifier_2, {
//     on_hit: (context2, initialized, escaped, tag2, access) => {
//       Assert.equal(context2, context1);
//       Assert.equal(initialized, true);
//       Assert.equal(escaped, true);
//       Assert.equal(tag2, tag1);
//       Assert.deepEqual(access(null), ["read", aran_identifier_2]);
//       Assert.deepEqual(access(aran_expression), ["write", aran_identifier_2, aran_expression]);
//       return result1;
//     },
//     on_miss: (context2) => {
//       Assert.fail("expected a hit");
//     },
//     on_dynamic: (context2, result2, dynamic2) => {
//       Assert.fail("expected a direct hit");
//     },
//   }, context1), result1);
// 
//   const aran_identifier_3 = "qux";
//   Assert.equal(Core.declare(scope2, aran_identifier_3, tag1), undefined);
//   Assert.throws(() => { Core.block(scope2, (aran_identifier_4, lookedup, tag1) => true, () => []) }, new Error("Uninitialized identifier"));
//   Assert.equal(Core.initialize(scope2, aran_identifier_3, null), undefined);
//   let counter2 = 0;
//   Assert.deepEqual(Core.block(scope2, (aran_identifier_4, lookedup, tag2) => {
//     counter2++;
//     Assert.equal(tag2, tag1);
//     Assert.equal(lookedup, aran_identifier_4 === aran_identifier_2);
//     console.log(aran_identifier_4);
//     return aran_identifier_4 === aran_identifier_2;
//   })([]), ["BLOCK", [aran_identifier_2], []]);
//   Assert.equal(counter2, 2);
// 
//   let counter1 = 0;
//   Assert.deepEqual(Core.eval(scope2, (aran_identifier_4, escaped, initialized, lookedup, tag2) => {
//     Assert.equal(aran_identifier_4, aran_identifier_2);
//     Assert.equal(escaped, true);
//     Assert.equal(initialized, true);
//     Assert.equal(lookedup, true);
//     Assert.equal(tag2, tag1);
//     counter1++;
//     return true;
//   })(aran_expression), ["eval", [aran_identifier_2], aran_expression]);
//   Assert.equal(counter1, 1);
//   Assert.deepEqual(scopes, {
//     __proto__: null,
//     0: [
//       {
//         is_closure: true,
//         is_use_strict: true,
//         dynamic: null,
//         misses: null,
//         bindings: {
//           __proto__: null,
//         }
//       },
//       {
//         is_closure: false,
//         is_use_strict: false,
//         dynamic: dynamic1,
//         misses: null,
//         bindings: {
//           __proto__: null,
//           [aran_identifier_2]: {
//             initialized: true,
//             lookedup: true,
//             tag: tag1
//           }
//         }
//       }
//     ]
//   });
//   Assert.deepEqual(Core.extend(scopes[0], false, false, null).parent, {
//     parent: {
//       parent: null,
//       is_closure: false,
//       is_use_strict: false,
//       dynamic: {},
//       misses: null,
//       bindings: {
//         __proto__: null,
//         foobar: { initialized: true, lookedup: true, tag: {} }
//       }
//     },
//     is_closure: true,
//     is_use_strict: true,
//     dynamic: null,
//     misses: null,
//     bindings: {
//       __proto__: null
//     }
//   });
//   Assert.deepEqual(Core.extend(JSON.parse(JSON.stringify(scopes[0])), false, false, null).parent, Core.extend(scopes[0], false, false, null).parent);
// 
// });
