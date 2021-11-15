import { useMemo, useRef, useState } from "react";
import {
  extent,
  forceCollide,
  forceSimulation,
  forceX,
  forceY,
  hierarchy,
  pack,
  range,
  scaleLinear,
  scaleSqrt,
} from "d3";
import countBy from "lodash/countBy";
import maxBy from "lodash/maxBy";
import entries from "lodash/entries";
import flatten from "lodash/flatten";
import { CircleText } from "./CircleText.jsx";
import defaultFileColors from "./language-colors.js"
import { useDebounce, useMeasure } from "react-use"

const fileColors = {
  ...defaultFileColors,
  ts: "#29CBBA",
  tsx: "#12B9B1",
  js: "#CE83F1",
  jsx: "#C56BF0",
  mjs: "#A57BE8",
  md: "#6473F2",
  mdx: "#3C40C6",
  json: "#FDA7DF",
  csv: "#D980FA",
  svg: "#FFC312",
  css: "#C3E438",
  svelte: "#B53471",
  scss: "#9980FA",
  html: "#C7ECEE",
  png: "#45aaf2",
  jpg: "#823471",
  jpeg: "#823471",
  go: "#E67E23",
  rb: "#eb4d4b",
  sh: "#badc58",
  m: "#FFD428",
  py: "#5758BB",
  mp4: "#788BA3",
  webm: "#4B6584",
  c: "#313952",
  pdf: "#313952",
  elm: "#D68589",
  h: "#79DF8E",
  dat: "#79DF8E",
  woff: "#CE83F1",
  woff2: "#CE83F1",
  otf: "#FEEAA7",
  jl: "#7C9A8A",
  ttf: "#60A2BC",
  cs: "#37B4F7",
  rc: "#37B4F7",
  f: "#E67E23",
  F: "#E67E23",
  f20: "#755A65",
  F90: "#4D41B1",
  for: "#755A65",
  erl: "#168194",
  H: "#168194",
  beam: "#9F5A0F",
  hrl: "#B53471",
  pf: "#B53471",
  app: "#C7ECEE",
  macro: "#C7ECEE",
  ex: "#255A4B",
  exs: "#EED582",
  ctl: "#EED582",
};
const looseFilesId = "__structure_loose_file__";
const defaultWidth = 600;
const defaultHeight = 600;
const maxChildren = 9000;
const numberOfCommitsAccessor = (d) => d?.commits?.length || 0;
export const Tree = (
  { data, filesChanged = [], participantLocations = [], maxDepth = 6, onClickFile = (file) => { } }
) => {
  const [ref, { width: containerWidth, height: containerHeight }] = useMeasure();
  const [width, setWidth] = useState(defaultWidth);
  const [height, setHeight] = useState(defaultHeight);

  // useDebounce(() => {
  //   setWidth(containerWidth);
  //   setHeight(containerHeight);
  // }, 500, [containerWidth, containerHeight]);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const cachedPositions = useRef({});
  const cachedOrders = useRef({});

  const getColor = (d) => {
    const isParent = d.children?.length;
    if (isParent) {
      const extensions = countBy(d.children, (c) => c.extension);
      const mainExtension = maxBy(entries(extensions), ([k, v]) => v)?.[0];
      return fileColors[mainExtension] || "#CED6E0";
    }
    return fileColors[d.extension] || "#CED6E0";
  };

  const packedData = useMemo(() => {
    if (!data) return [];
    if (!width || !height) return [];
    const hierarchicalData = hierarchy(
      processChild(data, getColor, cachedOrders.current),
    ).sum((d) => d.value)
      .sort((a, b) => {
        return (b.data.sortOrder - a.data.sortOrder) ||
          (b.data.name > a.data.name ? 1 : -1);
      });

    const treeDimensions = width > height ? [width, height * 1.3] : [width * 1.3, height];
    let packedTree = pack()
      .size(treeDimensions) // we want larger bubbles (.pack() sizes the bubbles to fit the space)
      .padding((d) => {
        if (d.depth <= 0) return 0;
        const hasChildWithNoChildren = d.children.filter((d) =>
          !d.children?.length
        ).length > 1;
        if (hasChildWithNoChildren) return 5;
        return 13;
      })(hierarchicalData);
    packedTree.children = reflowSiblings(
      packedTree.children,
      cachedPositions.current,
      maxDepth,
      undefined,
      undefined,
      width,
      height
    );
    const children = packedTree.descendants();

    cachedOrders.current = {};
    cachedPositions.current = {};
    const saveCachedPositionForItem = (item) => {
      cachedOrders.current[item.data.path] = item.data.sortOrder;
      if (item.children) {
        item.children.forEach(saveCachedPositionForItem);
      }
    };
    saveCachedPositionForItem(packedTree);
    children.forEach((d) => {
      cachedPositions.current[d.data.path] = [d.x, d.y];
    });

    return children.slice(0, maxChildren);
  }, [data, width, height]);

  const selectedNode = selectedNodeId &&
    packedData.find((d) => d.data.path === selectedNodeId);

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
    }} ref={ref} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      <svg
        width={width}
        height={height}
        style={{
          background: "white",
          fontFamily: "sans-serif",
          overflow: "visible",
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {packedData.map(({ x, y, r, depth, data, children, ...d }) => {
          if (depth <= 0) return null;
          if (depth > maxDepth) return null;
          const isOutOfDepth = depth >= maxDepth;
          const isParent = !!children;
          let runningR = r;
          // if (depth <= 1 && !children) runningR *= 3;
          if (data.path === looseFilesId) return null;
          const isHighlighted = isHovering && filesChanged.includes(data.path);
          const doHighlight = isHovering && !!filesChanged.length;

          return (
            <g
              key={data.path}
              style={{
                cursor: "pointer",
                fill: doHighlight
                  ? isHighlighted ? "#FCE68A" : "#ECEAEB"
                  : data.color,
                transition: `transform ${isHighlighted ? "0.3s" : "0s"
                  } ease-out, fill 0.1s ease-out`,
              }}
              transform={`translate(${x}, ${y})`}
              onMouseMove={() => {
                setSelectedNodeId(data.path);
              }}
              onMouseLeave={() => {
                setSelectedNodeId(null);
              }}
              onClick={() => {
                onClickFile(data.path);
              }}
            >
              {isParent
                ? (
                  <>
                    <circle
                      r={r}
                      style={{ transition: "all 0.3s ease-out" }}
                      stroke="#290819"
                      strokeOpacity="0.2"
                      strokeWidth="1"
                      fill="white"
                    />
                  </>
                )
                : (
                  <circle
                    style={{
                      filter: isHighlighted ? "url(#glow)" : undefined,
                      transition: "all 0.5s ease-out",
                    }}
                    r={runningR}
                    strokeWidth={selectedNodeId === data.path ? 3 : 0}
                    stroke="#374151"
                  />
                )}
            </g>
          );
        })}

        {packedData.map(({ x, y, r, depth, data, children }) => {
          if (depth <= 0) return null;
          if (depth > maxDepth) return null;
          const isParent = !!children && depth !== maxDepth;
          if (!isParent) return null;
          if (data.path === looseFilesId) return null;
          if (r < 16 && selectedNodeId !== data.path) return null;
          if (data.label.length > r * 0.5) return null;

          const label = truncateString(
            data.label,
            r < 30 ? Math.floor(r / 2.7) + 3 : 100,
          );

          let offsetR = r + 12 - depth * 4;
          const fontSize = 16 - depth;

          return (
            <g
              key={data.path}
              style={{ pointerEvents: "none", transition: "all 0.5s ease-out" }}
              transform={`translate(${x}, ${y})`}
            >
              <CircleText
                style={{ fontSize, transition: "all 0.5s ease-out" }}
                r={Math.max(20, offsetR - 3)}
                fill="#374151"
                stroke="white"
                strokeWidth="6"
                rotate={depth * 1 - 0}
                text={label}
              />
              <CircleText
                style={{ fontSize, transition: "all 0.5s ease-out" }}
                fill="#374151"
                rotate={depth * 1 - 0}
                r={Math.max(20, offsetR - 3)}
                text={label}
              />
            </g>
          );
        })}

        {!!selectedNode &&
          (!selectedNode.children || selectedNode.depth === maxDepth) && (
            <g transform={`translate(${selectedNode.x}, ${selectedNode.y})`}>
              <text
                style={{
                  pointerEvents: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.5s ease-out",
                }}
                stroke="white"
                strokeWidth="3"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {selectedNode.data.label}
              </text>
              <text
                style={{
                  pointerEvents: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.5s ease-out",
                }}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {selectedNode.data.label}
              </text>
            </g>
          )}

        {packedData.map(({ x, y, r, depth, data, children }) => {
          if (depth <= 0) return null;
          if (depth > maxDepth) return null;
          const isParent = !!children;
          // if (depth <= 1 && !children) runningR *= 3;
          if (data.path === looseFilesId) return null;
          const isHighlighted =
            isHovering && filesChanged.includes(data.path);
          const doHighlight = isHovering && !!filesChanged.length;
          if (isParent && !isHighlighted) return null;
          if (selectedNodeId === data.path && !isHighlighted) return null;
          if (selectedNodeId && selectedNodeId === data.path) return null;
          if ((!selectedNodeId || selectedNodeId !== data.path) && r < 22) {
            return null;
          }

          const label = truncateString(data.label, Math.floor(r / 4) + 3);

          return (
            <g
              key={data.path}
              style={{
                fill: doHighlight
                  ? isHighlighted ? "#FCE68A" : "#29081916"
                  : data.color,
                transition: `transform ${isHighlighted ? "0.5s" : "0s"} ease-out`,
                // opacity: doHighlight && !isHighlighted ? 0.6 : 1,
              }}
              transform={`translate(${x}, ${y})`}
            >
              <text
                style={{
                  pointerEvents: "none",
                  opacity: 0.9,
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.5s ease-out",
                }}
                fill="#4B5563"
                textAnchor="middle"
                dominantBaseline="middle"
                stroke="white"
                strokeWidth="3"
                strokeLinejoin="round"
              >
                {label}
              </text>
              <text
                style={{
                  pointerEvents: "none",
                  opacity: 1,
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.5s ease-out",
                }}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {label}
              </text>
              <text
                style={{
                  pointerEvents: "none",
                  opacity: 0.9,
                  fontSize: "14px",
                  fontWeight: 500,
                  mixBlendMode: "color-burn",
                  transition: "all 0.5s ease-out",
                }}
                fill="#110101"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const processChild = (
  child,
  getColor,
  cachedOrders,
  i = 0,
) => {
  if (!child) return;
  const isRoot = !child.path;
  let name = child.name;
  let path = child.path;
  let children = child?.children?.map((c, i) =>
    processChild(c, getColor, cachedOrders, i)
  );
  if (children?.length === 1) {
    name = `${name}/${children[0].name}`;
    path = children[0].path;
    children = children[0].children;
  }
  const pathWithoutExtension = path?.split(".").slice(0, -1).join(".");
  const extension = name?.split(".").slice(-1)[0];
  const hasExtension = !!fileColors[extension];

  if (isRoot && children) {
    const looseChildren = children?.filter((d) => !d.children?.length);
    children = [
      ...children?.filter((d) => d.children?.length),
      {
        name: looseFilesId,
        path: looseFilesId,
        size: 0,
        children: looseChildren,
      },
    ];
  }

  let extendedChild = {
    ...child,
    name,
    path,
    label: name,
    extension,
    pathWithoutExtension,

    size:
      (["woff", "woff2", "ttf", "otf", "png", "jpg", "svg"].includes(extension)
        ? 100
        : Math.min(
          15000,
          hasExtension ? child.size : Math.min(child.size, 9000),
        )) + i, // stupid hack to stabilize circle order/position
    value:
      (["woff", "woff2", "ttf", "otf", "png", "jpg", "svg"].includes(extension)
        ? 100
        : Math.min(
          15000,
          hasExtension ? child.size : Math.min(child.size, 9000),
        )) + i, // stupid hack to stabilize circle order/position
    color: "#fff",
    children,
  };
  extendedChild.color = getColor(extendedChild);
  extendedChild.sortOrder = getSortOrder(extendedChild, cachedOrders, i);

  return extendedChild;
};

const reflowSiblings = (
  siblings,
  cachedPositions = {},
  maxDepth,
  parentRadius,
  parentPosition,
  width,
  height,
) => {
  if (!siblings) return;
  let items = [...siblings.map((d) => {
    return {
      ...d,
      x: cachedPositions[d.data.path]?.[0] || d.x,
      y: cachedPositions[d.data.path]?.[1] || d.y,
      originalX: d.x,
      originalY: d.y,
    };
  })];
  const paddingScale = scaleSqrt().domain([maxDepth, 1]).range([3, 8]).clamp(
    true,
  );
  const isLandscape = width > height;
  let simulation = forceSimulation(items)
    .force(
      "centerX",
      forceX(width / 2).strength(items[0].depth <= 2 ? 0.01 : 0),
    )
    .force(
      "centerY",
      forceY(height / 2).strength(items[0].depth <= 2 ? 0.01 : 0),
    )
    .force(
      "centerX2",
      forceX(parentPosition?.[0]).strength(parentPosition ? isLandscape ? 0.3 : 0.8 : 0),
    )
    .force(
      "centerY2",
      forceY(parentPosition?.[1]).strength(parentPosition ? isLandscape ? 0.3 : 0.3 : 0),
    )
    .force(
      "x",
      forceX((d) => cachedPositions[d.data.path]?.[0] || width / 2).strength(
        (d) =>
          cachedPositions[d.data.path]?.[1] ? 0.5 : ((width / height) * 0.3),
      ),
    )
    .force(
      "y",
      forceY((d) => cachedPositions[d.data.path]?.[1] || height / 2).strength(
        (d) =>
          cachedPositions[d.data.path]?.[0] ? 0.5 : ((height / width) * 0.3),
      ),
    )
    .force(
      "collide",
      forceCollide((d) => d.children ? d.r + paddingScale(d.depth) : d.r + 1.6)
        .iterations(8).strength(1),
    )
    .stop();

  for (let i = 0; i < 280; i++) {
    simulation.tick();
    items.forEach((d) => {
      d.x = keepBetween(d.r, d.x, width - d.r);
      d.y = keepBetween(d.r, d.y, height - d.r);

      if (parentPosition && parentRadius) {
        // keep within radius
        const containedPosition = keepCircleInsideCircle(
          parentRadius,
          parentPosition,
          d.r,
          [d.x, d.y],
          !!d.children?.length,
        );
        d.x = containedPosition[0];
        d.y = containedPosition[1];
      }
    });
  }
  // setTimeout(() => simulation.stop(), 100);
  const repositionChildren = (d, xDiff, yDiff) => {
    let newD = { ...d };
    newD.x += xDiff;
    newD.y += yDiff;
    if (newD.children) {
      newD.children = newD.children.map((c) =>
        repositionChildren(c, xDiff, yDiff)
      );
    }
    return newD;
  };
  for (const item of items) {
    const itemCachedPosition = cachedPositions[item.data.path] ||
      [item.x, item.y];
    const itemPositionDiffFromCached = [
      item.x - itemCachedPosition[0],
      item.y - itemCachedPosition[1],
    ];

    if (item.children) {
      let repositionedCachedPositions = { ...cachedPositions };
      const itemReflowDiff = [
        item.x - item.originalX,
        item.y - item.originalY,
      ];

      item.children = item.children.map((child) =>
        repositionChildren(
          child,
          itemReflowDiff[0],
          itemReflowDiff[1],
        )
      );
      if (item.children.length > 4) {
        if (item.depth > maxDepth) return;
        item.children.forEach((child) => {
          // move cached positions with the parent
          const childCachedPosition =
            repositionedCachedPositions[child.data.path];
          if (childCachedPosition) {
            repositionedCachedPositions[child.data.path] = [
              childCachedPosition[0] + itemPositionDiffFromCached[0],
              childCachedPosition[1] + itemPositionDiffFromCached[1],
            ];
          } else {
            // const diff = getPositionFromAngleAndDistance(100, item.r);
            repositionedCachedPositions[child.data.path] = [
              child.x,
              child.y,
            ];
          }
        });
        item.children = reflowSiblings(
          item.children,
          repositionedCachedPositions,
          maxDepth,
          item.r,
          [item.x, item.y],
          width,
          height
        );
      }
    }
  }
  return items;
};

const getSortOrder = (item, cachedOrders, i = 0) => {
  if (cachedOrders[item.path]) return cachedOrders[item.path];
  if (cachedOrders[item.path?.split("/")?.slice(0, -1)?.join("/")]) {
    return -100000000;
  }
  if (item.name === "public") return -1000000;
  return item.value + -i;
};

const transformIn = {
  visible: { transform: "scale(1)", transition: { duration: 0.2 } },
  hidden: { transform: "scale(0)", transition: { duration: 0.2 } },
};

const truncateString = (string = '', length = 20) => {
  return string.length > length + 3
    ? string.substring(0, length) + '...'
    : string;
};

const keepBetween = (min, max, value) => {
  return Math.max(min, Math.min(max, value));
};

const getPositionFromAngleAndDistance = (angle, distance) => {
  const radians = (angle / 180) * Math.PI;
  return [Math.cos(radians) * distance, Math.sin(radians) * distance];
};

const getAngleFromPosition = (x, y) => {
  return (Math.atan2(y, x) * 180) / Math.PI;
};
const keepCircleInsideCircle = (
  parentR,
  parentPosition,
  childR,
  childPosition,
  isParent
) => {
  const distance = Math.sqrt(
    Math.pow(parentPosition[0] - childPosition[0], 2) +
    Math.pow(parentPosition[1] - childPosition[1], 2)
  );
  const angle = getAngleFromPosition(
    childPosition[0] - parentPosition[0],
    childPosition[1] - parentPosition[1]
  );
  // leave space for labels
  const padding = Math.min(
    angle < -20 && angle > -100 && isParent ? 13 : 3,
    parentR * 0.2
  );
  if (distance > parentR - childR - padding) {
    const diff = getPositionFromAngleAndDistance(
      angle,
      parentR - childR - padding
    );
    return [parentPosition[0] + diff[0], parentPosition[1] + diff[1]];
  }
  return childPosition;
};
