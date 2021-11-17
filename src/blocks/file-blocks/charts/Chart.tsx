import { Area, AreaChart, Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell, Label } from "recharts";

const styleName = "__style__"
export function Chart({ data, xMetric, yMetric, type }: {
  data: Record<string, any>[],
  xMetric: string,
  yMetric: string,
  type: "area" | "line" | "bar" | "scatter" | "pie"
}) {
  const sortedData = [...data].sort((a, b) => a[xMetric] - b[xMetric])
    .map(d => ({ ...d, style: null, [styleName]: d[styleName] || d["style"] }))
  const parsedXMetric = xMetric === "style" ? styleName : xMetric
  const parsedYMetric = yMetric === "style" ? styleName : yMetric

  const ChartComponent = {
    area: AreaChartInners,
    line: LineChartInners,
    bar: BarChartInners,
    scatter: ScatterChartInners,
    pie: PieChartInners
  }[type]
  if (!ChartComponent) return null;

  return (
    <div className="w-full h-full">
      <ChartComponent data={sortedData} xMetric={parsedXMetric} yMetric={parsedYMetric} />
    </div>
  )
}

type ChartProps = {
  data: Record<string, any>[],
  xMetric: string,
  yMetric: string,
}

const AreaChartInners = ({ data, xMetric, yMetric }: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={500}>
      <AreaChart data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey={xMetric}>
          <Label value={xMetric} position="bottom" />
        </XAxis>
        <YAxis dataKey={yMetric} />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Area type="monotone" dataKey={yMetric} stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
const LineChartInners = ({ data, xMetric, yMetric }: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={500}>
      <LineChart data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
        <XAxis dataKey={xMetric}>
          <Label value={xMetric} position="bottom" />
        </XAxis>
        <YAxis dataKey={yMetric} />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Line type="monotone" dataKey={yMetric} stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  )
}
const BarChartInners = ({ data, xMetric, yMetric }: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
        <XAxis dataKey={xMetric}>
          <Label value={xMetric} position="bottom" />
        </XAxis>
        <YAxis dataKey={yMetric} />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Bar dataKey={yMetric} fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}
const ScatterChartInners = ({ data, xMetric, yMetric }: ChartProps) => {
  return (
    <ScatterChart
      width={500} height={500}
      margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
      <XAxis dataKey={xMetric}>
        <Label value={xMetric} position="bottom" />
      </XAxis>
      <YAxis dataKey={yMetric} />
      <CartesianGrid strokeDasharray="3 3" />
      <Tooltip />
      <Scatter name="items" data={data} fill="#8884d8" />
    </ScatterChart>
  )
}

const COLORS = [
  "#7F3C8D", "#11A579", "#3969AC", "#F2B701", "#E73F74", "#80BA5A", "#E68310", "#008695", "#CF1C90", "#f97b72", "#4b4b8f", "#A5AA99"
]
const PieChartInners = ({ data, xMetric, yMetric }: ChartProps) => {
  const parsedData = data.map(d => ({
    ...d,
    value: +d[xMetric],
  }))
  return (
    <PieChart width={500} height={500}>
      <Pie
        data={parsedData}
        dataKey="value"
        nameKey={yMetric}
        fill="#8884d8"
        label={d => d[yMetric]}
        labelLine={false}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>

      <Tooltip />
    </PieChart>
  )
}
