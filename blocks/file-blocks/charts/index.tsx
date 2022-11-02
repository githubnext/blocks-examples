import { tw } from "twind";
import { FileBlockProps } from "@githubnext/blocks";
import {
  ActionList,
  ActionMenu,
  IconButton,
  Text,
  TextInput,
} from "@primer/react";
import { parse } from "papaparse";
import { useEffect, useMemo, useState } from "react";
// @ts-ignore: we need to specify the file extension
import { Chart } from "./Chart.tsx";
// @ts-ignore: we need to specify the file extension
import { ErrorBoundary } from "./ErrorBoundary.tsx";
import { Button } from "@primer/react";
import {
  CheckIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@primer/octicons-react";

export default function (props: FileBlockProps) {
  return <Wrapper {...props} />;
}

function Wrapper(props: FileBlockProps) {
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
    <div className={tw(`w-full h-full p-6`)}>
      <div className={tw(`w-full flex`)}>
        <div className={tw(`flex-none w-[20em]`)}>
          <div className={tw(`m-6 space-y-2`)}>
            <h6
              className={tw(`text-sm uppercase text-gray-500 tracking-widest`)}
            >
              Metrics
            </h6>
            <Select
              label="x"
              value={xMetric}
              onChange={setXMetric}
              options={keys}
            />
            <Select
              label="y"
              value={yMetric}
              onChange={setYMetric}
              options={keys}
            />
            <Select
              label="type"
              value={chartType}
              onChange={setChartType}
              options={chartTypes}
            />
          </div>

          <h6
            className={tw(
              `text-sm ml-6 mt-16 uppercase text-gray-500 tracking-widest`
            )}
          >
            Saved charts
          </h6>

          <ActionList showDividers selectionVariant="single">
            {savedChartConfigs.map((chartConfig, index) => {
              const [xMetric, yMetric, chartType] = chartConfig.split(", ");
              return (
                <ActionList.Item
                  className={tw("items-center")}
                  key={index}
                  selected={activeChartConfigIndex === index}
                  onClick={() => onLoadChartConfig(chartConfig)}
                >
                  <div className={tw(`py-1`)}>
                    <span className={tw("font-bold")}>{xMetric}</span>
                    <span className={tw("mx-1")}>vs</span>
                    <span className={tw("font-bold")}>{yMetric}</span>
                    <ActionList.Description>{chartType}</ActionList.Description>
                  </div>
                  {activeChartConfigIndex === index && (
                    <ActionList.TrailingVisual>
                      <IconButton
                        icon={TrashIcon}
                        size="small"
                        variant="danger"
                        className={tw(`ml-2`)}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newMetadata = {
                            configs: savedChartConfigs.filter(
                              (c: string) => c !== activeChartConfig
                            ),
                          };
                          onUpdateMetadata(newMetadata);
                        }}
                      >
                        Delete
                      </IconButton>
                    </ActionList.TrailingVisual>
                  )}
                </ActionList.Item>
              );
            })}
            {!savedChartConfigs.find(
              (c: string) => c === activeChartConfig
            ) && (
              <ActionList.Item
                className={tw("items-center")}
                selected
                onClick={() => {
                  const newMetadata = {
                    configs: [...savedChartConfigs, activeChartConfig],
                  };
                  onUpdateMetadata(newMetadata);
                }}
              >
                <div className={tw(`py-1`)}>
                  <span className={tw("font-bold")}>{xMetric}</span>
                  <span className={tw("mx-1")}>vs</span>
                  <span className={tw("font-bold")}>{yMetric}</span>
                  <ActionList.Description>{chartType}</ActionList.Description>
                </div>
                <ActionList.TrailingVisual>
                  <IconButton
                    icon={PlusIcon}
                    size="small"
                    className={tw(`ml-2`)}
                  >
                    Save
                  </IconButton>
                </ActionList.TrailingVisual>
              </ActionList.Item>
            )}
          </ActionList>
        </div>
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
  const [search, setSearch] = useState("");
  return (
    <div className={tw(`flex items-center`)}>
      <div className={tw(`font-mono text-sm text-gray-500 w-16`)}>{label}</div>
      <ActionMenu>
        <ActionMenu.Button>{value}</ActionMenu.Button>
        <ActionMenu.Overlay>
          {options.length ? (
            <ActionList sx={{ pb: 0 }}>
              <div className={tw(`p-2 pt-0`)}>
                <TextInput
                  leadingVisual={SearchIcon}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                  autoFocus
                  className={tw(`w-full`)}
                />
              </div>
              <div
                className={tw(
                  "relative max-h-[50vh] overflow-y-auto pb-2 z-10"
                )}
              >
                {options.map((option) => {
                  if (!option.toLowerCase().includes(search.toLowerCase()))
                    return null;
                  return (
                    <ActionList.Item
                      key={option}
                      onSelect={() => onChange(option)}
                    >
                      <ActionList.LeadingVisual>
                        {option === value ? <CheckIcon /> : null}
                      </ActionList.LeadingVisual>
                      {option}
                    </ActionList.Item>
                  );
                })}
              </div>
            </ActionList>
          ) : (
            <Text
              color="fg.muted"
              textAlign="center"
              fontStyle="italic"
              display="block"
              mx="auto"
              my="2"
            >
              No options
            </Text>
          )}
        </ActionMenu.Overlay>
      </ActionMenu>
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
