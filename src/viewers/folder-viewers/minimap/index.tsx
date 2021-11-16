import { useMemo } from "react";
import { stratify } from 'd3';
// @ts-ignore
import { Tree } from "./Tree.jsx"

export function Viewer(props: FolderViewerProps) {
  const { tree } = props;

  const data = useMemo(() => {
    const nestedTree = nestFileTree(tree);
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
      // onClickFile={path => {
      //   router.push({
      //     pathname: router.pathname,
      //     query: {
      //       ...query,
      //       path: path
      //     }
      //   })
      // }}
      />
    </div>
  );
}


export const nestFileTree = (files: any[]) => {
  const leaves = [
    ...files.map((d: any) => ({
      name: d.path.split('/').pop(),
      path: d.path,
      parent: d.path.split('/').slice(0, -1).join('/') || "__ROOT__",
      size: d.size || 0,
      children: [],
    })),
    {
      name: "__ROOT__",
      path: "__ROOT__",
      parent: null,
      size: 0,
      children: [],
    },
  ];

  const tree = stratify()
    .id((d: any) => d.path)
    .parentId((d: any) => d.parent)(leaves);

  const convertStratifyItem = (d: any) => ({
    ...d.data,
    children: d.children?.map(convertStratifyItem) || [],
  });
  const data = convertStratifyItem(tree)

  return data;
};
