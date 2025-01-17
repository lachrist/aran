import type {
  Kind as EstreeNodeKind,
  Path as EstreeNodePath,
} from "estree-sentry";
import type { Situ } from "./source";
import type { FilePath, Hash } from "./hash";

export type GlobalDeclarativeRecord = "builtin" | "emulate";

/**
 * A parsed JavaScript program which should adhere to `estree.Program`. Can be
 * generated by:
 * - `acorn.parse(code, {ecmaVersion: 2024})`
 * - `@babel/parser` with `estree` plugin
 */
export type LooseEstreeProgram = {
  type: "Program";
  sourceType: "module" | "script";
  body: unknown[];
};

/**
 * A parsed JavaScript program. Represents both static code and dynamically
 * generated code.
 */
export type File<file_path> = {
  /**
   * The `estree.Program` node to instrument.
   */
  root: LooseEstreeProgram;
  /**
   * Indicates how the source will be executed.
   * @defaultValue Either `"script"` or `"module"` based on
   * `file.root.sourceType`.
   */
  kind: "module" | "script" | "eval";
  /**
   * Further precises the context in which the source will be executed. Only
   * relevant when `source.kind` is `"eval"`.
   * - `GlobalSitu`: The source will be executed in the global context. It is
   * the only valid option when `source.kind` is `"module"` or `"script"`.
   * - `RootLocalSitu`: The source will be executed in a local context that is
   * not controlled by Aran -- ie: a direct eval call within non-instrumented
   * code.
   * - `DeepLocalSitu`: The source will be executed in a local context that is
   * controlled by Aran -- ie: direct eval call within instrumented code. This
   * data structure is provided by Aran as argument to the `eval@before` aspect.
   * @defaultValue `{ type: "global" }`
   */
  situ: Situ;
  /**
   * An identifier for the file. It is passed to `conf.digest` to help
   * generating unique node hash.
   */
  path: file_path;
};

/**
 * Hashing function for estree nodes.
 * @template P The type of `file.path`.
 * @template H
 * The type of the hash. Either a string or a number. Can be branded -- eg:
 * `string & { __brand: "hash" }`.
 * @param node The estree node to hash.
 * @param node_path The json path of the node in starting from `file.root`. It
 * is composed of the properties names that lead to the node concatenated with
 * dots. So integers properties are within bracket. For instance:
 * `"body.0.declarations.0.init"`.
 * @param file_path The path of the file containing the node as provided by
 * `file.path`.
 * @param node_kind The kind of the node -- eg: `"Program`", `"Statement"`,
 * `"Expression"`, ...
 * @returns The hash of the node. It should be unique for each node in the
 * program `file.root`. It is safe to simply returns `node_path`.
 */
export type Digest<file_path, hash extends string | number> = (
  node: object,
  node_path: EstreeNodePath,
  file_path: file_path,
  node_kind: EstreeNodeKind,
) => hash;

/**
 * Configuration object for `transpile`.
 */
export type Config<file_path, hash extends string | number> = {
  /**
   * Indicates whether the global declarative record should be emulated or not.
   * NB: The global declarative record is a scope frame that sits right before
   * the global object. For instance, in *script* code (not eval code nor module
   * code): `let x = 123` will cause the creation of a binding in the global
   * declarative record and not in the global object. Unfortunately, this record
   * cannot be accessed inside the language and we are stuck with two imperfect
   * options:
   * - `"builtin"`: The builtin global declarative record is used, access to
   *   global variables will happen via parameter functions such as:
   *   `scope.read`, `scope.writeSloppy`, etc... Tracking values through these
   *   calls requires additional logic.
   * - `"emulate"`: A plain object is used to emulate the global declarative
   *   record. That means that instrumented code will never access the builtin
   *   global declarative record. Hence, every single bit of code should be
   *   instrumented which might be a hard requirement to meet.
   * @defaultValue `"builtin"`
   */
  global_declarative_record: "builtin" | "emulate";
  /**
   * Hashing functions for nodes in `file.root`.
   * @defaultValue `(node, node_path, file_path, node_kind) => file_path + "#" + node_path`
   */
  digest: Digest<file_path, hash>;
};

export type InternalFile = File<FilePath>;
export type InternalDigest = Digest<FilePath, Hash>;
export type InternalConfig = Config<FilePath, Hash>;
