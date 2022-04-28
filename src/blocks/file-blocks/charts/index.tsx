import { tw } from "twind";
import { FileBlockProps } from "@githubnext/utils";
import { ActionList, ActionMenu } from "@primer/react";
import { parse } from "papaparse";
import { useEffect, useMemo, useState } from "react";
// @ts-ignore: we need to specify the file extension
import { Chart } from "./Chart.tsx";
// @ts-ignore: we need to specify the file extension
import { ErrorBoundary } from "./ErrorBoundary.tsx";
import { Button } from "@primer/react";

export default function (props: FileBlockProps) {
  const { content, metadata, onUpdateMetadata } = props;
  const [xMetric, setXMetric] = useState("");
  const [yMetric, setYMetric] = useState("");
  const [chartType, setChartType] = useState("area");

  const data = useMemo(() => parseData(content), [content]);
  const savedChartConfigs = metadata.configs || [];
  const getChartConfig = (
    xMetric: string,
    yMetric: string,
    chartType: string
  ) => [xMetric, yMetric, chartType].join(", ");
  const activeChartConfig = getChartConfig(xMetric, yMetric, chartType);
  const activeChartConfigIndex = savedChartConfigs.indexOf(activeChartConfig);
  const onLoadChartConfig = (chartConfig: string) => {
    if (!chartConfig) return;
    const [xMetric, yMetric, chartType] = chartConfig.split(", ");
    setXMetric(xMetric);
    setYMetric(yMetric);
    setChartType(chartType);
  };

  const keys = Object.keys(data[0] || {});

  useEffect(() => {
    const getIsValidKey = (d: string) => keys.includes(d);
    if (!getIsValidKey(xMetric)) setXMetric(keys[0]);
    if (!getIsValidKey(yMetric)) setYMetric(keys[1]);
    if (savedChartConfigs.length > 0) {
      onLoadChartConfig(
        savedChartConfigs[
          activeChartConfigIndex === -1 ? 0 : activeChartConfigIndex
        ]
      );
    }
  }, [keys.join(","), savedChartConfigs.join(",")]);

  return (
    <div className={tw(`w-full h-full`)}>
      <div className={tw(`flex p-3`)}>
        <Select
          label="saved charts"
          value={activeChartConfig}
          onChange={onLoadChartConfig}
          options={savedChartConfigs}
        />
        {activeChartConfigIndex !== -1 ? (
          <Button
            variant="danger"
            className={tw(`ml-2`)}
            onClick={() => {
              const newMetadata = {
                configs: savedChartConfigs.filter(
                  (c: string) => c !== activeChartConfig
                ),
              };
              onUpdateMetadata(newMetadata);
            }}
          >
            Delete config
          </Button>
        ) : (
          <Button
            className={tw(`ml-2`)}
            onClick={() => {
              const newMetadata = {
                configs: [...savedChartConfigs, activeChartConfig],
              };
              onUpdateMetadata(newMetadata);
            }}
          >
            Save config
          </Button>
        )}
        <div className={tw(`ml-auto flex items-center flex-wrap`)}>
          <div className={tw(`mr-2`)}>
            <Select
              label="x metric"
              value={xMetric}
              onChange={setXMetric}
              options={keys}
            />
          </div>
          <div className={tw(`mr-2`)}>
            <Select
              label="y metric"
              value={yMetric}
              onChange={setYMetric}
              options={keys}
            />
          </div>
          <Select
            label="chart type"
            value={chartType}
            onChange={setChartType}
            options={chartTypes}
          />
        </div>
      </div>

      <div className={tw(`w-full`)}>
        <ErrorBoundary>
          <Chart
            data={data}
            xMetric={xMetric}
            yMetric={yMetric}
            type={chartType}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}

const chartTypes = ["area", "line", "bar", "scatter", "pie"];

const Select = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) => {
  return (
    <ActionMenu>
      <ActionMenu.Button>
        {label}: {value}
      </ActionMenu.Button>
      <ActionMenu.Overlay>
        <ActionList>
          {options.map((option) => (
            <ActionList.Item key={option} onSelect={() => onChange(option)}>
              {/* OcticonCheck */}
              {option}
            </ActionList.Item>
          ))}
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
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
