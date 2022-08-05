import { syntaxTree } from "@codemirror/language";
import { Range, RangeSet } from "@codemirror/rangeset";
import {
  CharCategory,
  EditorSelection,
  EditorState,
  Extension,
  StateField,
} from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  KeyBinding,
} from "@codemirror/view";

export const copy = (): Extension => {
  const headerDecoration = ({ level }: { level: string }) =>
    Decoration.mark({
      class: `cm-copy-header cm-copy-header--${level}`,
    });
  const linkDecoration = (text: string, linkText: string, url: string) =>
    Decoration.mark({
      class: text.includes(url) ? "cm-copy-link" : "",
      tagName: "a",
      attributes: {
        href: url,
        target: "_top",
        title: linkText,
        onclick: `top.window.location.href='${url}'`,
      },
    });
  const horizontalRuleDecorationAfter = () =>
    Decoration.mark({
      class: "cm-copy-hr",
    });
  const blockquoteDecoration = () =>
    Decoration.line({
      class: "cm-copy-blockquote",
    });
  const codeBlockDecoration = () =>
    Decoration.line({
      class: "cm-code",
    });
  const listItemDecoration = (listType, index) =>
    Decoration.line({
      class: `cm-list-item cm-list-item--${listType}`,
      attributes: {
        "data-index": index,
      },
    });

  const decorate = (state: EditorState) => {
    const widgets: Range<Decoration>[] = [];
    // starts with any number of #

    const tree = syntaxTree(state);
    tree.iterate({
      enter: (type, from, to) => {
        // const text = state.doc.sliceString(from, to);
        // useful for finding the type of some text
        // console.log(type, text)
        if (type.name.startsWith("ATXHeading")) {
          const level = type.name.split("Heading")[1];
          const newDecoration = headerDecoration({ level });
          widgets.push(
            newDecoration.range(
              state.doc.lineAt(from).from,
              state.doc.lineAt(to).to
            )
          );
        } else if (type.name === "SetextHeading2") {
          const newDecoration = horizontalRuleDecorationAfter();
          widgets.push(newDecoration.range(from, to));
        } else if (type.name === "Link") {
          const text = state.doc.sliceString(from, to);
          const linkRegex = /\[.*?\]\((?<url>.*?)\)/;
          const url = linkRegex.exec(text)?.groups?.url;
          const linkTextRegex = /\[(?<text>.*?)\]/;
          const linkText = linkTextRegex.exec(text)?.groups?.text || "";
          if (url) {
            const newDecoration = linkDecoration(text, linkText, url);
            widgets.push(newDecoration.range(from, to));
          }
        } else if (type.name === "Blockquote") {
          const newDecoration = blockquoteDecoration();
          widgets.push(newDecoration.range(from));
        } else if (type.name === "ListItem") {
          const text = state.doc.sliceString(from, to);
          console.log(type);
          const listType = ["-", "*"].includes(text[0]) ? "ul" : "ol";
          const index = text.split(" ")[0];
          console.log({ text, index });
          const newDecoration = listItemDecoration(listType, index);
          widgets.push(newDecoration.range(from));
        } else if (type.name === "CodeText") {
          const newDecoration = codeBlockDecoration();
          const fromLine = state.doc.lineAt(from);
          const toLine = state.doc.lineAt(to);
          for (let i = fromLine.from; i < toLine.to; i++) {
            const linePosition = state.doc.lineAt(i);
            widgets.push(newDecoration.range(linePosition.from));
          }
          // widgets.push(newDecoration.range(from));
        } else if (type.name === "HTMLTag") {
          // punting for now, it splits the text into multiple widgets:
          // start tag, text, end tag
          // const linkRegexHtml = /<a.*?href="(?<url>.*?)".*?>(?<text>.*?)[<\/a>]*/
          // const result = linkRegexHtml.exec(state.doc.sliceString(from, to))
          // if (result && result.groups && result.groups.url) {
          //   let linkText = result.groups.text
          //   if (!linkText && !linkText.includes("</a>")) {
          //     const nextNode = tree.resolve(to)
          //     linkText = state.doc.slice(nextNode.from, nextNode.to).text[0]
          //     to += linkText.length
          //   }
          //   const url = result.groups.url
          //   const newDecoration = linkDecoration(linkText, url)
          //   widgets.push(newDecoration.range(from, to))
          // }
        } else if (type.name === "HorizontalRule") {
          const newDecoration = horizontalRuleDecorationAfter();
          widgets.push(newDecoration.range(from, to));
        }
      },
    });

    return widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none;
  };

  const copysTheme = EditorView.baseTheme({});

  const copysField = StateField.define<DecorationSet>({
    create(state) {
      return decorate(state);
    },
    update(copys, transaction) {
      if (transaction.docChanged || transaction.changes.length > 0) {
        return decorate(transaction.state);
      }

      return copys.map(transaction.changes);
    },
    provide(field) {
      return EditorView.decorations.from(field);
    },
  });

  return [copysTheme, copysField];
};

