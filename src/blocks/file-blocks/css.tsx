import { useEffect, useMemo } from "react";
// @ts-ignore: no types
import { toJSON } from "cssjson";
import { FileBlockProps } from "@githubnext/utils";

export default function (props: FileBlockProps) {
  const { content } = props;

  useEffect(() => {
    if (typeof document === "undefined") return;

    const script = document.createElement("script");

    script.src = "https://cdn-tailwindcss.vercel.app";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const { tree, flattenedRules, widelyApplicableAttributes } = useMemo(() => {
    const tree = toJSON(content);
    // const rules = getRulesFromTreeItem(tree)
    let flattenedRules = {} as any;
    Object.keys(tree.children).forEach((key) => {
      const selectors = key.split(",").map((s) => s.trim());
      selectors.forEach((selector) => {
        if (!flattenedRules[selector]) {
          flattenedRules[selector] = {};
        }
        flattenedRules[selector] = {
          ...flattenedRules[selector],
          ...(tree.children[key]?.attributes || {}),
        };
      });
    });
    const widelyApplicableAttributes = {
      ...(flattenedRules["body"] || {}),
      ...(flattenedRules["*"] || {}),
    };
    return { tree, flattenedRules, widelyApplicableAttributes };
  }, [content]);

  return (
    <div
      className="p-8"
      style={{
        background:
          flattenedRules?.["body"]?.background ||
          flattenedRules?.["body"]?.backgroundColor ||
          "white",
        color: flattenedRules?.["body"]?.color || "black",
      }}
    >
      {Object.keys(flattenedRules).map((selector) => {
        return (
          <TreeItem
            selector={selector}
            attributes={flattenedRules[selector]}
            inheritedAttributes={widelyApplicableAttributes}
          />
        );
      })}
    </div>
  );
}

const selectorsToNotRender = ["*", "body"];
const TreeItem = ({
  selector = "",
  attributes = {},
  inheritedAttributes = {},
}: {
  selector?: string;
  attributes?: Record<string, string>;
  inheritedAttributes?: Record<string, string>;
}) => {
  const attributeNames = Object.keys(attributes || {});
  const cssVariableNames = attributeNames.filter((name) =>
    name.startsWith("--")
  );
  if (selectorsToNotRender.includes(selector) && !cssVariableNames.length) {
    return null;
  }

  return (
    <div className="py-3 flex">
      <div className="font-mono w-40 sticky top-2 pt-2 h-8 flex-none">
        {selector}
      </div>
      <div>
        {cssVariableNames.map((variable) => {
          return (
            <div className="flex items-center text-xs m-1" key={variable}>
              <div className="font-mono flex-none w-60">{variable}</div>
              <Attribute value={attributes[variable]} />
            </div>
          );
        })}
      </div>

      <ItemRenderer
        selector={selector}
        attributes={{ ...inheritedAttributes, ...attributes }}
      />
    </div>
  );
};

const Attribute = ({ value }: { value: string }) => {
  const isColor = value.startsWith("#");
  if (isColor)
    return (
      <div
        className="h-6 w-6 rounded"
        style={{
          backgroundColor: value,
        }}
      />
    );
  return (
    <div className="p-1 bg-gray-100 rounded text-gray-800 font-mono">
      {value}
    </div>
  );
};

const ItemRenderer = ({
  selector,
  attributes,
}: {
  selector: string;
  attributes: any;
}) => {
  const Component = selector;
  if (selectorsToNotRender.includes(selector)) return null;
  if (selector === "p")
    return (
      <p style={attributes}>
        This is what a paragraph looks like. Lorem ipsum dolor sit amet
        consectetur adipisicing elit. Inventore rem non consectetur.
      </p>
    );
  return (
    // @ts-ignore
    <Component style={attributes}>This is a {selector}</Component>
  );
};
