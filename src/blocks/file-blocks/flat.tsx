import { FileBlockProps } from "@githubnext/utils";
import { Grid } from "@githubocto/flat-ui";
import { csvFormat, csvParseRows } from "d3";
import { useMemo, useState } from "react";

export default function (props: FileBlockProps) {
  const { content, onRequestUpdateContent } = props;

  const [modifiedData, setModifiedData] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const data = useMemo(() => {
    try {
      const rows = csvParseRows(content);
      const headers = rows[0];
      const csvData = rows.slice(1).map((row: any) => {
        return headers.reduce((acc: Record<string, any>, key, i) => {
          acc[key] = Number.isFinite(row[i]) ? +row[i] : row[i];
          return acc;
        }, {})
      })
      setModifiedData(csvData);
      setIsDirty(false)
      return csvData;
    } catch (e) {
      return [];
    }
  }, [content]);

  return (
    <div className="height-full d-flex flex-column">
      <div className="flex-1" style={{ zIndex: 1 }}>
        <Grid
          data={modifiedData}
          diffData={data}
          isEditable
          onEdit={(data: any) => {
            setModifiedData(data);
            setIsDirty(true)
          }}
        />
      </div>
      {isDirty && (
        <button
          className="position-absolute btn btn-primary inline-block"
          style={{
            bottom: "12px",
            right: "175px",
            zIndex: 10,
          }}
          onClick={() => {
            onRequestUpdateContent(csvFormat(modifiedData));
          }}>
          Save changes
        </button>
      )}
    </div >
  )
}
