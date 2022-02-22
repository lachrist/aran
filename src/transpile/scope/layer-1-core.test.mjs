import {concat} from "array-lite";
import {
  assertEqual,
  generateAssertUnreachable,
  assertDeepEqual,
} from "../../__fixture__.mjs";
import {makeCurry} from "../../util.mjs";
import {
  makeEffectStatement,
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import {allignBlock} from "../../allign/index.mjs";

import {
  makePropertyScope,
  makeRootScope,
  makeClosureScope,
  makeDynamicScope,
  makeScopeBlock,
  lookupScopeProperty,
  makeDeclareStatementArray,
  makeScopeInitializeEffect,
  makeScopeReadExpression,
  makeScopeWriteEffect,
  // makeGhostDeclareStatementArray,
} from "./layer-1-core.mjs";

//////////////
// Property //
//////////////

{
  let scope1 = makeRootScope();
  scope1 = makePropertyScope(scope1, "key1", "value1");
  scope1 = makePropertyScope(scope1, "key2", "value2");
  scope1 = makeClosureScope(scope1);
  scope1 = makeDynamicScope(scope1);
  assertEqual(
    allignBlock(
      makeScopeBlock(
        scope1,
        [],
        makeCurry((scope2) => {
          assertEqual(lookupScopeProperty(scope2, "key1"), "value1");
          return [];
        }),
      ),
      "{}",
    ),
    null,
  );
}

assertEqual(
  allignBlock(
    makeScopeBlock(
      makeRootScope(),
      [],
      makeCurry((scope) =>
        concat(
          makeDeclareStatementArray(scope, "variable", "note", {
            onDynamicFrame: makeCurry(generateAssertUnreachable("dynamic")),
          }),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeReadExpression(scope, "variable", {
                  onMiss: makeCurry(generateAssertUnreachable("onMiss")),
                  onGhostHit: makeCurry(
                    generateAssertUnreachable("onGhostHit"),
                  ),
                  onStaticLiveHit: makeCurry(
                    generateAssertUnreachable("onStaticLiveHit"),
                  ),
                  onStaticDeadHit: makeCurry((note) => {
                    assertDeepEqual(note, "note");
                    return makeLiteralExpression(123);
                  }),
                  onDynamicFrame: makeCurry(
                    generateAssertUnreachable("onDynamicFrame"),
                  ),
                }),
              ),
            ),
            makeEffectStatement(
              makeScopeInitializeEffect(
                scope,
                "variable",
                makeLiteralExpression(456),
                makeCurry(generateAssertUnreachable("onDynamicFrame")),
              ),
            ),
            makeEffectStatement(
              makeScopeWriteEffect(
                scope,
                "variable",
                makeLiteralExpression(789),
                {
                  onMiss: makeCurry(generateAssertUnreachable("onMiss")),
                  onGhostHit: makeCurry(
                    generateAssertUnreachable("onGhostHit"),
                  ),
                  onStaticLiveHit: makeCurry((note, effect) => {
                    assertEqual(note, "note");
                    return effect;
                  }),
                  onStaticDeadHit: makeCurry(
                    generateAssertUnreachable("onStaticDeadHit"),
                  ),
                  onDynamicFrame: makeCurry(
                    generateAssertUnreachable("onDynamicFrame"),
                  ),
                },
              ),
            ),
          ],
        ),
      ),
    ),
    "{ let x; effect(123); x = 456; x = 789; }",
  ),
  null,
);

