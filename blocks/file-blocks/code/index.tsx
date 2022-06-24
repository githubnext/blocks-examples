import { tw } from "twind";
import "./style.css";
import React from "react";
import { FileBlockProps } from "@githubnext/blocks";

import {
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import { EditorView } from "@codemirror/view";
import { EditorState, Compartment, Transaction } from "@codemirror/state";
import { history, historyKeymap } from "@codemirror/history";
import { foldGutter, foldKeymap } from "@codemirror/fold";
import { indentOnInput } from "@codemirror/language";
import { lineNumbers, highlightActiveLineGutter } from "@codemirror/gutter";
import { defaultKeymap } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/matchbrackets";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/closebrackets";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { commentKeymap } from "@codemirror/comment";
import { rectangularSelection } from "@codemirror/rectangular-selection";
import { lintKeymap } from "@codemirror/lint";
import { LanguageDescription } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import interact from "@replit/codemirror-interact";
import { theme } from "./theme";

const languageConf = new Compartment();

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
    ...commentKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),

  languageConf.of([]),
];

export default function (props: FileBlockProps) {
  const {
    content,
    context: { path },
    isEditable,
    onUpdateContent,
  } = props;

  const editorRef = React.useRef<HTMLDivElement>(null);
  const viewRef = React.useRef<EditorView>();

  if (viewRef.current) {
    const view = viewRef.current;
    const doc = view.state.doc.sliceString(0);
    if (doc !== content) {
      view.dispatch({
        changes: { from: 0, to: doc.length, insert: content },
        // mark the transaction remote so we don't call `onUpdateContent` for it below
        annotations: Transaction.remote.of(true),
      });
    }
  }

  React.useEffect(() => {
    if (viewRef.current || !editorRef.current) return;

    const state = EditorState.create({
      doc: content,
      extensions: [
        extensions,
        EditorView.editable.of(isEditable),
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

    const language = LanguageDescription.matchFilename(languages, path);

    if (language) {
      language.load().then((lang) => {
        view.dispatch({
          effects: languageConf.reconfigure(lang),
        });
      });
    }

    viewRef.current = view;
  }, []);

  return (
    <div
      className={tw(`relative w-full h-full overflow-auto`)}
      key={path}
      ref={editorRef}
    />
  );
}
