import { tw } from "twind";
import "./style.css";
import React from "react";
import { FileBlockProps } from "@githubnext/blocks";

import {
  highlightActiveLine,
  drawSelection,
  dropCursor,
  EditorView,
  highlightSpecialChars,
  keymap,
  rectangularSelection,
  highlightActiveLineGutter,
  lineNumbers,
} from "@codemirror/view";
import { EditorState, Compartment, Transaction } from "@codemirror/state";
import { indentOnInput } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import {
  LanguageDescription,
  foldGutter,
  foldKeymap,
  bracketMatching,
} from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import interact from "@replit/codemirror-interact";
import { vim } from "@replit/codemirror-vim";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { theme } from "./theme";

const languageCompartment = new Compartment();
const isEditableCompartment = new Compartment();
const vimModeCompartment = new Compartment();

const extensions = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  theme,
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  indentationMarkers(),
  interact({
    rules: [
      // dragging numbers
      {
        regexp: /-?\b\d+\.?\d*\b/g,
        cursor: "ew-resize",
        onDrag: (text, setText, e) => {
          const newVal = Number(text) + e.movementX;
          if (isNaN(newVal)) return;
          setText(newVal.toString());
        },
      },
    ],
  }),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),

  languageCompartment.of([]),
  isEditableCompartment.of([]),
];

export default function (props: FileBlockProps) {
  const { content, context, isEditable, onUpdateContent } = props;

  const editorRef = React.useRef<HTMLDivElement>(null);
  const viewRef = React.useRef<EditorView>();
  const [isUsingVim, setIsUsingVim] = React.useState(false);

  React.useEffect(() => {
    if (viewRef.current || !editorRef.current) return;

    const state = EditorState.create({
      doc: content,
      extensions: [
        vimModeCompartment.of(isUsingVim ? vim() : []),
        extensions,
        EditorView.updateListener.of((v) => {
          if (
            !v.docChanged ||
            v.transactions.every((t) => t.annotation(Transaction.remote))
          )
            return;
          onUpdateContent(v.state.doc.sliceString(0));
        }),
      ],
    });
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
  }, []);

  React.useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;

    const doc = view.state.doc.sliceString(0);
    if (doc !== content) {
      view.dispatch({
        changes: { from: 0, to: doc.length, insert: content },
        // mark the transaction remote so we don't call `onUpdateContent` for it below
        annotations: Transaction.remote.of(true),
      });
    }
  }, [content]);

  React.useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;

    const language = LanguageDescription.matchFilename(languages, context.path);

    if (language) {
      language.load().then((lang) => {
        view.dispatch({
          effects: languageCompartment.reconfigure(lang),
        });
      });
    }
  }, [context.path]);

  React.useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;

    view.dispatch({
      effects: isEditableCompartment.reconfigure(
        EditorView.editable.of(isEditable)
      ),
    });
  }, [isEditable]);

  return (
    <div className={tw("relative w-full h-full")}>
      {isEditable && (
        <button
          className={tw`absolute top-3 right-3 z-50 appearance-none`}
          style={{
            opacity: isUsingVim ? 1 : 0.5,
            filter: isUsingVim ? "" : "grayscale(100%)",
          }}
          title={isUsingVim ? "Disable Vim Mode" : "Enable Vim Mode"}
          onClick={() => {
            const newIsUsingVim = !isUsingVim;
            setIsUsingVim(newIsUsingVim);
            if (!viewRef.current) return;
            viewRef.current.dispatch({
              effects: vimModeCompartment.reconfigure(
                newIsUsingVim ? vim() : []
              ),
            });
            viewRef.current.focus();
          }}
        >
          {/* the vim logo */}
          <svg width="2em" viewBox="0 0 544.8642 544.8642">
            <g transform="translate(-69.980994,-160.33288) matrix(1.532388,0,0,1.3939671,-54.912136,-41.792396)">
              <path
                d="M 260.50744,170.69515 105.98412,340.79094 259.8636,510.178 414.38691,340.08221 260.50744,170.69515 z"
                fill="#019833"
              ></path>
              <path
                transform="matrix(0.90138601,0,0,0.99222542,-437.42287,-185.30615)"
                d="m 828.9375,369.5 -4.28125,4.28125 0,15.71875 3.75,3.75 19.8125,0 0,15.1875 -131.0625,132.84375 0,-147.84375 21.78125,0 4.46875,-4.46875 0,-15.90625 -4.125,-3.1875 -114.625,0 -3.75,3.75 0,16.25 3.8125,3.8125 19.9375,0 0,272.25 3.75,3.75 22.65625,0 274.65625,-283.40625 0,-12.5 -4.28125,-4.28125 -112.5,0 z"
                fill="#cccccc"
              ></path>
            </g>
          </svg>
        </button>
      )}

      <div
        className={tw(`relative w-full h-full overflow-auto`)}
        key={context.path}
        ref={editorRef}
      />
    </div>
  );
}
