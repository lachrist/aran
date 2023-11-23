import { AranError, AranTypeError } from "../../../../error.mjs";
import {
  isAlienGlobalProgram,
  isAlienLocalProgram,
  isAlienProgram,
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
} from "./root-alien.mjs";
import {
  listReifyBindingDeclareStatement,
  listReifyBindingInitializeEffect,
  listReifyBindingVariable,
  listReifyBindingWriteEffect,
  makeReifyBindingDiscardExpression,
  makeReifyBindingReadExpression,
  makeReifyBindingTypeofExpression,
} from "./root-reify.mjs";
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
 * @typedef {import("./binding.d.ts").Binding} Binding
 * @typedef {import("./binding.d.ts").PresentBinding} PresentBinding
 * @typedef {import("./binding.d.ts").MissingBinding} MissingBinding
 */

/**
 * @type {(
 *   context: {
 *     root: import("../../../program.js").RootProgram,
 *   },
 *   binding: PresentBinding,
 * ) => unbuild.Variable[]}
 */
export const listBindingVariable = ({ root }, binding) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingVariable({}, binding);
    }
    case "regular": {
      return listRegularBindingVariable({}, binding);
    }
    case "root": {
      switch (root.plug) {
        case "alien": {
          return listAlienBindingVariable({ root }, binding);
        }
        case "reify": {
          return listReifyBindingVariable({ root }, binding);
        }
        default: {
          throw new AranTypeError("invalid context.root", root);
        }
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
 *     root: import("../../../program.js").RootProgram,
 *   },
 *   binding: PresentBinding,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBindingDeclareStatement = ({ mode, root }, binding, path) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingDeclareStatement({}, binding, path);
    }
    case "regular": {
      return listRegularBindingDeclareStatement({}, binding, path);
    }
    case "root": {
      if (isAlienGlobalProgram(root)) {
        return listAlienBindingDeclareStatement({ mode, root }, binding, path);
      } else if (isReifyGlobalProgram(root)) {
        return listReifyBindingDeclareStatement({ root }, binding, path);
      } else if (isAlienLocalProgram(root)) {
        throw new AranError("Cannot declare alien local variable", binding);
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
 *     root: import("../../../program.js").RootProgram,
 *   },
 *   binding: PresentBinding,
 *   right: aran.Expression<unbuild.Atom> | null,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listBindingInitializeEffect = (
  { mode, root },
  binding,
  right,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingInitializeEffect({ root }, binding, right, path);
    }
    case "regular": {
      return listRegularBindingInitializeEffect({ root }, binding, right, path);
    }
    case "root": {
      if (isAlienGlobalProgram(root)) {
        return listAlienBindingInitializeEffect(
          { mode, root },
          binding,
          right,
          path,
        );
      } else if (isReifyGlobalProgram(root)) {
        return listReifyBindingInitializeEffect({ root }, binding, right, path);
      } else if (isAlienLocalProgram(root)) {
        throw new AranError("Cannot declare alien local variable", binding);
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
 *     root: import("../../../program.js").RootProgram,
 *   },
 *   binding: Binding,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingReadExpression = (
  { mode, root },
  binding,
  { path, meta },
) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingReadExpression({}, binding, path);
    }
    case "regular": {
      return makeRegularBindingReadExpression({}, binding, path);
    }
    case "root": {
      if (isAlienProgram(root)) {
        return makeAlienBindingReadExpression({ mode, root }, binding, {
          path,
          meta,
        });
      } else if (isReifyGlobalProgram(root)) {
        return makeReifyBindingReadExpression({ root }, binding, path);
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
 *     root: import("../../../program.js").RootProgram,
 *   },
 *   binding: Binding,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingTypeofExpression = (
  { mode, root },
  binding,
  { path },
) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingTypeofExpression({}, binding, path);
    }
    case "regular": {
      return makeRegularBindingTypeofExpression({}, binding, path);
    }
    case "root": {
      if (isAlienProgram(root)) {
        return makeAlienBindingTypeofExpression({ mode, root }, binding, path);
      } else if (isReifyGlobalProgram(root)) {
        return makeReifyBindingTypeofExpression({ root }, binding, path);
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
 *     root: import("../../../program.js").RootProgram,
 *   },
 *   binding: Binding,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingDiscardExpression = (
  { mode, root },
  binding,
  { path },
) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingDiscardExpression({}, binding, path);
    }
    case "regular": {
      return makeRegularBindingDiscardExpression({}, binding, path);
    }
    case "root": {
      if (isAlienProgram(root)) {
        return makeAlienBindingDiscardExpression({ mode, root }, binding, path);
      } else if (isReifyGlobalProgram(root)) {
        return makeReifyBindingDiscardExpression({ mode, root }, binding, path);
      } else if (isAlienLocalProgram(root)) {
        throw new AranError("Cannot declare alien local variable", binding);
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
 *     root: import("../../../program.js").RootProgram,
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
  { mode, root },
  binding,
  right,
  { path, meta },
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingWriteEffect({}, binding, right, path);
    }
    case "regular": {
      return listRegularBindingWriteEffect({ mode }, binding, right, {
        path,
        meta,
      });
    }
    case "root": {
      if (isAlienProgram(root)) {
        return listAlienBindingWriteEffect({ mode, root }, binding, right, {
          path,
          meta,
        });
      } else if (isReifyGlobalProgram(root)) {
        return listReifyBindingWriteEffect({ mode, root }, binding, right, {
          path,
          meta,
        });
      } else if (isAlienLocalProgram(root)) {
        throw new AranError("Cannot declare alien local variable", binding);
      } else {
        throw new AranTypeError("invalid context.root", root);
      }
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};
