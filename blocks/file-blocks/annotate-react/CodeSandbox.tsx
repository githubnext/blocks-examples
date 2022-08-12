import { SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";
import { useMemo } from "react";
import "./style.css";

export const CodeSandbox = ({
  children,
  dependencies,
}: {
  children: string;
  dependencies?: string[];
}) => {
  const files = useMemo(
    () => ({
      "/App.js": children,
    }),
    [children]
  );

  const parsedDependencies = useMemo(
    () => parseDependencies(dependencies || []),
    [dependencies]
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      {/* <SandpackProvider
        template="react"
        customSetup={{
          dependencies: parsedDependencies,
          files,
        }}
        autorun
      >
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton={false}
        />
      </SandpackProvider> */}
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
