import { ReactNode, useEffect, useState } from "react";
import LZString from "lz-string"

const optionsDefaults = {
  fontsize: "14",
  hidenavigation: "1",
  codemirror: "1",
  hidedevtools: "1",
}
export const CodeSandbox = ({
  children,
  height = "20em",
  sandboxOptions = {},
  dependencies,
}: {
  height: string | number;
  theme: string;
  sandboxOptions: Record<string, string>;
  children: ReactNode;
  dependencies?: string[];
}) => {
  const [url, setUrl] = useState("");
  const parameters = getParameters({
    files: {
      "index.js": {
        // @ts-ignore
        content: children?.props?.children?.props?.children,
        isBinary: false,
      },
      "package.json": {
        content: JSON.stringify({
          // @ts-ignore
          dependencies: parseDependencies(dependencies),
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
    const params = new URLSearchParams({ ...optionsDefaults, ...sandboxOptions }).toString()
    const iframeUrl = `https://codesandbox.io/embed/${id}?${params}`;

    setUrl(iframeUrl);
  };
  useEffect(() => {
    getSandboxUrl();
  }, []);

  return (
    <div className="w-full h-full mt-3 mb-10">
      {!!url && (
        <iframe
          className="w-full outline-none"
          style={{
            height
          }}
          src={url}
          title="CodeSandbox"
          sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
        />
      )}
    </div>
  );
};

const parseDependencies = (dependencies: string[]): Record<string, string> => {
  let res = {};
  dependencies.forEach((dep) => {
    const [name, version = "latest"] = dep.split("@");
    // @ts-ignore
    res[name] = version;
  });
  return res;
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