import { useMemo } from "react";
// @ts-ignore
import { Tree } from "./Tree";
import { FolderBlockProps, getNestedFileTree } from "@githubnext/blocks";

export default function (props: FolderBlockProps) {
  const { tree, onNavigateToPath } = props;

  const data = useMemo(() => {
    const nestedTree = getNestedFileTree(tree)[0];
    return nestedTree;
  }, [tree]);

  return (
    <div
      style={{
        width: 600,
        height: 600,
        margin: "2% auto",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Tree
        data={data}
        onClickFile={(path: string) => {
          onNavigateToPath(path);
        }}
      />
    </div>
  );
}
