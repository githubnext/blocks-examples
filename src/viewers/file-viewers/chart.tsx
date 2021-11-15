import { useMemo } from "react";
import { csvParse } from "d3";
// need to explicitely import libraries
import "vega";
import "vega-lite";
import { Vega }from "react-vega";

export function Viewer(props: FileViewerProps) {
    const { content } = props;

  const data = useMemo(() => ({ data: parseData(content) }), [content]);

  console.log(data);
  const parsedConfig = {
    width: 500,
    height: 500,
    data: [{ name: "data" }],
    // ...config
  };

  return (
    <div className="w-full h-full">
      <div className="flex w-full h-full">
        {/* <ConfigEditor config={config} setConfig={setConfig} metadata={metadata} onUpdateMetadata={onUpdateMetadata} /> */}
        <div className="flex-1 font-mono p-8 px-10">
          {!!data && <Vega spec={parsedConfig} data={data} />}
        </div>
      </div>
    </div>
  );
}

const parseData = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    try {
      return csvParse(str);
    } catch (e) {
      console.error(e);
      return [];
    }
  }
};