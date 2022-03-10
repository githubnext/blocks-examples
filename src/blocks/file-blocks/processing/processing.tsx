import { FileBlockProps } from "@githubnext/utils";
import { SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";
// these styles are so that the codesandbox preview shows up with full height in Blocks app
import "./style.css";

export default function (props: FileBlockProps) {
  const { content } = props;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <SandpackProvider
        externalResources={[ 'https://cdn.jsdelivr.net/npm/p5@1.4.1/lib/p5.js' ]}
        customSetup={{
            files: {
                "/src/index.js": {
                  code: content,
                },
                "/index.html": {
                  code: `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <main></main>
    <script src="src/index.js"></script>
  </body>
  </html>`
                }
              },
          dependencies: {},
          entry: "/src/index.js",
          main: "/src/index.js",
          environment: "static",
        }}
        autorun
      >
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton={false}
        />
      </SandpackProvider>
    </div>
  );
}
