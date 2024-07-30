import {
  EditorView,
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
  highlightActiveLineGutter,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import analysis_source from "./analysis.txt.mjs";
import target_source from "./target.txt.mjs";

const { document } = globalThis;

const listExtension = () => [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
  javascript(),
];

const play = document.getElementById("play");
const stop = document.getElementById("stop");
const log = document.getElementById("log");

const analysis = new EditorView({
  state: EditorState.create({
    doc: analysis_source,
    extensions: listExtension(),
  }),
  parent: document.getElementById("analysis"),
});

const target = new EditorView({
  state: EditorState.create({
    doc: target_source,
    extensions: listExtension(),
  }),
  parent: document.getElementById("target"),
});

/**
 * @type {Worker | null}
 */
let worker;

/**
 * @type {() => Worker | null}
 */
const getWorker = () => worker;

/**
 * @type {(
 *   value: Worker | null,
 * ) => void}
 */
const setWorker = (value) => {
  worker = value;
  stop.disabled = value === null;
};

setWorker(null);

play.addEventListener("click", (_event) => {
  log.textContent = "";
  getWorker()?.terminate();
  const worker = new Worker("./worker.mjs", {
    type: "module",
  });
  worker.addEventListener("message", ({ data }) => {
    log.textContent += data;
  });
  worker.postMessage({
    analysis: analysis.state.doc.toString(),
    target: target.state.doc.toString(),
  });
  setWorker(worker);
});

document.getElementById("stop").addEventListener("click", (_event) => {
  getWorker()?.terminate();
  setWorker(null);
});
