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
 *     root: import("../../../context.d.ts").Root,
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
      if (isAlienGlobalRoot(root)) {
        return listAlienBindingDeclareStatement({ mode, root }, binding, path);
      } else if (isReifyGlobalRoot(root)) {
        return listReifyBindingDeclareStatement({ root }, binding, path);
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
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBindingInitializeStatement = (
  { mode, root },
  binding,
  right,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingInitializeStatement(
        { root },
        binding,
        right,
        path,
      );
    }
    case "regular": {
      return listRegularBindingInitializeStatement(
        { root },
        binding,
        right,
        path,
      );
    }
    case "root": {
      if (isAlienGlobalRoot(root)) {
        return listAlienBindingInitializeStatement(
          { mode, root },
          binding,
          right,
          path,
        );
      } else if (isReifyGlobalRoot(root)) {
        return listReifyBindingInitializeStatement(
          { root },
          binding,
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
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingReadExpression = ({ root }, binding, path) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingReadExpression({}, binding, path);
    }
    case "regular": {
      return makeRegularBindingReadExpression({}, binding, path);
    }
    case "root": {
      if (isAlienRoot(root)) {
        return makeAlienBindingReadExpression({ root }, binding, path);
      } else if (isReifyGlobalRoot(root)) {
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
 *     root: import("../../../context.d.ts").Root,
 *   },
 *   binding: Binding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingTypeofExpression = ({ root }, binding, path) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingTypeofExpression({}, binding, path);
    }
    case "regular": {
      return makeRegularBindingTypeofExpression({}, binding, path);
    }
    case "root": {
      if (isAlienRoot(root)) {
        return makeAlienBindingTypeofExpression({ root }, binding, path);
      } else if (isReifyGlobalRoot(root)) {
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
 *     root: import("../../../context.d.ts").Root,
 *   },
 *   binding: Binding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingDiscardExpression = ({ mode, root }, binding, path) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingDiscardExpression({}, binding, path);
    }
    case "regular": {
      return makeRegularBindingDiscardExpression({}, binding, path);
    }
    case "root": {
      if (isAlienRoot(root)) {
        return makeAlienBindingDiscardExpression({ root }, binding, path);
      } else if (isReifyGlobalRoot(root)) {
        return makeReifyBindingDiscardExpression({ mode, root }, binding, path);
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
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listBindingWriteEffect = (
  { mode, root },
  binding,
  right,
  path,
  meta,
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingWriteEffect({}, binding, right, path);
    }
    case "regular": {
      return listRegularBindingWriteEffect({}, binding, right, path);
    }
    case "root": {
      if (isAlienRoot(root)) {
        return listAlienBindingWriteEffect(
          { mode, root },
          binding,
          right,
          path,
        );
      } else if (isReifyGlobalRoot(root)) {
        return listReifyBindingWriteEffect(
          { mode, root },
          binding,
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
