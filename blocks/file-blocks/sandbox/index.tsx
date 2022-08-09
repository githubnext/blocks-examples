import { tw } from "twind";
import { ReactNode, useEffect, useState } from "react";
import LZString from "lz-string";
import { FileBlockProps } from "@githubnext/blocks";

const optionsDefaults = {
  fontsize: 14,
  hidenavigation: 1,
  codemirror: 1,
  hidedevtools: 0,
  expanddevtools: 1,
  view: "split",
};
export default ({ content, state = {} }: FileBlockProps) => {
  const [url, setUrl] = useState("");
  const parameters = getParameters({
    files: {
      "index.js": {
        // @ts-ignore
        content,
        isBinary: false,
      },
      "package.json": {
        content: JSON.stringify({
          dependencies: getDependenciesFromString(content),
        }),
        isBinary: false,
      },
    },
  });

  const getSandboxUrl = async () => {
    const url = `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parameters}&json=1`;
    const res = await fetch(url);
    const data = await res.json();
    const id = data?.sandbox_id;
    const params = new URLSearchParams({
      ...optionsDefaults,
      ...(state.sandboxOptions || {}),
    }).toString();
    const iframeUrl = `https://codesandbox.io/embed/${id}?${params}`;

    setUrl(iframeUrl);
  };
  useEffect(() => {
    getSandboxUrl();
  }, []);

  return (
    <div className={tw(`w-full h-full mt-3 mb-10`)}>
      {!!url && (
        <iframe
          className={tw(`w-full h-full outline-none`)}
          src={url}
          title="CodeSandbox"
          sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
        />
      )}
    </div>
  );
};

const getDependenciesFromString = (content: string) => {
  const importStatements = content
    .slice(content.indexOf("import"))
    .split("import");
  let dependencies = {};
  importStatements.forEach((statement) => {
    const importRegex =
      /import\s+(?<variables>.+)\s+from\s+["'](?<dependency>[^"']+)["']/gm;
    const imports = importRegex.exec(`import ${statement}`);
    if (imports?.groups?.dependency) {
      const dependencyRoot = imports.groups.dependency.split("/")[0];
      dependencies[dependencyRoot] = "latest";
    }
  });
  return dependencies;
};

// ported from "codesandbox/lib/api/define"
function compress(input: string) {
  return LZString.compressToBase64(input)
    .replace(/\+/g, "-") // Convert '+' to '-'
    .replace(/\//g, "_") // Convert '/' to '_'
    .replace(/=+$/, ""); // Remove ending '='
}
function getParameters(parameters: any) {
  return compress(JSON.stringify(parameters));
}
