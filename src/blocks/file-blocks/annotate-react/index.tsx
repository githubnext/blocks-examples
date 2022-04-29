// @ts-ignore
import { tw } from "twind";
import { FileBlockProps } from "@githubnext/utils";
import { useState } from "react";
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
import {
  Button,
  FormControl,
  Radio,
  RadioGroup,
  Textarea,
  TextInput,
  ActionList,
} from "@primer/react";
import { CheckIcon, PlusIcon, TrashIcon } from "@primer/octicons-react";

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
    <div className={tw(`relative w-full flex h-full`)}>
      <div className={tw(`flex flex-col flex-1 h-full max-w-[80em]`)}>
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
    <div className={tw(`flex w-full h-full`)}>
      <div className={tw(`flex-1 w-full h-full p-5 pt-0 z-10`)}>
        <RadioGroup name="annotationType">
          <RadioGroup.Label>Annotation Type</RadioGroup.Label>
          {annotationTypes.map(({ id, name }) => (
            <FormControl key={id}>
              <Radio
                checked={annotationType === id}
                onChange={() => setAnnotationType(id)}
                value={id}
              />
              <FormControl.Label>{name}</FormControl.Label>
            </FormControl>
          ))}
        </RadioGroup>

        <div className={tw(`h-full`)}>
          <Annotation
            annotations={annotations}
            type={annotationType}
            value={annotation}
            onChange={setAnnotation}
            onSubmit={onAddAnnotation}
          >
            <div className={tw(`relative w-full h-full z-[-1]`)}>
              {children}
            </div>
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
    <div className={tw(`w-80 h-full flex flex-col divide-y divide-gray-200`)}>
      <form
        className={tw(`px-5 pt-5 pb-2`)}
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
        <div className={tw(`mb-3`)}>
          <FormControl>
            <FormControl.Label>Annotation Set Title</FormControl.Label>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormControl>
        </div>
        <div className={tw(`mb-3`)}>
          <FormControl>
            <FormControl.Label>Component Definition</FormControl.Label>
            <FormControl.Caption>
              You can specify the props and children
            </FormControl.Caption>
            <Textarea
              rows={3}
              value={componentDefinition}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;
                setComponentDefinition(value);
              }}
            />
          </FormControl>
        </div>

        <Button
          className={tw(`w-full`)}
          variant="primary"
          aria-disabled={!canSubmitForm ? "true" : undefined}
          type="submit"
        >
          Save new annotation set
        </Button>
      </form>
      <div className={tw(`flex-1 px-5 py-3 flex flex-col h-full w-full mt-3`)}>
        <div className={tw(`font-semibold`)}>Saved annotation sets</div>
        <ActionList>
          {saved.map((annotationSet, index) => {
            const isSelected = selectedAnnotationSetIndex === index;
            return (
              <ActionList.Item
                selected={isSelected}
                key={index}
                onSelect={() => {
                  setAnnotations(annotationSet.annotations);
                  setComponentDefinition(annotationSet.componentDefinition);
                  setTitle(annotationSet.title);
                }}
              >
                <ActionList.LeadingVisual>
                  <CheckIcon />
                </ActionList.LeadingVisual>

                <span
                  className={tw(
                    `flex-1 flex flex-col justify-start items-start`
                  )}
                >
                  {annotationSet.title}
                  <span className={tw(`note`)}>
                    {annotationSet.annotations.length} annotation
                    {annotationSet.annotations.length > 1 ? "s" : ""}
                  </span>
                </span>

                <button
                  className={tw(
                    `absolute top-1/2 right-2 h-10 w-10 transform -translate-y-1/2 cursor-pointer flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100`
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newSaved = saved.filter((_, i) => i !== index);
                    onUpdateMetadata({ saved: newSaved });
                  }}
                >
                  <TrashIcon />
                </button>
              </ActionList.Item>
            );
          })}
        </ActionList>
        <Button
          className={tw(`w-full`)}
          onClick={() => {
            setAnnotations([]);
            setComponentDefinition("");
            setTitle("");
          }}
          leadingIcon={PlusIcon}
        >
          Create a new annotation set
        </Button>
      </div>
    </div>
  );
};

const annotationSetToString = (annotationSet: AnnotationSet) => {
  return JSON.stringify(annotationSet);
};
