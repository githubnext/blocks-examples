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

export function Block({ content, context }: FileBlockProps) {
  const { owner, repo, path } = context
  useTailwindCdn()

  const componentName = path.split('/').pop()?.split(".")[0]
  const [componentDefinition, setComponentDefinition] = useState(`<${componentName}>\n</${componentName}>`)

  const [defaultAnnotations, setDefaultAnnotations] = useState([])

  useEffect(() => {
    const query = window.location.search
    const params = new URLSearchParams(query)
    const annotations = params.get('annotations')
    const defaultAnnotations = annotations ? JSON.parse(decodeURIComponent(annotations)) : [];
    setDefaultAnnotations(defaultAnnotations)
    const componentDefinition = params.get('componentDefinition') || ""
    if (componentDefinition) {
      setComponentDefinition(decodeURIComponent(componentDefinition))
    }
  }, [])


  const onSubmit = async (annotations: AnnotationType[], title: string, description: string) => {
    const url = `https://github-blocks.vercel.app/${owner}/${repo}?path=${path}&annotations=${encodeURIComponent(JSON.stringify(annotations))}&componentDefinition=${encodeURIComponent(JSON.stringify(componentDefinition))}&blockId=githubnext--blocks-examples--%2Fsrc%2Fblocks%2Ffile-blocks%2Fannotate-react%2Findex.tsx`
    const body = `${description}

[Annotated component](${encodeURIComponent(url)})`

    const newIssueUrl = `https://github.com/${owner}/${repo}/issues/new?title=${title}&body=${body}`
    window.open(newIssueUrl, "_blank")
  }

  const wrappedContents = `
import ReactDOM from "react-dom";

  ${content}

// render element

ReactDOM.render(
  ${componentDefinition || `<${componentName} />`},
  document.body.appendChild(document.createElement("DIV"))
)
`

  return (
    <div className="relative w-full">
      <div className="p-2">
        <div className="p-2 px-3">
          Component definition (you can set props)
        </div>
        <textarea className="w-full mb-2 p-2 px-3 bg-gray-100 max-w-[40em] font-mono" value={componentDefinition} onChange={(e) => {
          const value = e.target.value
          if (!value) return
          setComponentDefinition(value)
        }} />
      </div>
      <Annotator defaultAnnotations={defaultAnnotations} onSubmit={onSubmit}>
        <CodeSandbox language="js" dependencies={["react", "react-dom"]}>
          {wrappedContents}
        </CodeSandbox>
      </Annotator>
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

const Annotator = ({ defaultAnnotations, onSubmit, children }: {
  defaultAnnotations: any[],
  onSubmit: (annotations: AnnotationType[], title: string, description: string) => void,
  children: any
}) => {
  const [annotation, setAnnotation] = useState({})
  const [annotationType, setAnnotationType] = useState(annotationTypes[0].id)
  const [annotations, setAnnotations] = useState(defaultAnnotations || [])
  const [issueTitle, setIssueTitle] = useState("")
  const [issueDescription, setIssueDescription] = useState("")
  const [hasEdited, setHasEdited] = useState(false)

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
    setHasEdited(true)
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
      <div className="flex-1 p-6 self-stretch max-h-[40em] max-w-[35em]">
        {!!annotations.length && hasEdited && (
          <form className="flex flex-col h-full space-y-2" onSubmit={(e) => {
            e.preventDefault()
            onSubmit(
              annotations, issueTitle, issueDescription
            )
          }}>
            <div className="text-lg font-bold">Create a new GitHub Issue</div>
            <input className="bg-white border border-gray-300 focus:outline-none focus:border-indigo-500 py-2 px-4 block w-full appearance-none leading-normal" type="text" placeholder="Title" value={issueTitle} onChange={(e) => {
              setIssueTitle(e.target.value)
            }} />
            <textarea className="bg-white border border-gray-300 flex-1 focus:outline-none focus:border-indigo-500 py-2 px-4 block w-full appearance-none leading-normal resize-none"
              placeholder="Description"
              value={issueDescription}
              onChange={(e) => {
                setIssueDescription(e.target.value)
              }}
            />
            <button className={`bg-indigo-500 hover:bg-indigo-700 focus:bg-indigo-700 text-white py-3 px-4 rounded-full transition ${issueTitle.length > 0 && issueDescription.length > 0 ? "opacity-100" : "opacity-50"
              }`} type="submit">
              Create issue
            </button>

          </form>
        )}
      </div>
    </div>
  )
}