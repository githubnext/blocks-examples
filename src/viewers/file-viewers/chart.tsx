import { useMemo } from "react";
import { csvParse } from "d3";
// need to explicitely import libraries
import "vega";
import "vega-lite";
import { Vega }from "react-vega";

const config = {
  "path": "data.csv",
  "padding": 5,
  "signals": [
    {
      "name": "binOffset",
      "value": 0,
      "bind": {
        "input": "range",
        "min": -0.1,
        "max": 0.1
      }
    },
    {
      "name": "binStep",
      "value": 10,
      "bind": {
        "input": "range",
        "min": 0,
        "max": 50,
        "step": 1
      }
    }
  ],
  "data": [
    {
      "name": "data"
    },
    {
      "name": "binned",
      "source": "data",
      "transform": [
        {
          "type": "bin",
          "field": "height",
          "extent": [
            0,
            100
          ],
          "anchor": {
            "signal": "binOffset"
          },
          "step": {
            "signal": "binStep"
          },
          "nice": false
        },
        {
          "type": "aggregate",
          "key": "bin0",
          "groupby": [
            "bin0",
            "bin1"
          ],
          "fields": [
            "bin0"
          ],
          "ops": [
            "count"
          ],
          "as": [
            "count"
          ]
        }
      ]
    }
  ],
  "scales": [
    {
      "name": "xscale",
      "type": "linear",
      "range": "width",
      "domain": [
        0,
        100
      ]
    },
    {
      "name": "yscale",
      "type": "linear",
      "range": "height",
      "round": true,
      "domain": {
        "data": "binned",
        "field": "count"
      },
      "zero": true,
      "nice": true
    }
  ],
  "axes": [
    {
      "orient": "bottom",
      "scale": "xscale",
      "label": "height",
      "zindex": 1
    },
    {
      "orient": "left",
      "scale": "yscale",
      "label": "count",
      "tickCount": 5,
      "zindex": 1
    }
  ],
  "marks": [
    {
      "type": "rect",
      "from": {
        "data": "binned"
      },
      "encode": {
        "update": {
          "x": {
            "scale": "xscale",
            "field": "bin0"
          },
          "x2": {
            "scale": "xscale",
            "field": "bin1",
            "offset": {
              "signal": "binStep > 0.02 ? -0.5 : 0"
            }
          },
          "y": {
            "scale": "yscale",
            "field": "count"
          },
          "y2": {
            "scale": "yscale",
            "value": 0
          },
          "fill": {
            "value": "green"
          }
        },
        "hover": {
          "fill": {
            "value": "firebrick"
          }
        }
      }
    },
    {
      "type": "rect",
      "from": {
        "data": "data"
      },
      "encode": {
        "enter": {
          "x": {
            "scale": "xscale",
            "field": "u"
          },
          "width": {
            "value": 1
          },
          "y": {
            "value": 25,
            "offset": {
              "signal": "height"
            }
          },
          "height": {
            "value": 5
          },
          "fill": {
            "value": "green"
          },
          "fillOpacity": {
            "value": 0.4
          }
        }
      }
    }
  ]
}

export function Viewer(props: FileViewerProps) {
    const { content } = props;

    const data = useMemo(() => ({ data: parseData(content) }), [content]);

    const parsedConfig = {
      width: 500,
      height: 500,
      // data: [{ name: "data" }],
      ...config
    };

    return (
      <div className="w-full h-full">
        <div className="flex w-full h-full">
          {/* <ConfigEditor config={config} setConfig={setConfig} metadata={metadata} onUpdateMetadata={onUpdateMetadata} /> */}
          <div className="flex-1 font-mono p-8 px-10">
            {/* @ts-ignore */}
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