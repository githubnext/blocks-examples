import { tw } from "twind";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts";

const styleName = "__style__";
const dateTimeMetrics = ["date", "time", "datetime"];
export function Chart({
  data,
  xMetric,
  yMetric,
  type,
}: {
  data: Record<string, any>[];
  xMetric: string;
  yMetric: string;
  type: "area" | "line" | "bar" | "scatter" | "pie";
}) {
  let dateMetrics = new Set();
  const sortedData = [...data]
    .sort((a, b) => a[xMetric] - b[xMetric])
    .map((d) => ({
      ...d,
      [xMetric]: Number.isFinite(+d[xMetric]) ? +d[xMetric] : d[xMetric],
      [yMetric]: Number.isFinite(+d[yMetric]) ? +d[yMetric] : d[yMetric],
      style: null,
      [styleName]: d[styleName] || d["style"],
      ...dateTimeMetrics.reduce((acc, m) => {
        if (d[m]) {
          let date = new Date(d[m]);
          if (date.toString() === "Invalid Date") date = new Date(+d[m]);
          if (date.toString() !== "Invalid Date") {
            acc[m] = +date;
            dateMetrics.add(m);
          }
        }
        return acc;
      }, {} as Record<string, Date>),
    }));
  const parseMetric = (metric: string) => {
    if (metric === "style") return styleName;
    return metric;
  };
  const parsedXMetric = parseMetric(xMetric);
  const parsedYMetric = parseMetric(yMetric);

  const ChartComponent = {
    area: AreaChartInners,
    line: LineChartInners,
    bar: BarChartInners,
    scatter: ScatterChartInners,
    pie: PieChartInners,
  }[type];
  if (!ChartComponent) return null;

  const formatXTick = tickFormatter(dateMetrics.has(parsedXMetric));
  const formatYTick = tickFormatter(dateMetrics.has(parsedYMetric));

  return (
    <div className={tw(`w-full flex justify-center h-full`)}>
      <ChartComponent
        data={sortedData}
        xMetric={parsedXMetric}
        yMetric={parsedYMetric}
        formatXTick={formatXTick}
        formatYTick={formatYTick}
      />
    </div>
  );
}

type ChartProps = {
  data: Record<string, any>[];
  xMetric: string;
  yMetric: string;
  formatXTick: (value: any) => string;
  formatYTick: (value: any) => string;
};

const AreaChartInners = ({
  data,
  xMetric,
  yMetric,
  formatXTick,
  formatYTick,
}: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={500} className={tw("font-mono")}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
      >
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#939AFF" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#939AFF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" vertical={false} />
        <XAxis
          dataKey={xMetric}
          tickLine={false}
          tickCount={Math.floor(500 / 100)}
          type="number"
          domain={["min", "max"]}
          tickFormatter={formatXTick}
        >
          <Label
            value={xMetric}
            position="bottom"
            className={tw("font-mono")}
          />
        </XAxis>
        <YAxis
          dataKey={yMetric}
          tickLine={false}
          tickCount={Math.floor(500 / 100)}
          type="number"
          domain={["auto", "auto"]}
          tickFormatter={formatYTick}
        >
          <Label
            value={yMetric}
            position="insideTopLeft"
            offset={20}
            content={
              <>
                <text
                  x={66}
                  y={0}
                  dy={17}
                  className={tw("font-mono")}
                  textAnchor="start"
                  stroke="#fff"
                  stroke-width={5}
                >
                  {yMetric}
                </text>
                <text
                  x={66}
                  y={0}
                  dy={17}
                  className={tw("font-mono")}
                  textAnchor="start"
                  fill="#000"
                >
                  {yMetric}
                </text>
              </>
            }
          />
        </YAxis>
        <Tooltip
          content={
            <TooltipContent
              {...{ data, xMetric, yMetric, formatXTick, formatYTick }}
            />
          }
        />
        <Area
          type="monotone"
          dataKey={yMetric}
          stroke="#939AFF"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorUv)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
