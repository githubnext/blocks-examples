import { tw } from "twind";
import { FileBlockProps } from "@githubnext/blocks";
import { Sandpack } from "@codesandbox/sandpack-react";
import { githubLight } from "@codesandbox/sandpack-themes";

export default ({ content }: FileBlockProps) => {
  const files = { "src/index.js": content };

  return (
    <Sandpack
      template="vanilla"
      files={files}
      theme={githubLight}
      customSetup={{ dependencies: getDependenciesFromString(content) }}
      options={{
        editorHeight: 300,
        showConsole: content.includes("console."),
        showTabs: true,
        classes: {
          "sp-layout": tw("border-0", "bg-gray-200"),
          "sp-button": tw("bg-gray-100"),
        },
      }}
    />
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
