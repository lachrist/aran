
const ArrayLite = require("array-lite");

const Block = require("../block.js");
const Build = require("../build.js");
const Lexic = require("../lexic.js");
const Object = require("../object.js");
const Query = require("../query.js");
const Scope = require("../scope.js");

exports.PROGRAM = ({sourceType:estree_source_type, body:estree_program_body}, scope, _estree_identifiers) => (
  estree_source_type !== "script" ?
  Throw("Unfortunately, Aran only supports script programs and not ES6 modules in particular (yet)...") :
  (
    _estree_identifiers = Query.Vars(estree_program_body),
    Scope.BLOCK(
      scope,
      false,
      (
        (
          scope !== null ||
          Query.IsStrict(node.body)) ?
        _estree_identifiers :
        []),
      (
        scope === null ?
        ["this"] :
        []),
      (scope) => (
        ArrayLite.concat(
          (
            scope === null ?
            Build.Expression(
              Scope.initialize(
                scope,
                "this",
                Build.builtin("global"))) :
            []),
          ArrayLite.flatMap(
            _estree_identifiers,
            (
              (
                scope !== null ||
                is_strict(node)) ?
              (estree_name) => Build.Expression(
                Scope.initialize(
                  scope,
                  estree_name,
                  Build.primitive(void 0))) :
              (estree_name) => Build.Expression(
                Object.set(
                  false,
                  Build.builtin("global"),
                  Build.primitive(estree_name),
                  Build.primitive(void 0))))),
          (
            (
              node.body.length >= 1 &&
              node.body[node.body.length - 1].type === "ExpressionStatement") ?
            ArrayLite.concat(
              Block.Body(
                ArrayLite.slice(node.body, 0, node.body.length - 1),
                scope,
                Lexic.CreateProgram(null)),
              Build.Return(
                Visit.node(node.body[node.body.length - 1].expression, scope, false, [])))) :
            Scope.Cache(
              scope,
              "ClosureProgramCompletion",
              Build.primitive(void 0),
              (cache) => ArrayLite.concat(
                Block.Body(
                  node.body,
                  scope,
                  Lexic.CreateProgram(cache)),
                Build.Return(
                  Scope.get(scope, cache)))))))));
