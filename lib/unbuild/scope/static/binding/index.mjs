import { AranError, AranTypeError } from "../../../../error.mjs";
import {
  isAlienGlobalProgram,
  isAlienLocalProgram,
  isReifyGlobalProgram,
} from "../../../program.mjs";
import {
  listAlienBindingDeclareStatement,
  listAlienBindingInitializeEffect,
  listAlienBindingVariable,
  listAlienBindingWriteEffect,
  makeAlienBindingDiscardExpression,
  makeAlienBindingReadExpression,
  makeAlienBindingTypeofExpression,
} from "./global-alien.mjs";
import {
  listReifyBindingDeclareStatement,
  listReifyBindingInitializeEffect,
  listReifyBindingVariable,
  listReifyBindingWriteEffect,
  makeReifyBindingDiscardExpression,
  makeReifyBindingReadExpression,
  makeReifyBindingTypeofExpression,
} from "./global-reify.mjs";
import {
  listImportBindingDeclareStatement,
  listImportBindingInitializeEffect,
  listImportBindingVariable,
  listImportBindingWriteEffect,
  makeImportBindingDiscardExpression,
  makeImportBindingReadExpression,
  makeImportBindingTypeofExpression,
} from "./import.mjs";
import {
  listRegularBindingDeclareStatement,
  listRegularBindingInitializeEffect,
  listRegularBindingVariable,
  listRegularBindingWriteEffect,
  makeRegularBindingDiscardExpression,
  makeRegularBindingReadExpression,
  makeRegularBindingTypeofExpression,
} from "./regular.mjs";

/**
 * @typedef {import("./binding.js").Binding} Binding
 */

/**
 * @typedef {import("../../../program.js").RootProgram} RootProgram
 */

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *   },
 *   binding: Binding,
 * ) => unbuild.Variable[]}
 */
export const listBindingVariable = (context, binding) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingVariable({}, binding);
    }
    case "regular": {
      return listRegularBindingVariable({}, binding);
    }
    case "global": {
      const { root } = context;
      if (isAlienGlobalProgram(root)) {
        return listAlienBindingVariable(context, binding);
      } else if (isReifyGlobalProgram(root)) {
        return listReifyBindingVariable(context, binding);
      } else if (isAlienLocalProgram(root)) {
        throw new AranError("unexpected local alien binding", {
          context,
          binding,
        });
      } else {
        throw new AranTypeError("invalid root", root);
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
 *     root: RootProgram,
 *   },
 *   binding: Binding,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBindingDeclareStatement = (context, binding, path) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingDeclareStatement(context, binding, path);
    }
    case "regular": {
      return listRegularBindingDeclareStatement(context, binding, path);
    }
    case "global": {
      const { root } = context;
      if (isReifyGlobalProgram(root)) {
        return listReifyBindingDeclareStatement(context, binding, path);
      } else if (isAlienGlobalProgram(root)) {
        return listAlienBindingDeclareStatement(context, binding, path);
      } else if (isAlienLocalProgram(root)) {
        throw new AranError("unexpected local alien binding", {
          context,
          binding,
        });
      } else {
        throw new AranTypeError("invalid root", root);
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
 *     root: RootProgram,
 *   },
 *   binding: Binding,
 *   right: aran.Expression<unbuild.Atom> | null,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listBindingInitializeEffect = (context, binding, right, path) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingInitializeEffect(context, binding, right, path);
    }
    case "regular": {
      return listRegularBindingInitializeEffect(context, binding, right, path);
    }
    case "global": {
      const { root } = context;
      if (isReifyGlobalProgram(root)) {
        return listReifyBindingInitializeEffect(context, binding, right, path);
      } else if (isAlienGlobalProgram(root)) {
        return listAlienBindingInitializeEffect(context, binding, right, path);
      } else if (isAlienLocalProgram(root)) {
        throw new AranError("unexpected local alien binding", {
          context,
          binding,
        });
      } else {
        throw new AranTypeError("invalid root", root);
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
 *     root: RootProgram,
 *   },
 *   binding: Binding,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingReadExpression = (context, binding, { path, meta }) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingReadExpression(context, binding, path);
    }
    case "regular": {
      return makeRegularBindingReadExpression(context, binding, path);
    }
    case "global": {
      const { root } = context;
      if (isReifyGlobalProgram(root)) {
        return makeReifyBindingReadExpression(context, binding, path);
      } else if (isAlienGlobalProgram(root)) {
        return makeAlienBindingReadExpression(context, binding, {
          path,
          meta,
        });
      } else if (isAlienLocalProgram(root)) {
        throw new AranError("unexpected local alien binding", {
          context,
          binding,
        });
      } else {
        throw new AranTypeError("invalid root", root);
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
 *     root: RootProgram,
 *   },
 *   binding: Binding,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingTypeofExpression = (context, binding, { path }) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingTypeofExpression(context, binding, path);
    }
    case "regular": {
      return makeRegularBindingTypeofExpression(context, binding, path);
    }
    case "global": {
      const { root } = context;
      if (isReifyGlobalProgram(root)) {
        return makeReifyBindingTypeofExpression(context, binding, path);
      } else if (isAlienGlobalProgram(root)) {
        return makeAlienBindingTypeofExpression(context, binding, path);
      } else if (isAlienLocalProgram(root)) {
        throw new AranError("Cannot declare alien local variable", {
          context,
          binding,
        });
      } else {
        throw new AranTypeError("invalid root", root);
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
 *     root: RootProgram,
 *   },
 *   binding: Binding,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingDiscardExpression = (context, binding, { path }) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingDiscardExpression({}, binding, path);
    }
    case "regular": {
      return makeRegularBindingDiscardExpression({}, binding, path);
    }
    case "global": {
      const { root } = context;
      if (isReifyGlobalProgram(root)) {
        return makeReifyBindingDiscardExpression(context, binding, path);
      } else if (isAlienGlobalProgram(root)) {
        return makeAlienBindingDiscardExpression(context, binding, path);
      } else if (isAlienLocalProgram(root)) {
        throw new AranError("Cannot declare alien local variable", {
          context,
          binding,
        });
      } else {
        throw new AranTypeError("invalid root", root);
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
 *     root: RootProgram,
 *   },
 *   binding: Binding,
 *   right: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listBindingWriteEffect = (
  context,
  binding,
  right,
  { path, meta },
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingWriteEffect(context, binding, right, path);
    }
    case "regular": {
      return listRegularBindingWriteEffect(context, binding, right, {
        path,
        meta,
      });
    }
    case "global": {
      const { root } = context;
      if (isReifyGlobalProgram(root)) {
        return listReifyBindingWriteEffect(context, binding, right, {
          path,
          meta,
        });
      } else if (isAlienGlobalProgram(root)) {
        return listAlienBindingWriteEffect(context, binding, right, {
          path,
          meta,
        });
      } else if (isAlienLocalProgram(root)) {
        throw new AranError("Cannot declare alien local variable", {
          context,
          binding,
        });
      } else {
        throw new AranTypeError("invalid root", root);
      }
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};
