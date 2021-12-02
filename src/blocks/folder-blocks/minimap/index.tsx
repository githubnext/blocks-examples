import { useMemo } from "react";
// @ts-ignore
import { Tree } from "./Tree.jsx"
import { FolderBlockProps, getNestedFileTree, } from "@githubnext/utils";

export default function (props: FolderBlockProps) {
  const { tree, onNavigateToPath } = props;

  const data = useMemo(() => {
    const nestedTree = getNestedFileTree(tree)[0]
    return nestedTree
  }, [tree])

  return (
    <div style={{
      width: 600,
      height: 600,
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
    }} >
      <Tree
        data={data}
        onClickFile={(path: string) => {
          onNavigateToPath(path);
        }}
      />
    </div>
  );
}
