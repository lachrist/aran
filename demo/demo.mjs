/** @type {Window} */

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
import worker_source from "./worker-bundle-source.mjs";

const worker_blob = new Blob([worker_source], {
  type: "application/javascript",
});

const worker_url = URL.createObjectURL(worker_blob);

const { document, Worker } = globalThis;

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

/**
 * @type {(
 *   initial: string,
 * ) => {
 *   editor: EditorView,
 *   element: HTMLElement,
 * }}
 */
const createEditor = (initial) => {
  const element = document.createElement("div");
  const editor = new EditorView({
    state: EditorState.create({
      doc: initial,
      extensions: listExtension(),
    }),
    parent: element,
  });
  return { element, editor };
};

/**
 * @type {(
 *   label: string,
 * ) => HTMLButtonElement}
 */
const createButton = (label) => {
  const button = document.createElement("button");
  button.textContent = label;
  button.style.fontSize = "1.5em";
  button.style.fontFamily = "monospace";
  button.style.margin = "0.5em";
  return button;
};

/**
 * @type {(
 *   meta_content: string,
 *   base_content: string,
 * ) => HTMLElement}
 */
export const createDemo = (meta_content, base_content) => {
  /** @type {null | Worker} */
  let worker = null;
  const meta = createEditor(meta_content);
  const base = createEditor(base_content);
  const play = createButton("Play");
  const stop = createButton("Stop");
  const clear = createButton("Clear");
  const log = document.createElement("pre");
  stop.disabled = true;
  clear.addEventListener("click", (_event) => {
    log.textContent = "";
  });
  play.addEventListener("click", (_event) => {
    log.textContent = "";
    if (worker !== null) {
      worker.terminate();
    }
    worker = new Worker(worker_url, {
      type: "module",
    });
    worker.postMessage({
      meta: meta.editor.state.doc.toString(),
      base: base.editor.state.doc.toString(),
    });
    worker.addEventListener("message", ({ data }) => {
      log.textContent += `${data}\n`;
    });
    stop.disabled = false;
  });
  stop.addEventListener("click", (_event) => {
    if (worker !== null) {
      worker.terminate();
      worker = null;
    }
    stop.disabled = true;
  });
  {
    const main = document.createElement("div");
    main.appendChild(play);
    main.appendChild(stop);
    main.appendChild(clear);
    main.appendChild(document.createElement("hr"));
    main.appendChild(meta.element);
    main.appendChild(document.createElement("hr"));
    main.appendChild(base.element);
    main.appendChild(document.createElement("hr"));
    main.appendChild(log);
    return main;
  }
};
