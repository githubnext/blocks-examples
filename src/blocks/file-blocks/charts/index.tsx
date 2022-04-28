import { tw } from "twind";
import { FileBlockProps } from "@githubnext/utils";
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
      <div className={tw(`d-flex p-3`)}>
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
  canBeEmpty,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  canBeEmpty?: boolean;
  onChange: (value: string) => void;
}) => {
  return (
    <details
      className={tw(`dropdown details-reset details-overlay d-inline-block`)}
    >
      <summary className={tw(`btn`)} aria-haspopup="true">
        {label}: {value}
        <span className={tw(`dropdown-caret border-black`)}></span>
      </summary>
      <div className={tw(`SelectMenu`)}>
        <div className={tw(`SelectMenu-modal`)}>
          <div className={tw(`SelectMenu-list`)}>
            {canBeEmpty && (
              <button
                className={tw(`SelectMenu-item`)}
                role="menuitemcheckbox"
                aria-checked={!value}
                onClick={(e) => onChange("")}
              >
                <svg
                  className={tw(
                    `SelectMenu-icon SelectMenu-icon--check octicon octicon-check`
                  )}
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                >
                  {" "}
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M13.78 4.22C13.9204 4.36062 13.9993 4.55125 13.9993 4.75C13.9993 4.94875 13.9204 5.13937 13.78 5.28L6.53 12.53C6.38937 12.6704 6.19875 12.7493 6 12.7493C5.80125 12.7493 5.61062 12.6704 5.47 12.53L2.22 9.28C2.08752 9.13782 2.0154 8.94978 2.01882 8.75547C2.02225 8.56117 2.10096 8.37579 2.23838 8.23837C2.37579 8.10096 2.56118 8.02225 2.75548 8.01882C2.94978 8.01539 3.13782 8.08752 3.28 8.22L6 10.94L12.72 4.22C12.8606 4.07955 13.0512 4.00066 13.25 4.00066C13.4487 4.00066 13.6394 4.07955 13.78 4.22Z"
                  ></path>
                </svg>
                --
              </button>
            )}
            {options.map((option) => (
              <button
                aria-checked={option === value}
                className={tw(`SelectMenu-item`)}
                role="menuitemcheckbox"
                onClick={(e) => onChange(option)}
              >
                <svg
                  className={tw(
                    `SelectMenu-icon SelectMenu-icon--check octicon octicon-check`
                  )}
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                >
                  {" "}
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M13.78 4.22C13.9204 4.36062 13.9993 4.55125 13.9993 4.75C13.9993 4.94875 13.9204 5.13937 13.78 5.28L6.53 12.53C6.38937 12.6704 6.19875 12.7493 6 12.7493C5.80125 12.7493 5.61062 12.6704 5.47 12.53L2.22 9.28C2.08752 9.13782 2.0154 8.94978 2.01882 8.75547C2.02225 8.56117 2.10096 8.37579 2.23838 8.23837C2.37579 8.10096 2.56118 8.02225 2.75548 8.01882C2.94978 8.01539 3.13782 8.08752 3.28 8.22L6 10.94L12.72 4.22C12.8606 4.07955 13.0512 4.00066 13.25 4.00066C13.4487 4.00066 13.6394 4.07955 13.78 4.22Z"
                  ></path>
                </svg>
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </details>
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
