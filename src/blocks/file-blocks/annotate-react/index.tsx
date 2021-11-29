// @ts-ignore:
import { CodeSandbox } from './CodeSandbox.tsx';
// @ts-ignore
import Annotation from 'react-image-annotation'
import {
  PointSelector,
  RectangleSelector,
  OvalSelector
  // @ts-ignore
} from 'react-image-annotation/lib/selectors'
import { useEffect, useState } from 'react';
import { FileBlockProps, useTailwindCdn } from '@githubnext/utils';

export default function ({ content, context, metadata, onUpdateMetadata }: FileBlockProps) {
  const { owner, repo, path } = context
  useTailwindCdn()

  const componentName = path.split('/').pop()?.split(".")[0]
  const [componentDefinition, setComponentDefinition] = useState(`<${componentName}>\n</${componentName}>`)
  const [annotations, setAnnotations] = useState([])

  const wrappedContents = typeof document === 'undefined' ? "" : `
import ReactDOM from "react-dom";

  ${content}

// render element

ReactDOM.render(
  ${componentDefinition || `<${componentName} />`},
  document.body.appendChild(document.createElement("DIV"))
)
`

  return (
    <div className="relative w-full flex h-full">
      <div className="flex flex-col flex-1 max-w-[80em]">
        <Annotator
          annotations={annotations}
          // @ts-ignore
          setAnnotations={setAnnotations}>
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
        setComponentDefinition={setComponentDefinition} />
    </div>
  );
}

const annotationTypes = [{
  id: RectangleSelector.TYPE,
  name: "Rectangle",
}, {
  id: PointSelector.TYPE,
  name: "Point",
}, {
  id: OvalSelector.TYPE,
  name: "Oval",
}]

type AnnotationType = {
  geometry: string,
  data: {
    id: number,
  }
}
type AnnotationSet = {
  annotations: AnnotationType[],
  title: string,
  componentDefinition: string,
}

const Annotator = ({ annotations, setAnnotations, children }: { annotations: AnnotationType[], setAnnotations: (annotations: AnnotationType[]) => void, children: any }) => {
  const [annotation, setAnnotation] = useState({})
  const [annotationType, setAnnotationType] = useState(annotationTypes[0].id)

  const onAddAnnotation = (annotation: AnnotationType) => {
    const { geometry, data } = annotation
    setAnnotation({})
    const newAnnotations = [...annotations, {
      geometry,
      data: {
        ...data,
        id: Math.random()
      }
    }]
    setAnnotations(newAnnotations)
  }

  return (
    <div className="flex py-6 w-full">
      <div className="flex-1 w-full p-6 pt-0 z-10">
        <div className="flex w-full items-center pb-1">
          <div className="mr-6 py-2 text-xs uppercase tracking-widest">
            Annotation type:
          </div>

          {annotationTypes.map(({ id, name }) => (
            <button
              key={id}
              className={`text-xs uppercase tracking-widest py-2 px-5 rounded-full ${annotationType === id ? "bg-indigo-500 text-white" : "hover:bg-indigo-100 text-gray-800"
                }`}
              onClick={() => {
                setAnnotationType(id)
              }}>
              {name}
            </button>
          ))}
        </div>
        <div className="">
          <Annotation
            annotations={annotations}
            type={annotationType}
            value={annotation}
            onChange={setAnnotation}
            onSubmit={onAddAnnotation}
          >
            <div className="relative w-full h-full z-[-1]">
              {children}
            </div>
          </Annotation>
        </div>
      </div>
    </div>
  )
}

const AnnotationSetList = ({ saved, onUpdateMetadata, annotations, setAnnotations, componentDefinition, setComponentDefinition }: {
  saved: AnnotationSet[], onUpdateMetadata: (metadata: any) => void, annotations: AnnotationType[], setAnnotations: (annotations: AnnotationType[]) => void, componentDefinition: string, setComponentDefinition: (componentDefinition: string) => void
}) => {
  const [title, setTitle] = useState("")

  const canSubmitForm = annotations.length && title.length
  const selectedAnnotationSetString = annotationSetToString({
    title,
    componentDefinition,
    annotations,
  })
  const selectedAnnotationSetIndex = saved.findIndex((set) => (
    annotationSetToString(set) === selectedAnnotationSetString
  ))

  return (
    <div className="w-80 h-full flex flex-col divide-y divide-gray-200">
      <form className="mb-2" onSubmit={e => {
        e.preventDefault()
        if (!canSubmitForm) return
        const newMetadata = {
          saved: [
            ...saved,
            {
              title,
              componentDefinition,
              annotations
            }
          ]
        }
        onUpdateMetadata(newMetadata)
      }}>
        <div className="mt-8 pb-4">
          Annotation set title
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 p-2 px-3 bg-gray-100"
          />
        </div>
        <div className="">
          <div className="pb-2">
            Component definition
            <div className="text-gray-500 text-sm font-light">
              You can specify the props and children
            </div>
          </div>
          <textarea className="w-full mb-2 p-2 px-3 bg-gray-100 max-w-[40em] font-mono" value={componentDefinition} onChange={(e) => {
            const value = e.target.value
            if (!value) return
            setComponentDefinition(value)
          }} />
        </div>
        <button className={`w-full p-2 px-3 ${canSubmitForm ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-400"}`} disabled={!canSubmitForm}
          type="submit">Save new annotation set</button>
      </form>
      <div className="flex-1 flex flex-col h-full w-full mt-6 pt-5">
        <div className="p-2 font-bold">
          Saved annotation sets
        </div>
        <div className="divide-y divide-gray-200 w-full flex-1 overflow-y-auto">
          {saved.map((annotationSet, index) => {
            const isSelected = selectedAnnotationSetIndex === index
            return (
              <button key={index} className={`group relative p-2 px-4 w-full text-left ${isSelected ? "bg-indigo-100" : ""}`} onClick={() => {
                setAnnotations(annotationSet.annotations)
                setComponentDefinition(annotationSet.componentDefinition)
                setTitle(annotationSet.title)
              }}>
                {annotationSet.title}
                <div className="text-gray-500 text-sm italic">
                  {annotationSet.annotations.length} annotation{annotationSet.annotations.length > 1 ? "s" : ""}
                </div>
                <button className="absolute top-1/2 right-2 h-10 w-10 transform -translate-y-1/2 cursor-pointer flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100" onClick={(e) => {
                  e.stopPropagation()
                  const newSaved = saved.filter((_, i) => i !== index)
                  onUpdateMetadata({ saved: newSaved })
                }}>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </button>
            )
          })}
          <button className="group relative py-4 px-4 w-full flex items-center justify-center text-gray-500" onClick={() => {
            setAnnotations([])
            setComponentDefinition("")
            setTitle("")
          }}>
            <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create a new annotation set
          </button>
        </div>
      </div>
    </div>
  )
}

const annotationSetToString = (annotationSet: AnnotationSet) => {
  return JSON.stringify(annotationSet)
}