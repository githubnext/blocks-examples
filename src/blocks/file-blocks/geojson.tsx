import { FileBlockProps } from "@githubnext/utils";
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RLayerVector, RMap, ROSM, RStyle } from "rlayers";
import { Feature } from "ol";
import GeoJSON from "ol/format/GeoJSON";
import { Geometry } from "ol/geom";
import "ol/ol.css";

export default function (props: FileBlockProps) {
  const { content, onRequestUpdateContent } = props;

  const [hoveredFeatureId, setHoveredFeatureId] =
    useState<Feature<Geometry> | null>(null);
  const [isHoveredFeatureLocked, setIsHoveredFeatureLocked] = useState(false);
  const [lastExtent, setLastExtent] = useState<
    [number, number, number, number] | null
  >([0, 0, 0, 0]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    if (!content) return;
    // the map won't render if we try to load it right away
    setTimeout(() => {
      setIsMounted(true);
    });
  }, [content]);

  const geojson = useMemo(() => {
    try {
      let geojsonObject = JSON.parse(content);
      if (!geojsonObject.features) {
        geojsonObject = {
          type: "FeatureCollection",
          features: [geojsonObject],
        };
      }
      geojsonObject = {
        ...geojsonObject,
        features: geojsonObject.features.map((d, i) => ({
          ...d,
          properties: { ...d.properties, __geojson_internal_index__: i },
        })),
      };
      return geojsonObject;
    } catch (e) {
      return {};
    }
  }, [content]);

  const features = useMemo(() => parseGeoJSON(geojson), [geojson]);

  const hoveredFeature = features.find(
    (f) => f.values_.__geojson_internal_index__ === hoveredFeatureId
  );

  return (
    <div className="relative w-full h-full overflow-auto">
      {isMounted && (
        <RMap
          className="w-full h-full min-h-[10em] min-w-[10em]"
          initial={{
            center: [0, 0],
            zoom: 1,
          }}
          onClick={(event) => {
            setIsHoveredFeatureLocked(false);
            if (
              hoveredFeatureId ===
              event.target.values_.__geojson_internal_index__
            ) {
              setHoveredFeatureId(null);
            } else {
              setHoveredFeatureId(
                event.target.values_.__geojson_internal_index__
              );
            }
          }}
        >
          {/* tileset */}
          <ROSM />

          {/* geojson shapes */}
          <RLayerVector
            zIndex={10}
            features={features}
            onPostRender={(event) => {
              // only do this once
              try {
                const extent = event.target.values_.source.getExtent();
                if (lastExtent.join(",") === extent.join(",")) return;
                setLastExtent(extent);
                // zoom out a bit
                const zoomedOutExtent = [
                  extent[0] - (extent[2] - extent[0]) * 0.1,
                  extent[1] - (extent[3] - extent[1]) * 0.1,
                  extent[2] + (extent[2] - extent[0]) * 0.1,
                  extent[3] + (extent[3] - extent[1]) * 0.1,
                ];
                const map = event.target.values_.map;
                const view = map?.getView();
                if (!view) return;
                view.fit(zoomedOutExtent, {
                  duration: 350,
                  maxZoom: 15,
                });
              } catch (e) {
                console.log(e);
              }
            }}
            onPointerMove={(e) => {
              if (isHoveredFeatureLocked) return;
              if (
                hoveredFeatureId === e.target.values_.__geojson_internal_index__
              )
                return;
              setHoveredFeatureId(e.target.values_.__geojson_internal_index__);
            }}
            onPointerLeave={(e) => {
              if (isHoveredFeatureLocked) return;
              hoveredFeatureId ===
                e.target.values_.__geojson_internal_index__ &&
                setHoveredFeatureId(null);
            }}
            onClick={(event) => {
              event.stopPropagation();
              const id = event.target.values_.__geojson_internal_index__;
              if (hoveredFeatureId === id && isHoveredFeatureLocked) {
                setIsHoveredFeatureLocked(false);
                setHoveredFeatureId(null);
              } else {
                setIsHoveredFeatureLocked(true);
                setHoveredFeatureId(id);
              }
            }}
          >
            <RStyle.RStyle
              render={(f) => {
                const isHovered =
                  hoveredFeatureId === f.values_.__geojson_internal_index__;
                return (
                  <>
                    <RStyle.RFill
                      color={
                        isHovered
                          ? isHoveredFeatureLocked
                            ? "#6366f1aa"
                            : "#6366f177"
                          : "#6366f133"
                      }
                    />
                    <RStyle.RStroke color="#6366f1" width={2} />
                  </>
                );
              }}
            />
          </RLayerVector>
        </RMap>
      )}

      {hoveredFeature && (
        <div className="absolute top-2 left-2 max-h-[85%] shadow-xl overflow-auto p-4 bg-white border border-gray-200">
          <div className="grid grid-cols-[6em,1fr]">
            {hoveredFeature.values_ &&
              Object.keys(hoveredFeature.values_).map(
                (key: string, i: number) => {
                  if (key === "geometry") return null;
                  if (key === "__geojson_internal_index__") return null;
                  const currentValue = hoveredFeature.values_[key];
                  return (
                    <Fragment key={i}>
                      <div
                        className="flex-none text-xs text-gray-600 max-w-[15em] truncate mr-1 min-w-[5em]"
                        title={key}
                      >
                        {key}
                      </div>
                      <div
                        className="flex-1 text-xs text-gray-900 font-mono max-w-[20em] truncate min-w-[10em]"
                        title={currentValue}
                      >
                        {typeof currentValue === "string" ? (
                          <EditableText
                            value={currentValue}
                            onChange={(value) => {
                              if (value === currentValue) return;
                              const index = geojson.features.findIndex(
                                (d) =>
                                  d.properties.__geojson_internal_index__ ===
                                  hoveredFeatureId
                              );
                              if (index === -1) return;

                              let newGeojson = JSON.parse(content);
                              const isCollection =
                                newGeojson.type === "FeatureCollection";
                              if (isCollection) {
                                newGeojson.features[index].properties[key] =
                                  value;
                                newGeojson.features = newGeojson.features.map(
                                  (d = {}, i) => {
                                    if (!d) return;
                                    const {
                                      __geojson_internal_index__,
                                      ...properties
                                    } = d.properties || {};
                                    return { ...d, properties };
                                  }
                                );
                              } else {
                                const {
                                  __geojson_internal_index__,
                                  ...properties
                                } = newGeojson.properties || {};
                                newGeojson.properties = {
                                  ...properties,
                                  [key]: value,
                                };
                              }
                              onRequestUpdateContent(
                                JSON.stringify(newGeojson)
                              );
                            }}
                          />
                        ) : (
                          <div className="py-1 px-2">
                            {JSON.stringify(hoveredFeature.values_[key])}
                          </div>
                        )}
                      </div>
                    </Fragment>
                  );
                }
              )}
          </div>
        </div>
      )}
    </div>
  );
}

const parseGeoJSON = (geojson: any) => {
  try {
    return new GeoJSON({
      featureProjection: "EPSG:3857",
    }).readFeatures(geojson);
  } catch (e) {
    console.log(e);
    return [];
  }
};

const EditableText = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  const inputElement = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isEditing) {
      inputElement.current?.select();
    }
  }, [isEditing]);

  return (
    <div className="">
      {isEditing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onChange(inputValue);
            setIsEditing(false);
          }}
        >
          <input
            autoFocus
            ref={inputElement}
            className="w-full py-1 px-2"
            type="text"
            value={inputValue}
            onChange={onChangeInput}
            onBlur={() => {
              onChange(inputValue);
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Esc") {
                setIsEditing(false);
              }
            }}
          />
        </form>
      )}
      {!isEditing && (
        <button
          className="py-1 px-2 hover:bg-gray-100"
          onClick={() => {
            setIsEditing(true);
            setInputValue(value);
          }}
        >
          {value}
        </button>
      )}
    </div>
  );
};
