import {includes, concat} from "array-lite";
import {filterOutContext, assert} from "../../util.mjs";

const {
  Reflect: {apply},
  Map,
  Map: {
    prototype: {has: hasMap, set: setMap, get: getMap, values: getMapValues},
  },
  Array: {from: toArray},
} = globalThis;

////////////////
// Contructor //
////////////////

export const makeImportDeclaration = (variable, source, specifier) => ({
  writable: false,
  duplicable: false,
  import: {source, specifier},
  exports: [],
  variable,
});

const generateMakeDeclaration =
  ({writable, duplicable}) =>
  (variable) => ({
    writable,
    duplicable,
    import: null,
    exports: [],
    variable,
  });

export const makeVoidDeclaration = generateMakeDeclaration({
  writable: true,
  duplicable: null,
});
export const makeVarDeclaration = generateMakeDeclaration({
  writable: true,
  duplicable: true,
});
export const makeFunctionDeclaration = generateMakeDeclaration({
  writable: true,
  duplicable: true,
});
export const makeSimpleParameterDeclaration = generateMakeDeclaration({
  writable: true,
  duplicable: true,
});

export const makeConstDeclaration = generateMakeDeclaration({
  writable: false,
  duplicable: false,
});
export const makeLetDeclaration = generateMakeDeclaration({
  writable: true,
  duplicable: false,
});
export const makeParameterDeclaration = generateMakeDeclaration({
  writable: true,
  duplicable: false,
});
export const makeClassDeclaration = generateMakeDeclaration({
  writable: true,
  duplicable: false,
});

/////////////
// Mutator //
/////////////

export const exportDeclaration = (declaration, specifier) =>
  includes(declaration.exports, specifier)
    ? declaration
    : {
        ...declaration,
        exports: concat(declaration.exports, [specifier]),
      };

//////////////
// Accessor //
//////////////

export const isDeclarationImported = ({import: $import}) => $import !== null;

export const isDeclarationLoose = ({duplicable}) => {
  assert(duplicable !== null, "query on void variable");
  return duplicable;
};

export const isDeclarationRigid = ({duplicable}) => {
  assert(duplicable !== null, "query on void variable");
  return !duplicable;
};

export const isDeclarationWritable = ({writable}) => writable;

export const getDeclarationVariable = ({variable}) => variable;

export const getDeclarationImportSource = ({import: {source}}) => source;

export const getDeclarationImportSpecifier = ({import: {specifier}}) =>
  specifier;

export const getDeclarationExportSpecifierArray = ({exports}) => exports;

//////////////
// checkout //
//////////////

const mergeDuplicable = (duplicable1, duplicable2) => {
  if (duplicable1 === null) {
    return duplicable2;
  } else if (duplicable2 === null) {
    return duplicable1;
  } else {
    assert(
      duplicable1 === true && duplicable2 === true,
      "duplicate variable declaration",
    );
    return true;
  }
};

const mergeDeclaration = (declaration1, declaration2) => {
  assert(
    declaration1.variable === declaration2.variable,
    "duplicate variable mismatch",
  );
  const duplicable = mergeDuplicable(
    declaration1.duplicable,
    declaration2.duplicable,
  );
  assert(
    declaration1.import === null && declaration2.import === null,
    "imported variable should not be duplicable",
  );
  return {
    duplicable,
    writable: declaration1.writable && declaration2.writable,
    import: null,
    exports: concat(
      declaration1.exports,
      filterOutContext(declaration2.exports, includes, declaration1.exports),
    ),
    variable: declaration1.variable,
  };
};

export const checkoutDeclarationArray = (declarations) => {
  const {length} = declarations;
  const mapping = new Map();
  for (let index = 0; index < length; index += 1) {
    const declaration = declarations[index];
    const variable = getDeclarationVariable(declaration);
    if (apply(hasMap, mapping, [variable])) {
      apply(setMap, mapping, [
        variable,
        mergeDeclaration(apply(getMap, mapping, [variable]), declaration),
      ]);
    } else {
      apply(setMap, mapping, [variable, declaration]);
    }
  }
  return toArray(apply(getMapValues, mapping, []));
};
