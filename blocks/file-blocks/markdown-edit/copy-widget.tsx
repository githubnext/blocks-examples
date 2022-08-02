import { syntaxTree } from "@codemirror/language";
import { Range, RangeSet } from "@codemirror/rangeset";
import { EditorState, Extension, StateField } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";

class HorizontalRuleWidget extends WidgetType {
  toDOM() {
    const hr = document.createElement("hr");
    return hr;
  }
}

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

  const decorate = (state: EditorState) => {
    const widgets: Range<Decoration>[] = [];
    // starts with any number of #

    const tree = syntaxTree(state);
    tree.iterate({
      enter: (type, from, to) => {
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
          // const toPos = state.doc.lineAt(to).to
          widgets.push(newDecoration.range(from, to));
        } else if (type.name === "Link") {
          const text = state.doc.sliceString(from, to);
          const linkRegex = /\[.*?\]\((?<url>.*?)\)/;
          const url = linkRegex.exec(text)?.groups?.url;
          const linkTextRegex = /\[(?<text>.*?)\]/;
          const linkText = linkTextRegex.exec(text)?.groups?.text;
          if (url) {
            const newDecoration = linkDecoration(text, linkText, url);
            widgets.push(newDecoration.range(from, to));
          }
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
      console.log(transaction);
      if (transaction.docChanged) {
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
