import { syntaxTree } from "@codemirror/language";
import {
  EditorState,
  Extension,
  Range,
  RangeSet,
  StateField,
} from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import { FileContext, FolderContext } from "@githubnext/blocks";

interface ImageWidgetParams {
  url: string;
  width: string | undefined;
  height: string | undefined;
}

class ImageWidget extends WidgetType {
  readonly url;
  readonly width;
  readonly height;
  readonly alt;

  constructor({ url, width, height, alt }: ImageWidgetParams) {
    super();

    this.url = url;
    this.width = width;
    this.height = height;
    this.alt = alt;
  }

  eq(imageWidget: ImageWidget) {
    return (
      imageWidget.url === this.url &&
      imageWidget.width === this.width &&
      imageWidget.height === this.height &&
      imageWidget.alt === this.alt
    );
  }

  toDOM() {
    const figure = document.createElement("figure");
    // we're only using light mode so far
    if (this.url.endsWith("#gh-dark-mode-only")) return figure;
    const image = figure.appendChild(document.createElement("img"));

    figure.className = "cm-image-container";
    image.src = this.url;

    figure.style.margin = "0";

    const parseStyle = (style: string) => {
      if (!style) return null;
      if (Number.isFinite(+style)) return `${style}px`;
      return style;
    };
    image.style.width = parseStyle(this.width) || "100%";
    image.style.maxWidth = "100%";
    image.style.height = parseStyle(this.height) || "auto";
    image.alt = this.alt || "";

    return figure;
  }

  ignoreEvent(_event: Event): boolean {
    return false;
  }
}

export const images = ({
  context,
}: {
  context: FileContext | FolderContext;
}): Extension => {
  const imageRegex = /!\[(?<alt>.*?)\]\((?<url>.*?)\)/;

  const imageDecoration = (imageWidgetParams: ImageWidgetParams) =>
    Decoration.widget({
      widget: new ImageWidget(imageWidgetParams),
    });

  const imageTextDecoration = () =>
    Decoration.mark({
      class: "cm-image",
    });

  const decorate = (state: EditorState) => {
    const widgets: Range<Decoration>[] = [];

    syntaxTree(state).iterate({
      enter: ({ type, from, to }) => {
        if (type.name === "Image") {
          const text = state.doc.sliceString(from, to);
          const result = imageRegex.exec(text);

          if (result && result.groups && result.groups.url) {
            const widthRegex = /width="(?<width>.*?)"/;
            const heightRegex = /height="(?<height>.*?)"/;
            const widthResult = widthRegex.exec(result.groups.url);
            const heightResult = heightRegex.exec(result.groups.url);
            let alt = result.groups.alt || text;
            widgets.push(
              imageDecoration({
                url: parseImageUrl(result.groups.url, context),
                width: widthResult?.groups?.width,
                height: heightResult?.groups?.height,
                alt,
              }).range(from)
            );
            widgets.push(imageTextDecoration().range(from, to));
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

  const imagesTheme = EditorView.baseTheme({});

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

export const parseImageUrl = (
  url: string,
  context: FileContext | FolderContext
) => {
  if (!url.startsWith("http")) {
    const pathRoot = context.path.split("/").slice(0, -1).join("/");
    return `https://raw.githubusercontent.com/${context.owner}/${context.repo}/${context.sha}/${pathRoot}/${url}`;
  } else {
    return url;
  }
};
