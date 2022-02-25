// @ts-ignore
import { FileBlockProps } from "@githubnext/utils";
import { Fragment, useState } from "react";
// @ts-ignore
import Annotation from "react-image-annotation";
import {
  OvalSelector,
  PointSelector,
  RectangleSelector,
  // @ts-ignore
} from "react-image-annotation/lib/selectors";
// @ts-ignore
import { CodeSandbox } from "./CodeSandbox.tsx";

export default function ({
  content,
  context,
  metadata,
  onUpdateMetadata,
}: FileBlockProps) {
  const { path } = context;

  const componentName = path.split("/").pop()?.split(".")[0];
  const [componentDefinition, setComponentDefinition] = useState(
    `<${componentName}>\n</${componentName}>`
  );
  const [annotations, setAnnotations] = useState([]);

  const wrappedContents =
    typeof document === "undefined"
      ? ""
      : `
import ReactDOM from "react-dom";

  ${content}

// render element

ReactDOM.render(
  ${componentDefinition || `<${componentName} />`},
  document.getElementById('root')
)
`;

  return (
    <div className="relative w-full flex h-full">
      <div className="flex flex-col flex-1 h-full max-w-[80em]">
        <Annotator
          annotations={annotations}
          // @ts-ignore
          setAnnotations={setAnnotations}
        >
          <CodeSandbox language="js" dependencies={["react", "react-dom"]}>
            {wrappedContents}
          </CodeSandbox>
        </Annotator>
      </div>
      <AnnotationSetList
        saved={metadata.saved || []}
        onUpdateMetadata={onUpdateMetadata}
        annotations={annotations}
        // @ts-ignore
        setAnnotations={setAnnotations}
        componentDefinition={componentDefinition}
        setComponentDefinition={setComponentDefinition}
      />
    </div>
  );
}

const annotationTypes = [
  {
    id: RectangleSelector.TYPE,
    name: "Rectangle",
  },
  {
    id: PointSelector.TYPE,
    name: "Point",
  },
  {
    id: OvalSelector.TYPE,
    name: "Oval",
  },
];

type AnnotationType = {
  geometry: string;
  data: {
    id: number;
  };
};
type AnnotationSet = {
  annotations: AnnotationType[];
  title: string;
  componentDefinition: string;
};

const Annotator = ({
  annotations,
  setAnnotations,
  children,
}: {
  annotations: AnnotationType[];
  setAnnotations: (annotations: AnnotationType[]) => void;
  children: any;
}) => {
  const [annotation, setAnnotation] = useState({});
  const [annotationType, setAnnotationType] = useState(annotationTypes[0].id);

  const onAddAnnotation = (annotation: AnnotationType) => {
    const { geometry, data } = annotation;
    setAnnotation({});
    const newAnnotations = [
      ...annotations,
      {
        geometry,
        data: {
          ...data,
          id: Math.random(),
        },
      },
    ];
    setAnnotations(newAnnotations);
  };

  return (
    <div className="flex w-full h-full">
      <div className="flex-1 w-full h-full p-5 pt-0 z-10">
        <div className="flex w-full items-center pb-1">
          <label htmlFor="name">Annotation type</label>

          <div className="radio-group ml-2">
            {annotationTypes.map(({ id, name }) => (
              <Fragment key={id}>
                <input
                  className="radio-input"
                  id={id}
                  type="radio"
                  name="annotations"
                  checked={annotationType === id}
                  onChange={() => setAnnotationType(id)}
                />
                <label className="radio-label" htmlFor={id}>
                  {name}
                </label>
              </Fragment>
            ))}
          </div>
        </div>
        <div className="h-full">
          <Annotation
            annotations={annotations}
            type={annotationType}
            value={annotation}
            onChange={setAnnotation}
            onSubmit={onAddAnnotation}
          >
            <div className="relative w-full h-full z-[-1]">{children}</div>
          </Annotation>
        </div>
      </div>
    </div>
  );
};

const AnnotationSetList = ({
  saved,
  onUpdateMetadata,
  annotations,
  setAnnotations,
  componentDefinition,
  setComponentDefinition,
}: {
  saved: AnnotationSet[];
  onUpdateMetadata: (metadata: any) => void;
  annotations: AnnotationType[];
  setAnnotations: (annotations: AnnotationType[]) => void;
  componentDefinition: string;
  setComponentDefinition: (componentDefinition: string) => void;
}) => {
  const [title, setTitle] = useState("");

  const canSubmitForm = annotations.length && title.length;
  const selectedAnnotationSetString = annotationSetToString({
    title,
    componentDefinition,
    annotations,
  });
  const selectedAnnotationSetIndex = saved.findIndex(
    (set) => annotationSetToString(set) === selectedAnnotationSetString
  );

  return (
    <div className="w-80 h-full flex flex-col divide-y divide-gray-200">
      <form
        className="px-5 pt-5 pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmitForm) return;
          const newMetadata = {
            saved: [
              ...saved,
              {
                title,
                componentDefinition,
                annotations,
              },
            ],
          };
          onUpdateMetadata(newMetadata);
        }}
      >
        <label className="mt-8 pb-4">Annotation set title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-control w-full mb-2"
        />
        <label className="">Component definition</label>
        <p className="note">You can specify the props and children</p>
        <textarea
          className="w-full mb-3 form-control"
          value={componentDefinition}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) return;
            setComponentDefinition(value);
          }}
        />
        <button
          className={`btn btn-primary w-full`}
          aria-disabled={!canSubmitForm ? "true" : undefined}
          type="submit"
        >
          Save new annotation set
        </button>
      </form>
      <div className="flex-1 px-5 py-3 flex flex-col h-full w-full mt-3">
        <div className="font-semibold">Saved annotation sets</div>
        <ul
          className="ActionList pl-0"
          role="listbox"
          aria-label="Select an option"
        >
          {saved.map((annotationSet, index) => {
            const isSelected = selectedAnnotationSetIndex === index;
            return (
              <li
                key={index}
                className="ActionList-item"
                role="option"
                aria-selected={isSelected ? "true" : "false"}
              >
                <button
                  className="group w-full ActionList-content"
                  onClick={() => {
                    setAnnotations(annotationSet.annotations);
                    setComponentDefinition(annotationSet.componentDefinition);
                    setTitle(annotationSet.title);
                  }}
                >
                  <span className="ActionList-item-action ActionList-item-action--leading">
                    <svg
                      viewBox="0 0 16 16"
                      width="16"
                      height="16"
                      className="ActionList-item-singleSelectCheckmark"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
                      ></path>
                    </svg>
                  </span>
                  <span className="ActionList-item-label flex-1 flex flex-col justify-start items-start">
                    {annotationSet.title}
                    <span className="note">
                      {annotationSet.annotations.length} annotation
                      {annotationSet.annotations.length > 1 ? "s" : ""}
                    </span>
                  </span>

                  <button
                    className="absolute top-1/2 right-2 h-10 w-10 transform -translate-y-1/2 cursor-pointer flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newSaved = saved.filter((_, i) => i !== index);
                      onUpdateMetadata({ saved: newSaved });
                    }}
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          className="group relative w-full btn"
          onClick={() => {
            setAnnotations([]);
            setComponentDefinition("");
            setTitle("");
          }}
        >
          <svg
            className="h-4 w-4 octicon mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Create a new annotation set
        </button>
      </div>
    </div>
  );
};

const annotationSetToString = (annotationSet: AnnotationSet) => {
  return JSON.stringify(annotationSet);
};
