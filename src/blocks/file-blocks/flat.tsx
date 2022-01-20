import { useMemo, useState } from "react";
import { csvParse, csvFormat } from "d3";
import { Grid } from "@githubocto/flat-ui";
import { FileBlockProps } from "@githubnext/utils";

export default function (props: FileBlockProps) {
  const { content, onRequestUpdateContent } = props;

  const [modifiedData, setModifiedData] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const data = useMemo(() => {
    try {
      return JSON.parse(content);
    } catch (e) {
      try {
        const csvData = csvParse(content);
        setModifiedData(csvData);
        setIsDirty(false)
        return csvData;
      } catch (e) {
        return [];
      }
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
