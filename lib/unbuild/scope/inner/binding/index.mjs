import { AranTypeError } from "../../../../util/index.mjs";
import {
  isAlienGlobalRoot,
  isAlienLocalRoot,
  isAlienRoot,
  isReifyGlobalRoot,
} from "../../../root.mjs";
import {
  listAlienBindingDeclareStatement,
  listAlienBindingInitializeStatement,
  listAlienBindingVariable,
  listAlienBindingWriteEffect,
  makeAlienBindingDiscardExpression,
  makeAlienBindingReadExpression,
  makeAlienBindingTypeofExpression,
} from "./root-alien.mjs";
import {
  listReifyBindingDeclareStatement,
  listReifyBindingInitializeStatement,
  listReifyBindingVariable,
  listReifyBindingWriteEffect,
  makeReifyBindingDiscardExpression,
  makeReifyBindingReadExpression,
  makeReifyBindingTypeofExpression,
} from "./root-reify.mjs";
import {
  listImportBindingDeclareStatement,
  listImportBindingInitializeStatement,
  listImportBindingVariable,
  listImportBindingWriteEffect,
  makeImportBindingDiscardExpression,
  makeImportBindingReadExpression,
  makeImportBindingTypeofExpression,
} from "./import.mjs";
import {
  listRegularBindingDeclareStatement,
  listRegularBindingInitializeStatement,
  listRegularBindingVariable,
  listRegularBindingWriteEffect,
  makeRegularBindingDiscardExpression,
  makeRegularBindingReadExpression,
  makeRegularBindingTypeofExpression,
} from "./regular.mjs";

const { Error } = globalThis;

/**
 * @typedef {import("./binding.d.ts").Binding} Binding
 * @typedef {import("./binding.d.ts").PresentBinding} PresentBinding
 * @typedef {import("./binding.d.ts").MissingBinding} MissingBinding
 */

/**
 * @type {(
 *   context: {
 *     root: import("../../../context.d.ts").Root,
 *   },
 *   binding: PresentBinding,
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listBindingVariable = ({ root }, binding, variable) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingVariable({}, binding, variable);
    }
    case "regular": {
      return listRegularBindingVariable({}, binding, variable);
    }
    case "root": {
      if (isAlienRoot(root)) {
        return listAlienBindingVariable({ root }, binding, variable);
      } else if (isReifyGlobalRoot(root)) {
        return listReifyBindingVariable({ root }, binding, variable);
      } else {
        throw new AranTypeError("invalid context.root", root);
      }
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../../context.d.ts").Root,
 *   },
 *   binding: PresentBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBindingDeclareStatement = (
  { mode, root },
  binding,
  variable,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingDeclareStatement({}, binding, variable, path);
    }
    case "regular": {
      return listRegularBindingDeclareStatement({}, binding, variable, path);
    }
    case "root": {
      if (isAlienGlobalRoot(root)) {
        return listAlienBindingDeclareStatement(
          { mode, root },
          binding,
          variable,
          path,
        );
      } else if (isReifyGlobalRoot(root)) {
        return listReifyBindingDeclareStatement(
          { root },
          binding,
          variable,
          path,
        );
      } else if (isAlienLocalRoot(root)) {
        throw new Error("Cannot declare alien local variable");
      } else {
        throw new AranTypeError("invalid context.root", root);
      }
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../../context.d.ts").Root,
 *   },
 *   binding: PresentBinding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBindingInitializeStatement = (
  { mode, root },
  binding,
  variable,
  right,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingInitializeStatement(
        { root },
        binding,
        variable,
        right,
        path,
      );
    }
    case "regular": {
      return listRegularBindingInitializeStatement(
        { root },
        binding,
        variable,
        right,
        path,
      );
    }
    case "root": {
      if (isAlienGlobalRoot(root)) {
        return listAlienBindingInitializeStatement(
          { mode, root },
          binding,
          variable,
          right,
          path,
        );
      } else if (isReifyGlobalRoot(root)) {
        return listReifyBindingInitializeStatement(
          { root },
          binding,
          variable,
          right,
          path,
        );
      } else if (isAlienLocalRoot(root)) {
        throw new Error("Cannot declare alien local variable");
      } else {
        throw new AranTypeError("invalid context.root", root);
      }
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     root: import("../../../context.d.ts").Root,
 *   },
 *   binding: Binding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingReadExpression = (
  { root },
  binding,
  variable,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingReadExpression({}, binding, variable, path);
    }
    case "regular": {
      return makeRegularBindingReadExpression({}, binding, variable, path);
    }
    case "root": {
      if (isAlienRoot(root)) {
        return makeAlienBindingReadExpression(
          { root },
          binding,
          variable,
          path,
        );
      } else if (isReifyGlobalRoot(root)) {
        return makeReifyBindingReadExpression(
          { root },
          binding,
          variable,
          path,
        );
      } else {
        throw new AranTypeError("invalid context.root", root);
      }
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     root: import("../../../context.d.ts").Root,
 *   },
 *   binding: Binding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingTypeofExpression = (
  { root },
  binding,
  variable,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingTypeofExpression({}, binding, variable, path);
    }
    case "regular": {
      return makeRegularBindingTypeofExpression({}, binding, variable, path);
    }
    case "root": {
      if (isAlienRoot(root)) {
        return makeAlienBindingTypeofExpression(
          { root },
          binding,
          variable,
          path,
        );
      } else if (isReifyGlobalRoot(root)) {
        return makeReifyBindingTypeofExpression(
          { root },
          binding,
          variable,
          path,
        );
      } else {
        throw new AranTypeError("invalid context.root", root);
      }
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../../context.d.ts").Root,
 *   },
 *   binding: Binding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingDiscardExpression = (
  { mode, root },
  binding,
  variable,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingDiscardExpression({}, binding, variable, path);
    }
    case "regular": {
      return makeRegularBindingDiscardExpression({}, binding, variable, path);
    }
    case "root": {
      if (isAlienRoot(root)) {
        return makeAlienBindingDiscardExpression(
          { root },
          binding,
          variable,
          path,
        );
      } else if (isReifyGlobalRoot(root)) {
        return makeReifyBindingDiscardExpression(
          { mode, root },
          binding,
          variable,
          path,
        );
      } else if (isAlienLocalRoot(root)) {
        throw new Error("Cannot declare alien local variable");
      } else {
        throw new AranTypeError("invalid context.root", root);
      }
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../../context.d.ts").Root,
 *   },
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listBindingWriteEffect = (
  { mode, root },
  binding,
  variable,
  right,
  path,
  meta,
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingWriteEffect({}, binding, variable, right, path);
    }
    case "regular": {
      return listRegularBindingWriteEffect({}, binding, variable, right, path);
    }
    case "root": {
      if (isAlienRoot(root)) {
        return listAlienBindingWriteEffect(
          { mode, root },
          binding,
          variable,
          right,
          path,
        );
      } else if (isReifyGlobalRoot(root)) {
        return listReifyBindingWriteEffect(
          { mode, root },
          binding,
          variable,
          right,
          path,
          meta,
        );
      } else if (isAlienLocalRoot(root)) {
        throw new Error("Cannot declare alien local variable");
      } else {
        throw new AranTypeError("invalid context.root", root);
      }
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};
