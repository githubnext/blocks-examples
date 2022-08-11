import { syntaxTree } from "@codemirror/language";
import { Range, RangeSet } from "@codemirror/rangeset";
import { EditorState, Extension, StateField } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import unescape from "lodash.unescape";

interface ImageWidgetParams {
  url: string;
  width: string | undefined;
  height: string | undefined;
}

class ImageWidget extends WidgetType {
  readonly url;
  readonly width;
  readonly height;

  constructor({ url, width, height }: ImageWidgetParams) {
    super();

    this.url = url;
    this.width = width;
    this.height = height;
  }

  eq(imageWidget: ImageWidget) {
    return (
      imageWidget.url === this.url &&
      imageWidget.width === this.width &&
      imageWidget.height === this.height
    );
  }

  toDOM() {
    const figure = document.createElement("figure");
    const image = figure.appendChild(document.createElement("img"));

    figure.className = "cm-image-container";
    image.src = this.url;

    figure.style.margin = "0";

    const parseStyle = (style: string) => {
      if (!style) return null;
      if (Number.isFinite(+style)) return `${style}px`;
      return style;
    };
    image.style.width = parseStyle(this.width) || "auto";
    image.style.maxWidth = "100%";
    image.style.height = parseStyle(this.height) || "auto";

    return figure;
  }

  ignoreEvent(_event: Event): boolean {
    return false;
  }
}

export const images = (): Extension => {
  const imageRegex = /!\[(?<alt>.*?)\]\((?<url>.*?)\)/;
  const imageRegexHtml = /<img.*?src="(?<url>.*?)".*?>/;

  const imageDecoration = (imageWidgetParams: ImageWidgetParams) =>
    Decoration.widget({
      widget: new ImageWidget(imageWidgetParams),
      side: 1,
      block: true,
      class: "image",
    });

  const imageTextDecoration = () =>
    Decoration.mark({
      class: "cm-image",
    });

  const imageAltDecoration = () =>
    Decoration.mark({
      class: "cm-image-alt",
    });

  const decorate = (state: EditorState) => {
    const widgets: Range<Decoration>[] = [];

    syntaxTree(state).iterate({
      enter: (type, from, to) => {
        if (type.name === "Image") {
          const text = state.doc.sliceString(from, to);
          const result = imageRegex.exec(text);

          if (result && result.groups && result.groups.url) {
            const widthRegex = /width="(?<width>.*?)"/;
            const heightRegex = /height="(?<height>.*?)"/;
            const widthResult = widthRegex.exec(result.groups.url);
            const heightResult = heightRegex.exec(result.groups.url);
            widgets.push(
              imageDecoration({
                url: result.groups.url,
                width: widthResult?.groups?.width,
                height: heightResult?.groups?.height,
              }).range(state.doc.lineAt(from).from)
            );
            widgets.push(
              imageTextDecoration().range(
                state.doc.lineAt(from).from,
                state.doc.lineAt(to).to
              )
            );
            let alt = result.groups.alt || text;
            const altIndex = from + text.indexOf(alt);
            console.log(alt);
            widgets.push(
              imageAltDecoration().range(altIndex, altIndex + alt.length)
            );
          }
        } else if (["HTMLBlock", "Paragraph"].includes(type.name)) {
          const text = state.doc.sliceString(from, to);
          const result = imageRegexHtml.exec(text);

          if (result && result.groups && result.groups.url) {
            const widthRegex = /width="(?<width>.*?)"/;
            const heightRegex = /height="(?<height>.*?)"/;
            const widthResult = widthRegex.exec(text);
            const heightResult = heightRegex.exec(text);
            widgets.push(
              imageDecoration({
                url: result.groups.url,
                width: widthResult?.groups?.width,
                height: heightResult?.groups?.height,
              }).range(state.doc.lineAt(from).from)
            );
            widgets.push(
              imageTextDecoration().range(
                state.doc.lineAt(from).from,
                state.doc.lineAt(to).to
              )
            );
            const altRegex = /alt="(?<alt>.*?)"/;
            const altResult = altRegex.exec(text);
            let alt = altResult?.groups?.alt || text;
            const altIndex = from + text.indexOf(alt);
            console.log(alt);
            widgets.push(
              imageAltDecoration().range(altIndex, altIndex + alt.length)
            );
          }
        }
      },
    });

    if (!widgets.length) return Decoration.none;
    // we need to return the widgets in order
    const sortedWidgets = widgets.sort((a, b) => {
      if (a.from < b.from) return -1;
      if (a.from > b.from) return 1;
      return a.value.startSide < b.value.startSide ? -1 : 1;
    });
    return RangeSet.of(sortedWidgets);
  };

  const imagesTheme = EditorView.baseTheme({
    ".cm-image-backdrop": {
      backgroundColor: "var(--ink-internal-block-background-color)",
    },
  });

  const imagesField = StateField.define<DecorationSet>({
    create(state) {
      return decorate(state);
    },
    update(images, transaction) {
      // taking out restrictions for now,
      // it wasn't updating outside of the active scroll window
      // if (transaction.docChanged) {
      return decorate(transaction.state);
      // }

      // return images.map(transaction.changes);
    },
    provide(field) {
      return EditorView.decorations.from(field);
    },
  });

  return [imagesTheme, imagesField];
};