const LineChartInners = ({
  data,
  xMetric,
  yMetric,
  formatXTick,
  formatYTick,
}: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={500}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 6" />
        <XAxis
          dataKey={xMetric}
          tickLine={false}
          tickCount={Math.floor(500 / 100)}
          type="number"
          domain={["min", "max"]}
          tickFormatter={formatXTick}
        >
          <Label
            value={xMetric}
            position="bottom"
            className={tw("font-mono")}
          />
        </XAxis>
        <YAxis
          dataKey={yMetric}
          tickLine={false}
          tickCount={Math.floor(500 / 100)}
          type="number"
          domain={["auto", "auto"]}
          tickFormatter={formatYTick}
        >
          <Label
            value={yMetric}
            position="insideTopLeft"
            offset={20}
            content={
              <>
                <text
                  x={66}
                  y={0}
                  dy={17}
                  className={tw("font-mono")}
                  textAnchor="start"
                  stroke="#fff"
                  stroke-width={5}
                >
                  {yMetric}
                </text>
                <text
                  x={66}
                  y={0}
                  dy={17}
                  className={tw("font-mono")}
                  textAnchor="start"
                  fill="#000"
                >
                  {yMetric}
                </text>
              </>
            }
          />
        </YAxis>
        <Tooltip
          content={
            <TooltipContent
              {...{ data, xMetric, yMetric, formatXTick, formatYTick }}
            />
          }
        />
        <Line type="monotone" dataKey={yMetric} stroke="#939AFF" />
      </LineChart>
    </ResponsiveContainer>
  );
};
const BarChartInners = ({
  data,
  xMetric,
  yMetric,
  formatXTick,
  formatYTick,
}: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 6" />
        <XAxis
          dataKey={xMetric}
          tickLine={false}
          tickCount={Math.floor(500 / 100)}
          type="number"
          domain={["min", "max"]}
          tickFormatter={formatXTick}
        >
          <Label
            value={xMetric}
            position="bottom"
            className={tw("font-mono")}
          />
        </XAxis>
        <YAxis
          dataKey={yMetric}
          tickLine={false}
          tickCount={Math.floor(500 / 100)}
          type="number"
          domain={["auto", "auto"]}
          tickFormatter={formatYTick}
        >
          <Label
            value={yMetric}
            position="insideTopLeft"
            offset={20}
            content={
              <>
                <text
                  x={66}
                  y={0}
                  dy={17}
                  className={tw("font-mono")}
                  textAnchor="start"
                  stroke="#fff"
                  stroke-width={5}
                >
                  {yMetric}
                </text>
                <text
                  x={66}
                  y={0}
                  dy={17}
                  className={tw("font-mono")}
                  textAnchor="start"
                  fill="#000"
                >
                  {yMetric}
                </text>
              </>
            }
          />
        </YAxis>
        <Tooltip
          content={
            <TooltipContent
              {...{ data, xMetric, yMetric, formatXTick, formatYTick }}
            />
          }
        />
        <Bar dataKey={yMetric} fill="#939AFF" />
      </BarChart>
    </ResponsiveContainer>
  );
};
const ScatterChartInners = ({
  data,
  xMetric,
  yMetric,
  formatXTick,
  formatYTick,
}: ChartProps) => {
  return (
    <ScatterChart
      width={500}
      height={500}
      margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
    >
      <CartesianGrid strokeDasharray="3 6" />
      <XAxis
        dataKey={xMetric}
        tickLine={false}
        tickCount={Math.floor(500 / 150)}
        type="number"
        domain={["auto", "auto"]}
        tickFormatter={formatXTick}
      >
        <Label value={xMetric} position="bottom" className={tw("font-mono")} />
      </XAxis>
      <YAxis
        dataKey={yMetric}
        tickLine={false}
        tickCount={Math.floor(500 / 100)}
        type="number"
        domain={["auto", "auto"]}
        tickFormatter={formatYTick}
      >
        <Label
          value={yMetric}
          position="insideTopLeft"
          offset={20}
          content={
            <>
              <text
                x={66}
                y={0}
                dy={17}
                className={tw("font-mono")}
                textAnchor="start"
                stroke="#fff"
                stroke-width={5}
              >
                {yMetric}
              </text>
              <text
                x={66}
                y={0}
                dy={17}
                className={tw("font-mono")}
                textAnchor="start"
                fill="#000"
              >
                {yMetric}
              </text>
            </>
          }
        />
      </YAxis>
      <Tooltip
        content={
          <TooltipContent
            {...{ data, xMetric, yMetric, formatXTick, formatYTick }}
          />
        }
      />
      <Scatter
        name="items"
        data={data}
        fill="#939AFF"
        shape={<ScatterPoint {...{ xMetric, yMetric }} />}
      />
    </ScatterChart>
  );
};

const ScatterPoint = ({ xMetric, yMetric, cx, cy, payload }: any) => {
  const { x, y } = payload;
  return (
    <g transform={`translate(${cx},${cy})`}>
      <circle r={5} fill="#939AFFcc" />
    </g>
  );
};

const COLORS = [
  "#7F3C8D",
  "#11A579",
  "#3969AC",
  "#F2B701",
  "#E73F74",
  "#80BA5A",
  "#E68310",
  "#008695",
  "#CF1C90",
  "#f97b72",
  "#4b4b8f",
  "#A5AA99",
];
const PieChartInners = ({
  data,
  xMetric,
  yMetric,
  formatXTick,
  formatYTick,
}: ChartProps) => {
  const parsedData = data.map((d) => ({
    ...d,
    value: +d[xMetric],
  }));
  return (
    <PieChart width={500} height={500}>
      <Pie
        data={parsedData}
        dataKey="value"
        nameKey={yMetric}
        fill="#939AFF"
        label={(d) => d[yMetric]}
        labelLine={false}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>

      <Tooltip
        content={
          <TooltipContent
            {...{ data, xMetric, yMetric, formatXTick, formatYTick }}
          />
        }
      />
    </PieChart>
  );
};

const TooltipContent = ({
  xMetric,
  yMetric,
  formatXTick,
  formatYTick,
  payload,
}: { payload: any } & ChartProps) => {
  const d = payload?.[0]?.payload;
  if (!d) return null;
  return (
    <div className={tw("bg-white py-2 px-3 shadow-lg")}>
      <p>
        <strong>{xMetric}</strong>:{" "}
        <span className={tw("font-mono")}>{formatXTick(d[xMetric])}</span>
      </p>
      <p>
        <strong>{yMetric}</strong>:{" "}
        <span className={tw("font-mono")}>{formatYTick(d[yMetric])}</span>
      </p>
    </div>
  );
};

const tickFormatter = (isDate: boolean) => (tick: any) => {
  if (isDate) return new Date(tick).toLocaleDateString?.() || tick;
  return typeof tick === "number" ? tick.toLocaleString() : tick;
};