//
//
// const visitor = State.makeRootVisitor(
//   "Program",
//   () => {
//     // PropertyScope && getPropertyValue //
//     Assert.deepEqual(
//       Core.getPropertyValue(
//         Core.PropertyScope(
//           Core.PropertyScope(
//             Core.RootScope(),
//             "foo",
//             123),
//           "bar",
//           456),
//         "foo"),
//       123);
//     Assert.throws(
//       () => Core.getPropertyValue(Core.RootScope(), "foo"),
//       new global.Error("Missing scope property"));
//     // isRoot && isStatic && isDynamic //
//     Lang.match(
//       Core.makeBlock(
//         Core.RootScope(),
//         (scope, _prototype) => (
//           ArrayLite.forEach(
//             [
//               [Core.RootScope(), true, false, false],
//               [scope, false, true, false],
//               [Core.DynamicScope(scope), false, false, true]],
//             ([scope, ...results]) => ArrayLite.forEach(
//               ["isRoot", "isStatic", "isDynamic"],
//               (name, index) => Assert.deepEqual(
//                 Core[name](scope),
//                 results[index]))),
//           Tree.CompletionStatement(
//             Tree.PrimitiveExpression(void 0)))),
//       Lang.parseBlock(`{
//         completion void 0; }`),
//       Assert);
//     // makeInputExpression //
//     Assert.throws(
//       () => Core.makeInputExpression(
//         Core.PropertyScope(
//           Core.RootScope(),
//           "key",
//           "value"),
//         "arguments"),
//       new global.Error(`Missing scope for input expression`));
//     Lang.match(
//       Core.makeBlock(
//         Core.RootScope(),
//         (scope) => Tree.CompletionStatement(
//           Core.makeInputExpression(scope, "arguments"))),
//       Lang.parseBlock(`{
//         completion #Reflect.get(input, "arguments"); }`),
//       Assert);
//     // makeStaticInitializeExpression //
//     Assert.throws(
//       () => Core.makeStaticInitializeExpression(
//         Core.RootScope(),
//         "identifier",
//         Tree.PrimitiveExpression(123)),
//       new global.Error(`Expected a static frame`));
//     Lang.match(
//       Core.makeBlock(
//         Core.RootScope(),
//         (scope) => (
//           Assert.throws(
//             () => Core.makeStaticInitializeExpression(
//               Core.PropertyScope(scope, "key", "value"),
//               "identifier",
//               Tree.PrimitiveExpression(123)),
//             new global.Error(`Missing static variable`)),
//           Tree.CompletionStatement(
//             Tree.PrimitiveExpression(123)))),
//       Lang.parseBlock(`{ completion 123; }`),
//       Assert);
//     // normal //
//     Lang.match(
//       Core.makeBlock(
//         Core.RootScope(),
//         (scope) => (
//           Assert.deepEqual(
//             Core.declareStaticVariable(scope, "identifier1", false, "data1"),
//             void 0),
//           Assert.deepEqual(
//             Core.declareStaticVariable(scope, "identifier2", false, "data2"),
//             void 0),
//           Tree.CompletionStatement(
//             Tree.SequenceExpression(
//               Tree.SequenceExpression(
//                 Core.makeStaticInitializeExpression(
//                   scope,
//                   "identifier1",
//                   Tree.PrimitiveExpression(123)),
//                 Core.makeStaticInitializeExpression(
//                   scope,
//                   "identifier2",
//                   Tree.PrimitiveExpression(456))),
//               Core.makeLookupExpression(
//                 Core.PropertyScope(scope, "key", "value"),
//                 "identifier2",
//                 {
//                   onMiss: () => Assert.fail(),
//                   onDynamicFrame: (expression, frame) => Assert.fail(),
//                   onStaticDeadHit: (data) => Assert.fail(),
//                   onStaticLiveHit: (data, read, write) => (
//                     Assert.deepEqual(data, "data2"),
//                     Tree.SequenceExpression(
//                       write(
//                         Tree.PrimitiveExpression(789)),
//                       read()))}))))),
//       Lang.parseBlock(`{
//         let $identifier1, $identifier2;
//         completion (
//           (
//             $identifier1 = 123,
//             $identifier2 = 456),
//           (
//             $identifier2 = 789,
//             $identifier2)); }`),
//       Assert);
//     // ghost //
//     Lang.match(
//       Core.makeBlock(
//         Core.RootScope(),
//         (scope) => (
//           Assert.deepEqual(
//             Core.declareStaticVariable(scope, "identifier", true, "data"),
//             void 0),
//           Assert.deepEqual(
//             Core.getStaticData(scope, "identifier"),
//             "data"),
//           Assert.throws(
//             () => Core.makeStaticInitializeExpression(
//               scope,
//               "identifier",
//               Tree.PrimitiveExpression(123)),
//             new global.Error(`Expected a normal variable`)),
//           Tree.CompletionStatement(
//             Core.makeLookupExpression(
//               scope,
//               "identifier",
//               {
//                 onMiss: () => Assert.fail(),
//                 onDynamicFrame: (expression, frame) => Assert.fail(),
//                 onStaticDeadHit: (data) => (
//                   Assert.deepEqual(data, "data"),
//                   Tree.PrimitiveExpression(456)),
//                 onStaticLiveHit: (data) => Assert.fail()})))),
//       Lang.parseBlock(`{
//         completion 456; }`),
//       Assert);
//     // distant //
//     Lang.match(
//       Core.makeBlock(
//         Core.RootScope(),
//         (scope) => Tree.ListStatement(
//           [
//             Tree.BranchStatement(
//               Tree.Branch(
//                 [],
//                 Core.makeEmptyBlock(
//                   scope,
//                   (scope) => (
//                     Assert.deepEqual(
//                       Core.declareStaticVariable(scope, "identifier", false, "data"),
//                       void 0),
//                     Assert.deepEqual(
//                       Core.getStaticData(scope, "identifier"),
//                       "data"),
//                     Tree.CompletionStatement(
//                       Tree.SequenceExpression(
//                         Core.makeStaticInitializeExpression(
//                           scope,
//                           "identifier",
//                           Tree.PrimitiveExpression(12)),
//                         Core.makeLookupExpression(
//                           scope,
//                           "identifier",
//                           {
//                             onMiss: () => Assert.fail(),
//                             onDynamicFrame: (expression, frame) => Assert.fail(),
//                             onStaticDeadHit: (data) => (
//                               Assert.deepEqual(data, "data"),
//                               Tree.PrimitiveExpression(34)),
//                             onStaticLiveHit: (data, read, write) => Tree.PrimitiveExpression(56)}))))))),
//             Tree.CompletionStatement(
//               Tree.PrimitiveExpression(78))])),
//       Lang.parseBlock(`{
//         let $identifier, _identifier;
//         _identifier = false;
//         {
//           completion (
//             (
//               $identifier = 12,
//               _identifier = true),
//             (
//               _identifier ?
//               56 :
//               34)); }
//         completion 78; }`),
//       Assert);
//     // dynamic //
//     {
//       const scope = Core.DynamicScope(
//         Core.RootScope(),
//         "frame");
//       Assert.deepEqual(
//         Core.getDynamicFrame(scope),
//         "frame");
//       Lang.match(
//         Core.makeLookupExpression(
//           scope,
//           "identifier",
//           {
//             onMiss: () => Tree.PrimitiveExpression(123),
//             onStaticDeadHit: (data) => Assert.fail(),
//             onStaticLiveHit: (data, read, write) => Assert.fail(),
//             onDynamicFrame: (expression, frame) => (
//               Assert.deepEqual(frame, "frame"),
//               Tree.SequenceExpression(
//                 expression,
//                 Tree.PrimitiveExpression(456)))}),
//         Lang.parseExpression(`(123, 456)`),
//         Assert); }
//     // deadzone //
//     Lang.match(
//       Core.makeBlock(
//         Core.RootScope(),
//         (scope) => (
//           Core.declareStaticVariable(scope, "identifier", false, "data"),
//           Tree.CompletionStatement(
//             Tree.SequenceExpression(
//               Tree.SequenceExpression(
//                 Core.makeLookupExpression(
//                   scope,
//                   "identifier",
//                   {
//                     onMiss: () => Assert.fail(),
//                     onDynamicFrame: (expression, frame) => Assert.fail(),
//                     onStaticLiveHit: (data, read, write) => Assert.fail(),
//                     onStaticDeadHit: (data) => Tree.PrimitiveExpression(12)}),
//                 Core.makeLookupExpression(
//                   Core.ClosureScope(scope),
//                   "identifier",
//                   {
//                     onMiss: () => Assert.fail(),
//                     onDynamicFrame: (expression, frame) => Assert.fail(),
//                     onStaticLiveHit: (data, read, write) => Tree.PrimitiveExpression(34),
//                     onStaticDeadHit: (data) => Tree.PrimitiveExpression(56)})),
//               Tree.SequenceExpression(
//                 Core.makeStaticInitializeExpression(
//                   scope,
//                   "identifier",
//                   Tree.PrimitiveExpression(78)),
//                 Tree.PrimitiveExpression(90)))))),
//       Lang.parseBlock(`{
//         let $identifier, _identifier;
//         _identifier = false;
//         completion (
//           (
//             12,
//             (_identifier ? 34 : 56)),
//           (
//             (
//               $identifier = 78,
//               _identifier = true),
//             90)); }`),
//       Assert);
//     // shadow //
//     Lang.match(
//       Core.makeBlock(
//         Core.RootScope(),
//         (scope) => Tree.CompletionStatement(
//           Tree.SequenceExpression(
//             (
//               (
//                 (closure) => Tree.SequenceExpression(
//                   closure(123),
//                   closure(456)))
//               (
//                 (primitive) => Core.makeLookupExpression(
//                   scope,
//                   "identifier",
//                   {
//                     onMiss: () => Tree.PrimitiveExpression(primitive),
//                     onDynamicFrame: (expression, frame) => Assert.fail(),
//                     onStaticLiveHit: (data, read, write) => Assert.fail(),
//                     onStaticDeadHit: (data) => Assert.fail()}))),
//             (
//               Assert.throws(
//                 () => Core.declareStaticVariable(scope, "identifier", false, "data"),
//                 new global.Error(`Duplicate static variable declaration`)),
//               Tree.PrimitiveExpression(789))))),
//       Lang.parseBlock(`{ completion ((123, 456), 789); }`),
//       Assert);
//     ////////////////////////
//     // makeEvalExpression //
//     ////////////////////////
//     // ghost //
//     Lang.match(
//       Core.makeBlock(
//         Core.RootScope(),
//         (scope) => (
//           Core.declareStaticVariable(scope, "identifier", true, "data"),
//           Tree.CompletionStatement(
//             Core.makeEvalExpression(
//               scope,
//               null,
//               Tree.PrimitiveExpression(123))))),
//       Lang.parseBlock(`{ completion eval(123); }`),
//       Assert);
//     // normal //
//     Lang.match(
//       Core.makeBlock(
//         Core.RootScope(),
//         (scope) => (
//           Core.declareStaticVariable(scope, "identifier", false, "data"),
//           Tree.CompletionStatement(
//             Tree.SequenceExpression(
//               Core.makeStaticInitializeExpression(
//                 scope,
//                 "identifier",
//                 Tree.PrimitiveExpression(123)),
//               Core.makeEvalExpression(
//                 Core.PropertyScope(scope, "key", "value"),
//                 null,
//                 Tree.PrimitiveExpression(456)))))),
//       Lang.parseBlock(`{
//         let $identifier;
//         completion (
//           $identifier = 123,
//           eval($identifier, 456)); }`),
//       Assert);
//     // deadzone //
//     Lang.match(
//       Core.makeBlock(
//         Core.RootScope(),
//         (scope) => (
//           Core.declareStaticVariable(scope, "identifier", false, "data"),
//           Tree.CompletionStatement(
//             Tree.SequenceExpression(
//               Core.makeEvalExpression(
//                 Core.ClosureScope(scope),
//                 null,
//                 Tree.PrimitiveExpression(123)),
//               Tree.SequenceExpression(
//                 Core.makeStaticInitializeExpression(
//                   scope,
//                   "identifier",
//                   Tree.PrimitiveExpression(456)),
//                 Tree.PrimitiveExpression(789)))))),
//       Lang.parseBlock(`{
//         let $identifier, _identifier;
//         _identifier = false;
//         completion (
//           eval($identifier, _identifier, 123),
//           (
//             (
//               $identifier = 456,
//               _identifier = true),
//             789)); }`),
//       Assert);
//     // duplicate //
//     Lang.match(
//       Core.makeBlock(
//         Core.RootScope(),
//         (scope) => (
//           Core.declareStaticVariable(scope, "identifier", false, "data"),
//           Tree.ListStatement(
//             [
//               Tree.ExpressionStatement(
//                 Core.makeStaticInitializeExpression(
//                   scope,
//                   "identifier",
//                   Tree.PrimitiveExpression(12))),
//               Tree.BranchStatement(
//                 Tree.Branch(
//                   [],
//                   Core.makeBlock(
//                     scope,
//                     (scope) => (
//                       Core.declareStaticVariable(scope, "identifier", false, "data"),
//                       Tree.CompletionStatement(
//                         Tree.SequenceExpression(
//                           Core.makeStaticInitializeExpression(
//                             scope,
//                             "identifier",
//                             Tree.PrimitiveExpression(34)),
//                           Core.makeEvalExpression(
//                             scope,
//                             null,
//                             Tree.PrimitiveExpression(56)))))))),
//               Tree.CompletionStatement(
//                 Tree.PrimitiveExpression(78))]))),
//       Lang.parseBlock(`{
//         let $identifier;
//         $identifier = 12;
//         {
//           let $identifier;
//           completion (
//             $identifier = 34,
//             eval($identifier, 56)); }
//         completion 78; }`),
//       Assert); });
//
// visitor(
//   {
//     type: "Program",
//     body: []},
//   {
//     counter: 0,
//     locations: [],
//     serials: new global.Map(),
//     annotations: new global.Map()},
//   "context");
