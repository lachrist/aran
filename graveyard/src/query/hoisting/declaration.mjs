import { concat, filterOut } from "array-lite";
import { SyntaxAranError, assert, isDuplicate } from "../../util/index.mjs";

const {
  Reflect: { apply },
  Map,
  Map: {
    prototype: { has: hasMap, set: setMap, get: getMap, values: getMapValues },
  },
  Array: { from: toArray },
} = globalThis;

//////////
// Base //
//////////

export const generateMakeDeclaration = (kind) => (variable) => ({
  kind,
  variable,
  import: null,
  exports: [],
});

export const makeVoidDeclaration = generateMakeDeclaration("void");

export const makeVarDeclaration = generateMakeDeclaration("var");

export const makeLetDeclaration = generateMakeDeclaration("let");

export const makeConstDeclaration = generateMakeDeclaration("const");

export const makeImportDeclaration = (variable, source, specifier) => ({
  kind: "import",
  variable,
  import: { source, specifier },
  exports: [],
});

export const getDeclarationKind = ({ kind }) => kind;

export const getDeclarationVariable = ({ variable }) => variable;

export const isDeclarationImported = ({ import: import_ }) => import_ !== null;

export const getDeclarationImportSource = ({ import: { source } }) => source;

export const getDeclarationImportSpecifier = ({ import: { specifier } }) =>
  specifier;

export const getDeclarationExportSpecifierArray = ({ exports: exports_ }) =>
  filterOut(exports_, isDuplicate);

export const exportDeclaration = (
  { kind, variable, import: import_, exports: exports_ },
  specifier,
) => ({
  kind,
  variable,
  import: import_,
  exports: concat(exports_, [specifier]),
});

//////////////
// Checkout //
//////////////

const mergeKind = (kind1, kind2, variable) => {
  if (kind1 === "void") {
    return kind2;
  } else if (kind2 === "void") {
    return kind1;
  } else if (kind1 === "var" && kind2 === "var") {
    return "var";
  } else {
    throw new SyntaxAranError(
      `Identifier '${variable}' has already been declared`,
    );
  }
};

const mergeDeclaration = (
  { kind: kind1, variable: variable1, import: import1, exports: exports1 },
  { kind: kind2, variable: variable2, import: import2, exports: exports2 },
) => {
  assert(variable1 === variable2, "expected duplicate declaration");
  assert(
    import1 === null && import2 === null,
    "imported variable should not be duplicable",
  );
  return {
    kind: mergeKind(kind1, kind2, variable1),
    variable: variable1,
    import: null,
    exports: concat(exports1, exports2),
  };
};

const isKindVoid = ({ kind }) => kind === "void";

export const checkoutDeclarationArray = (declarations) => {
  const { length } = declarations;
  const mapping = new Map();
  for (let index = 0; index < length; index += 1) {
    const declaration = declarations[index];
    const { variable } = declaration;
    if (apply(hasMap, mapping, [variable])) {
      apply(setMap, mapping, [
        variable,
        mergeDeclaration(apply(getMap, mapping, [variable]), declaration),
      ]);
    } else {
      apply(setMap, mapping, [variable, declaration]);
    }
  }
  return filterOut(toArray(apply(getMapValues, mapping, [])), isKindVoid);
};
