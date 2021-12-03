import { FileBlockProps, useTailwindCdn } from "@githubnext/utils";
import { parse } from "papaparse";
import { useEffect, useMemo, useState } from "react";
// @ts-ignore: we need to specify the file extension
import { Chart } from "./Chart.tsx";
// @ts-ignore: we need to specify the file extension
import { ErrorBoundary } from "./ErrorBoundary.tsx";

export default function (props: FileBlockProps) {
  useTailwindCdn()
  const { content, metadata, onUpdateMetadata } = props;
  const [xMetric, setXMetric] = useState("");
  const [yMetric, setYMetric] = useState("");
  const [chartType, setChartType] = useState("area");

  const data = useMemo(() => (parseData(content)), [content])
  const savedChartConfigs = metadata.configs || []
  const getChartConfig = (xMetric: string, yMetric: string, chartType: string) => [
    xMetric, yMetric, chartType
  ].join(", ")
  const activeChartConfig = getChartConfig(xMetric, yMetric, chartType)
  const activeChartConfigIndex = savedChartConfigs.indexOf(activeChartConfig)
  const onLoadChartConfig = (chartConfig: string) => {
    if (!chartConfig) return
    const [xMetric, yMetric, chartType] = chartConfig.split(", ")
    setXMetric(xMetric)
    setYMetric(yMetric)
    setChartType(chartType)
  }

  const keys = Object.keys(data[0] || {});

  useEffect(() => {
    const getIsValidKey = (d: string) => keys.includes(d)
    if (!getIsValidKey(xMetric)) setXMetric(keys[0]);
    if (!getIsValidKey(yMetric)) setYMetric(keys[1]);
    if (savedChartConfigs.length > 0) {
      onLoadChartConfig(savedChartConfigs[activeChartConfigIndex === -1 ? 0 : activeChartConfigIndex])
    }
  }, [keys.join(","), savedChartConfigs.join(",")])

  return (
    <div className="w-full h-full">
      <div className="flex items-center flex-wrap">
        <Select canBeEmpty label="saved charts" value={activeChartConfig} onChange={onLoadChartConfig} options={savedChartConfigs} />
        {activeChartConfigIndex !== -1 ? (
          <button className="py-2 px-4 mt-6 text-sm bg-indigo-500 text-white rounded-xl" onClick={() => {
            const newMetadata = { configs: savedChartConfigs.filter((c: string) => c !== activeChartConfig) }
            onUpdateMetadata(newMetadata)
          }}>Delete config</button>
        ) : (
          <button className="py-2 px-4 mt-6 text-sm bg-indigo-500 text-white rounded-xl" onClick={() => {
            const newMetadata = {
              configs: [...savedChartConfigs, activeChartConfig],
            }
            onUpdateMetadata(newMetadata)
          }}>Save config</button>
        )}
        <div className="ml-auto flex items-center flex-wrap">
          <Select label="x metric" value={xMetric} onChange={setXMetric} options={keys} />
          <Select label="y metric" value={yMetric} onChange={setYMetric} options={keys} />
          <Select label="chart type" value={chartType} onChange={setChartType} options={chartTypes} />
        </div>
      </div>

      <div className="w-full">
        <ErrorBoundary>
          <Chart data={data} xMetric={xMetric} yMetric={yMetric} type={chartType} />
        </ErrorBoundary>
      </div>
    </div>
  )
}

const chartTypes = ["area", "line", "bar", "scatter", "pie"];

const Select = ({ label, value, options, canBeEmpty, onChange }: {
  label: string,
  value: string,
  options: string[],
  canBeEmpty?: boolean,
  onChange: (value: string) => void,
}) => {
  return (
    <div className="m-4 flex-1 flex flex-col max-w-[12em]">
      <label>{label}</label>
      <select
        className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {canBeEmpty && <option value="">--</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

const parseData = (str: string): any[] => {
  try {
    return JSON.parse(str);
  } catch (e) {
    try {
      // @ts-ignore
      const parsedStr = parse(str, {
        delimiter: "",
        transformHeader: (header: string) => header,
        newline: "",
        header: true,
        skipEmptyLines: true,
      }) as any;
      if (parsedStr.errors.length) {
        throw new Error(parsedStr.errors[0].message);
      }
      return parsedStr.data;
    } catch (e) {
      console.error(e);
      return [];
    }
  }
};
