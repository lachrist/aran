"use strict";

const Assert = require("assert").strict;
const Scope = require("./index.js");
const State = require("../state.js");
const Build = require("../build.js");
const Parser = require("../../../test/parser/index.js");

require("../../lang/build.js")._debug_mode();


State.session({nodes:[], serials:new Map(), evals:{__proto__:null}}, {
  sourceType: "script",
  type: "Program",
  body: []
}, () => {
  // GLOBAL CLOSURE REGULAR //
  Assert.deepEqual(
    Scope.GLOBAL(
      false,
      {const:["x1"], let:["y1"]},
      (scope) => [
        Build.Lift(
          Scope.initialize(scope, "x1", Build.primitive("x1-value"))),
        Build.Lift(
          Scope.initialize(scope, "y1", Build.primitive("y1-value"))),
        Build.Lone(
          [],
          Scope.CLOSURE(
            scope,
            false,
            {const:["x2"], let:["y2"]},
            (scope) => [
              Build.Lift(
                Scope.initialize(scope, "x2", Build.primitive("x2-value"))),
              Build.Lift(
                Scope.initialize(scope, "y2", Build.primitive("y2-value"))),
              Build.Lone(
                [],
                Scope.REGULAR(
                  scope,
                  {const:["x3"], let:["y3"]},
                  (scope) => [
                    Build.Lift(
                      Scope.initialize(scope, "x3", Build.primitive("x3-value"))),
                    Build.Lift(
                      Scope.initialize(scope, "y3", Build.primitive("y3-value")))].flat()))].flat()))].flat()),
    Parser.PARSE(`{
      let $$x1, $$y1;
      $$x1 = "x1-value";
      $$y1 = "y1-value";
      {
        let $$x2, $$y2;
        $$x2 = "x2-value";
        $$y2 = "y2-value";
        {
          let $$x3, $$y3;
          $$x3 = "x3-value";
          $$y3 = "y3-value";
        }
      }
    }`));
  // GLOBAL CLOSURE DYNAMIC //
  Assert.deepEqual(
    Scope.EVAL(
      [],
      false,
      {const:["x1"], let:["y1"]},
      (scope) => [
        Build.Lift(
          Scope.initialize(scope, "x1", Build.primitive("x1-value"))),
        Build.Lift(
          Scope.initialize(scope, "y1", Build.primitive("y1-value"))),
        Build.Lone(
          [],
          Scope.CLOSURE(
            scope,
            false,
            {const:["x2"], let:["y2"]},
            (scope) => [
              Build.Lift(
                Scope.initialize(scope, "x2", Build.primitive("x2-value"))),
              Build.Lift(
                Scope.initialize(scope, "y2", Build.primitive("y2-value"))),
              Scope.Container(
                scope,
                "frame_container",
                Build.primitive("frame-container-value"),
                (frame_container) => Scope.Container(
                  scope,
                  "unscopables_container",
                  Build.primitive("unscopables-container-value"),
                  (unscopables_container) => Build.Lone(
                    [],
                    Scope.DYNAMIC(
                      scope,
                      {frame_container, unscopables_container},
                      {const:["x3"], let:["y3"]},
                      (scope) => [
                        Build.Lift(
                          Scope.initialize(scope, "x3", Build.primitive("x3-value"))),
                        Build.Lift(
                          Scope.initialize(scope, "y3", Build.primitive("y3-value")))].flat()))))].flat()))].flat()),
    Parser.PARSE(`{
      let $$x1, $$y1;
      $$x1 = "x1-value";
      $$y1 = "y1-value";
      {
        let $$x2, $$y2, $_frame_container_2_1, $_unscopables_container_2_1;
        $$x2 = "x2-value";
        $$y2 = "y2-value";
        $_frame_container_2_1 = "frame-container-value";
        $_unscopables_container_2_1 = "unscopables-container-value";
        {
          let $$x3, $$y3;
          $$x3 = "x3-value";
          $$y3 = "y3-value";
        }
      }
    }`));
  // read & typeof & delete //
  Assert.deepEqual(
    Scope.GLOBAL(
      false,
      {const:["x"], let:[]},
      (scope) => [
        // OnMiss //
        Build.Lift(
          Scope.read(scope, "z")),
        Build.Lift(
          Scope.typeof(scope, "z")),
        Build.Lift(
          Scope.delete(scope, "z")),
        // OnDeadHit //
        Build.Lift(
          Scope.read(scope, "x")),
        Build.Lift(
          Scope.typeof(scope, "x")),
        Build.Lift(
          Scope.delete(scope, "x")),
        // Initialize //
        Build.Lift(
          Scope.initialize(
            scope,
            "x",
            Build.primitive("x-value"))),
        // OnLiveHit //
        Build.Lift(
          Scope.read(scope, "x")),
        Build.Lift(
          Scope.typeof(scope, "x")),
        Build.Lift(
          Scope.delete(scope, "x")),
        // OnDynamicFrame //
        Scope.Container(
          scope,
          "frame_container",
          Build.primitive("frame-container-value"),
          (frame_container) => Scope.Container(
            scope,
            "unscopables_container",
            Build.primitive("unscopables-container-value"),
            (unscopables_container) => Build.Lone(
              [],
              Scope.DYNAMIC(
                scope,
                {frame_container, unscopables_container},
                {const:[], let:[]},
                (scope) => [
                  Build.Lift(
                    Scope.read(scope, "x")),
                  Build.Lift(
                    Scope.typeof(scope, "x")),
                  Build.Lift(
                    Scope.delete(scope, "x"))].flat()))))].flat()),
    Parser.PARSE(`{
      let $$x, $_frame_container_1_1, $_unscopables_container_1_1;
      // OnMiss //
      (
        #Reflect.has(#global, "z") ?
        #Reflect.get(#global, "z") :
        throw new #ReferenceError("z is not defined"));
      typeof #Reflect.get(#global, "z");
      #Reflect.deleteProperty(#global, "z");
      // OnDeadHit //
      throw new #ReferenceError("Cannot access 'x' before initialization");
      throw new #ReferenceError("Cannot access 'x' before initialization");
      true;
      // Initialization //
      $$x = "x-value";
      // OnLiveHit //
      $$x;
      typeof $$x;
      true;
      // OnDynamicFrame //
      $_frame_container_1_1 = "frame-container-value";
      $_unscopables_container_1_1 = "unscopables-container-value";
      {
        (
          (
            #Reflect.has($_frame_container_1_1, "x") ?
            (
              $_unscopables_container_1_1 = #Reflect.get($_frame_container_1_1, #Symbol.unscopables),
              (
                (
                  (typeof $_unscopables_container_1_1) === "object" ?
                  $_unscopables_container_1_1 :
                  (typeof $_unscopables_container_1_1) === "function") ?
                !#Reflect.get($_unscopables_container_1_1, "x") :
                true)) :
            false) ?
          #Reflect.get($_frame_container_1_1, "x") :
          $$x);
        (
          (
            #Reflect.has($_frame_container_1_1, "x") ?
            (
              $_unscopables_container_1_1 = #Reflect.get($_frame_container_1_1, #Symbol.unscopables),
              (
                (
                  (typeof $_unscopables_container_1_1) === "object" ?
                  $_unscopables_container_1_1 :
                  (typeof $_unscopables_container_1_1) === "function") ?
                !#Reflect.get($_unscopables_container_1_1, "x") :
                true)) :
            false) ?
          typeof #Reflect.get($_frame_container_1_1, "x") :
          typeof $$x);
        (
          (
            #Reflect.has($_frame_container_1_1, "x") ?
            (
              $_unscopables_container_1_1 = #Reflect.get($_frame_container_1_1, #Symbol.unscopables),
              (
                (
                  (typeof $_unscopables_container_1_1) === "object" ?
                  $_unscopables_container_1_1 :
                  (typeof $_unscopables_container_1_1) === "function") ?
                !#Reflect.get($_unscopables_container_1_1, "x") :
                true)) :
            false) ?
          #Reflect.deleteProperty($_frame_container_1_1, "x") :
          true);
      }
    }`));
  // read_this read_new_target //
  Assert.deepEqual(
    Scope.GLOBAL(
      false,
      {const:["this"], let:[]},
      (scope) => {
        Assert.throws(() => Scope.read_this(scope), new Error("Deadzone hit for `this` or `new.target`"));
        Assert.throws(() => Scope.read_new_target(scope), new Error("Missing `this` or `new.target`"));
        return [
          Build.Lift(
            Scope.initialize(
              scope,
              "this",
              Build.primitive("this-value"))),
          Build.Lift(
            Scope.read_this(scope)),
          Scope.Container(
            scope,
            "frame_container",
            Build.primitive("frame-container-value"),
            (frame_container) => Scope.Container(
              scope,
              "unscopables_container",
              Build.primitive("unscopables-container-value"),
              (unscopables_container) => Build.Lone(
                [],
                Scope.DYNAMIC(
                  scope,
                  {frame_container, unscopables_container},
                  {const:[], let:[]},
                  (scope) => Build.Lift(
                    Scope.read_this(scope))))))].flat()}),
    Parser.PARSE(`{
      let $$this, $_frame_container_1_1, $_unscopables_container_1_1;
      $$this = "this-value";
      $$this;
      $_frame_container_1_1 = "frame-container-value";
      $_unscopables_container_1_1 = "unscopables-container-value";
      {
        $$this;
      }
    }`));
  // write //
  // Assert.deepEqual = (x, y) => {
  //   require("fs").writeFileSync("yo-actual.json", JSON.stringify(x, null, 2));
  //   require("fs").writeFileSync("yo-expected.json", JSON.stringify(y, null, 2));
  //   require("child_process").execSync("diff yo-actual.json yo-actual.json");
  // };
  Assert.deepEqual(
    Scope.GLOBAL(
      false,
      {const:["x"], let:["y"]},
      (scope) => [
        Build.Lift(
          Scope.initialize(
            scope,
            "x",
            Build.primitive("x-init"))),
        Build.Lift(
          Scope.write(
            scope,
            "x",
            Build.primitive("x-live"))),
        Build.Lift(
          Scope.write(
            scope,
            "y",
            Build.primitive("y-dead"))),
        Build.Lift(
          Scope.initialize(
            scope,
            "y",
            Build.primitive("y-init"))),
        Build.Lift(
          Scope.write(
            scope,
            "y",
            Build.primitive("y-live"))),
        Scope.Container(
          scope,
          "frame_container",
          Build.primitive("frame-container-value"),
          (frame_container) => Scope.Container(
            scope,
            "unscopables_container",
            Build.primitive("unscopables-container-value"),
            (unscopables_container) => Build.Lone(
              [],
              Scope.DYNAMIC(
                scope,
                {frame_container, unscopables_container},
                {const:[], let:[]},
                (scope) => [
                  Build.Lift(
                    Scope.write(
                      scope,
                      "x",
                      Build.primitive("x-dynamic"))),
                  Build.Lift(
                    Scope.write(
                      scope,
                      "y",
                      Build.primitive("y-dynamic"))),
                  Build.Lift(
                    Scope.write(
                      scope,
                      "z",
                      Build.primitive("z-dynamic")))].flat())))),
        Build.Lift(
          Scope.write(
            scope,
            "z",
            Build.primitive("z-miss")))].flat()),
    Parser.PARSE(`{
      let $$x, $$y, $_frame_container_1_1, $_unscopables_container_1_1;
      $$x = "x-init";
      ("x-live", throw new #TypeError("Assignment to constant variable."));
      ("y-dead", throw new #ReferenceError("Cannot access 'y' before initialization"));
      $$y = "y-init";
      $$y = "y-live";
      $_frame_container_1_1 = "frame-container-value";
      $_unscopables_container_1_1 = "unscopables-container-value";
      {
        let $_right_hand_side_2_1, $_right_hand_side_2_2, $_right_hand_side_2_3;
        (
          $_right_hand_side_2_1 = "x-dynamic",
          (
            (
              #Reflect.has($_frame_container_1_1, "x") ?
              (
                $_unscopables_container_1_1 = #Reflect.get($_frame_container_1_1, #Symbol.unscopables),
                (
                  (
                    (typeof $_unscopables_container_1_1) === "object" ?
                    $_unscopables_container_1_1 :
                    (typeof $_unscopables_container_1_1) === "function") ?
                  !#Reflect.get($_unscopables_container_1_1, "x") :
                  true)) :
              false) ?
            #Reflect.set($_frame_container_1_1, "x", $_right_hand_side_2_1) :
            throw new #TypeError("Assignment to constant variable.")));
        (
          $_right_hand_side_2_2 = "y-dynamic",
          (
            (
              #Reflect.has($_frame_container_1_1, "y") ?
              (
                $_unscopables_container_1_1 = #Reflect.get($_frame_container_1_1, #Symbol.unscopables),
                (
                  (
                    (typeof $_unscopables_container_1_1) === "object" ?
                    $_unscopables_container_1_1 :
                    (typeof $_unscopables_container_1_1) === "function") ?
                  !#Reflect.get($_unscopables_container_1_1, "y") :
                  true)) :
              false) ?
            #Reflect.set($_frame_container_1_1, "y", $_right_hand_side_2_2) :
            $$y = $_right_hand_side_2_2));
        (
          $_right_hand_side_2_3 = "z-dynamic",
          (
            (
              #Reflect.has($_frame_container_1_1, "z") ?
              (
                $_unscopables_container_1_1 = #Reflect.get($_frame_container_1_1, #Symbol.unscopables),
                (
                  (
                    (typeof $_unscopables_container_1_1) === "object" ?
                    $_unscopables_container_1_1 :
                    (typeof $_unscopables_container_1_1) === "function") ?
                  !#Reflect.get($_unscopables_container_1_1, "z") :
                  true)) :
              false) ?
            #Reflect.set($_frame_container_1_1, "z", $_right_hand_side_2_3) :
            #Reflect.set(#global, "z", $_right_hand_side_2_3)));
      }
      #Reflect.set(#global, "z", "z-miss");
    }`));
  // write (strict) //
  // Assert.deepEqual = (x, y) => {
  //   console.log(JSON.stringify(x));
  //   console.log(JSON.stringify(y));
  // };
  Assert.deepEqual(
    Scope.GLOBAL(
      true,
      {const:[], let:[]},
      (scope) => Build.Lift(
        Scope.write(
          scope,
          "x",
          Build.primitive(123)))),
    Parser.PARSE(`{
      let $_right_hand_side_1_1;
      (
        $_right_hand_side_1_1 = 123,
        (
          #Reflect.has(#global, "x") ?
          (
            #Reflect.set(#global, "x", $_right_hand_side_1_1) ?
            true :
            throw new #TypeError("Cannot assign object property")) :
          throw new #ReferenceError("x is not defined")));
    }`));
});
