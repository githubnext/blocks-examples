import { tw } from "twind";
import { FileBlockProps } from "@githubnext/utils";
import { Grid } from "@githubocto/flat-ui";
import { csvFormat, csvParseRows } from "d3";
import { useMemo } from "react";

function parseCSV(content: string) {
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

export default function (props: FileBlockProps) {
  const { content, originalContent, isEditable, onUpdateContent } = props;

  const data = useMemo(() => parseCSV(content), [content]);
  const originalData = useMemo(
    () => parseCSV(originalContent),
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
