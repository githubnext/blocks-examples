import { tw } from "twind";
import { FileBlockProps } from "@githubnext/blocks";
import { Grid } from "@githubocto/flat-ui";
import { csvFormat, csvParseRows } from "d3";
import { load } from "js-yaml";
import { useMemo } from "react";

export default function (props: FileBlockProps) {
  const { content, context, originalContent, isEditable, onUpdateContent } =
    props;

  const data = useMemo(() => parseContent(context.path, content), [content]);
  const originalData = useMemo(
    () => parseContent(context.path, originalContent),
    [originalContent]
  );

  return (
    <div className={tw(`h-full flex flex-col flex-1`)}>
      <Grid
        data={data}
        diffData={originalData}
        canDownload={false}
        isEditable={isEditable}
        onEdit={(data: any) => {
          onUpdateContent(csvFormat(data));
        }}
      />
    </div>
  );
}

function parseCSV(content: string): any[] {
  try {
    const rows = csvParseRows(content);
    const headers = rows[0];
    const csvData = rows.slice(1).map((row: any) => {
      return headers.reduce((acc: Record<string, any>, key, i) => {
        acc[key] = Number.isFinite(row[i]) ? +row[i] : row[i];
        return acc;
      }, {});
    });
    return csvData;
  } catch (e) {
    return [];
  }
}
function parseYML(content: string): any[] {
  try {
    const data = load(content);
    const isArray = Array.isArray(data);
    if (isArray) return data;
    // can we flatten an object into something sensical?
    const flattenedData = Object.keys(data).map((key) => {
      const contents = data[key];
      const expandedContents =
        typeof contents === "object" && contents !== null
          ? contents
          : { contents: JSON.stringify(contents) };
      return {
        __KEY__: key,
        ...expandedContents,
      };
    });
    return flattenedData;
  } catch (e) {
    return [];
  }
}
function parseContent(path: string, content: string): any[] {
  const extension = path.split(".").pop();
  if (extension === "csv") {
    return parseCSV(content);
  } else if (["yaml", "yml"].includes(extension)) {
    return parseYML(content);
  } else {
    return [];
  }
}