export const markdownKeymap: KeyBinding[] = [
  // text formatting
  {
    key: "Mod-b",
    run: (view) => toggleWrapSelectionWithSymbols(view, "**"),
  },
  {
    key: "`",
    run: (view) => toggleWrapSelectionWithSymbols(view, "`"),
  },
  {
    key: "Mod-i",
    run: (view) => toggleWrapSelectionWithSymbols(view, "_"),
  },
];

const toggleWrapSelectionWithSymbols = (view: EditorView, symbols: string) => {
  const selection = view.state.selection;
  let runningDiff = 0; // to keep track of previous changes with multiple selections

  selection.ranges.forEach((range, i) => {
    let from = range.from + runningDiff;
    let to = range.to + runningDiff;
    let text = view.state.doc.sliceString(from, to);

    if (!text) {
      // select word at cursor
      const edgeOfWordLeft = moveBySubword(view, range, false).from;
      const edgeOfWordRight = moveBySubword(view, range, true).from;
      const word = view.state.doc.sliceString(edgeOfWordLeft, edgeOfWordRight);
      if (word) {
        from = edgeOfWordLeft;
        to = edgeOfWordRight;
        text = word;
      }
    }

    let isWrappedBySymbols = text.startsWith(symbols) && text.endsWith(symbols);

    if (!isWrappedBySymbols) {
      // check if the symbols are just outside the selection
      const surroundingText = view.state.doc.sliceString(
        from - symbols.length,
        to + symbols.length
      );
      const isSurroundedBySymbols =
        surroundingText.startsWith(symbols) &&
        surroundingText.endsWith(symbols);
      if (isSurroundedBySymbols) {
        from -= symbols.length;
        to += symbols.length;
        text = view.state.doc.sliceString(from, to);
        isWrappedBySymbols = true;
      }
    }

    const newText = isWrappedBySymbols
      ? text.slice(symbols.length, -symbols.length)
      : symbols + text + symbols;
    const textDiff = newText.length - text.length;
    runningDiff += textDiff;

    // change the active selection to just inside the symbols (or removed symbols)
    const newFrom = textDiff > 0 ? from + textDiff / 2 : from;
    const newTo = textDiff > 0 ? to + textDiff / 2 : to + textDiff;

    // update the state
    const newRange = EditorSelection.range(newFrom, newTo);
    let newState = view.state.update({
      changes: { from, to, insert: newText },
      selection: view.state.selection.replaceRange(newRange, i),
    });
    view.dispatch(newState);
  });

  return true; // return true to always use this behavior
};

// nabbed from @codemirror/commands/dist/index.js
function moveBySubword(view, range, forward) {
  let categorize = view.state.charCategorizer(range.from);
  return view.moveByChar(range, forward, (start) => {
    let cat = CharCategory.Space,
      pos = range.from;
    let done = false,
      sawUpper = false,
      sawLower = false;
    let step = (next) => {
      if (done) return false;
      pos += forward ? next.length : -next.length;
      let nextCat = categorize(next),
        ahead;
      if (cat == CharCategory.Space) cat = nextCat;
      if (cat != nextCat) return false;
      if (cat == CharCategory.Word) {
        if (next.toLowerCase() == next) {
          if (!forward && sawUpper) return false;
          sawLower = true;
        } else if (sawLower) {
          if (forward) return false;
          done = true;
        } else {
          if (
            sawUpper &&
            forward &&
            categorize((ahead = view.state.sliceDoc(pos, pos + 1))) ==
              CharCategory.Word &&
            ahead.toLowerCase() == ahead
          )
            return false;
          sawUpper = true;
        }
      }
      return true;
    };
    step(start);
    return step;
  });
}
