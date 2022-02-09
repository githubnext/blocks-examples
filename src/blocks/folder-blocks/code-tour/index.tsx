import cq from "@fullstackio/cq";
import { FolderBlockProps, getLanguageFromFilename, useTailwindCdn } from "@githubnext/utils";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Select from 'react-select';
import SyntaxHighlighter from "react-syntax-highlighter";
import "./style.css";

export default function (props: FolderBlockProps) {
  const { tree, context, metadata = {}, onUpdateMetadata, onRequestGitHubData } = props;
  useTailwindCdn()

  const tours = metadata["tours"] || []
  const tourOptions = useMemo(() => {
    return tours.map((tour: any, index: number) => ({
      value: index,
      label: tour.name
    }))
  }, [tours])

  const pathOptions = useMemo(() => (tree.filter(d => d.type === "blob").map(d => ({ value: d.path, label: d.path }))), [tree]);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [selectedTourIndex, setSelectedTourIndex] = useState(0);

  const newStep = {
    name: 'New step',
    description: '',
    path: pathOptions[0]?.value,
    query: '',
  }
  const tour = tours[selectedTourIndex]
  const isEditing = !tour

  const [steps, setSteps] = useState<StepType[]>(tour?.steps || [newStep]);
  useEffect(() => {
    setSteps(tour?.steps || [newStep])
  }, [selectedTourIndex])

  const [pathsContent, setPathsContent] = useState<Record<string, string>>({});
  const usedPaths = [...new Set(steps.map(d => d.path))]
  const getPathsContent = async () => {
    const pathsWithNoContent = usedPaths.filter(d => !pathsContent[d]);
    let newPathsContent = { ...pathsContent }
    for (const path of pathsWithNoContent) {
      const data = await onRequestGitHubData("file-content", {
        owner: context.owner,
        repo: context.repo,
        path: path,
        fileRef: context.sha,
      })
      newPathsContent[path] = data.content
    }
    setPathsContent(newPathsContent)
  }
  useEffect(() => {
    getPathsContent()
  }, [usedPaths.join(",")])

  return (
    <div className="w-full h-full" id="example-block-code-block">
      <div className="flex w-full h-full overflow-x-hidden">
        <div className="flex-1 h-full min-w-0 p-5 pb-0">
          {!!steps[selectedStepIndex] && (
            <StepContent
              index={selectedStepIndex}
              step={steps[selectedStepIndex]}
              content={pathsContent[steps[selectedStepIndex].path] || ""}
              pathOptions={pathOptions}
              isEditing={isEditing}
              onChange={(step) => {
                const newSteps = [...steps];
                newSteps[selectedStepIndex] = step;
                setSteps(newSteps);
              }}
            />
          )}
        </div>

        <div className="w-80 h-full overflow-y-auto p-5 pl-0">
          <div className="uppercase mb-1 text-sm text-gray-600 tracking-widest">
            Code Tour
          </div>
          <div className="grid grid-cols-7 gap-2 mb-4">
            <div className="col-span-6">
              <Select
                options={tourOptions}
                value={tourOptions[selectedTourIndex] || null}
                onChange={(e) => setSelectedTourIndex(e.value)}
                placeholder="Select tour"
              />
            </div>
            <button className="btn px-2" onClick={() => {
              setSelectedTourIndex(-1)
            }}>
              +
            </button>
          </div>

          <div className="uppercase mb-1 text-sm text-gray-600 tracking-widest">
            Steps
          </div>
          <TourSteps steps={steps} setSteps={setSteps} selectedStepIndex={selectedStepIndex} setSelectedStepIndex={setSelectedStepIndex} newStep={newStep} isEditing={isEditing} />

          {isEditing && (
            <TourControls steps={steps} setSteps={setSteps} setSelectedStepIndex={setSelectedStepIndex} newStep={newStep} onSave={(name) => {
              const newTours = [...tours];
              newTours.push({
                name,
                steps
              })
              onUpdateMetadata({ tours: newTours })
              setSelectedTourIndex(newTours.length - 1)

            }} />
          )}
        </div>
      </div>
    </div>
  );
}

type StepType = {
  name: string;
  description: string;
  path: string;
  query: string;
}
type Snippet = {
  code: string;
  start_line: number;
  start: number;
}

const TourControls = ({ steps, setSteps, newStep, setSelectedStepIndex, onSave }: {
  steps: StepType[],
  setSteps: (steps: StepType[]) => void,
  newStep: StepType,
  setSelectedStepIndex: (index: number) => void,
  onSave: (name: string) => void,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  return (
    <>
      {isSaving ? (
        <form className="mt-2" onSubmit={e => {
          e.preventDefault();
          onSave(name);
        }}>

          <label className="">
            Tour name
          </label>
          <input className="flex-1 w-full py-2 px-3 border border-gray-400 rounded-md" type="text"
            autoFocus
            value={name} onChange={(e) => setName(e.target.value)} />
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button className="btn w-full" onClick={() => {
              setIsSaving(false);
            }} type="button">
              Cancel
            </button>
            <button className="btn btn-primary w-full">
              Save
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button className="mt-3 btn w-full" onClick={() => {
            setSteps([...steps, newStep])
            setSelectedStepIndex(steps.length)
          }}>
            + Add Step
          </button>
          <button className="mt-3 btn btn-primary w-full" onClick={() => setIsSaving(true)}>
            Save tour
          </button>
        </div>
      )}
    </>
  )
}

const TourSteps = ({ steps, setSteps, selectedStepIndex, setSelectedStepIndex, isEditing }: {
  steps: StepType[],
  setSteps: (steps: StepType[]) => void,
  selectedStepIndex: number,
  setSelectedStepIndex: (index: number) => void,
  isEditing: boolean,
}) => {
  return (
    <div className="w-full">
      <div className="divide-y divide-gray-200">
        {steps.map((step, index) => (
          <Step
            key={index}
            step={step}
            isSelected={selectedStepIndex === index}
            onSelect={() => setSelectedStepIndex(index)}
            onDelete={isEditing ? (() => {
              const newSteps = [...steps];
              newSteps.splice(index, 1);
              setSteps(newSteps);
            }) : null}
          />
        ))}
      </div>
    </div>
  )
}

const Step = ({ step, isSelected, onSelect, onDelete }: {
  step: StepType,
  isSelected: boolean,
  onSelect: () => void,
  onDelete: (() => void) | null,
}) => {
  return (
    <button className={`relative group w-full text-left py-3 px-3 ${isSelected ? "bg-[#0A69DA] text-white" : "bg-white"
      }`} onClick={onSelect}>
      <div className="font-semibold mb-1">
        {step.name}
      </div>
      <div className="opacity-60 font-mono text-xs truncate">
        {step.path}
      </div>
      {!!onDelete && (
        <button className="!absolute top-1/2 right-0 px-2 flex items-center justify-center btn btn-danger transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100" onClick={e => {
          e.stopPropagation();
          onDelete()
        }}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </button>
  )
}

const StepContent = ({ index, step, content, pathOptions, isEditing, onChange }: {
  index: number,
  step: StepType,
  content: string,
  pathOptions: { value: string, label: string }[],
  isEditing: boolean
  onChange: (step: StepType) => void,
}) => {
  const [localQuery, setLocalQuery] = useState(step.query);
  const stepRef = useRef<StepType>(step)
  const stepIndexRef = useRef<number>(index)
  useEffect(() => {
    stepRef.current = step
  }, [step])
  useEffect(() => {
    setLocalQuery(step.query)
  }, [step.query])
  useEffect(() => {
    stepIndexRef.current = index
  }, [index])
  const setQuery = (localQuery: string, index: number, onChange: (newStep: StepType) => void) => {
    if (stepIndexRef.current !== index) return
    onChange({ ...stepRef.current, query: localQuery })
  }
  const debouncedUpdateQuery = useCallback(debounce((localQuery, index, onChange) => setQuery(localQuery, index, onChange), 500), [])
  useEffect(() => {
    debouncedUpdateQuery(localQuery, index, onChange)
  }, [localQuery])

  const [codeSnippet, setCodeSnippet] = useState<Snippet | null>(null);
  const getCodeSnippet = async () => {
    if (!step.query) {
      setCodeSnippet(null)
      return
    }
    try {
      const snippet = await cq(content, step.query)
      setCodeSnippet(snippet)
    } catch (e) {
      try {
        let [start, end] = step.query.split("-").map(d => +d)
        if (step.query.startsWith(":")) {
          start = end = +step.query.slice(1)
        } if (!Number.isFinite(end)) {
          end = start
        }
        const values = [start, end].sort((a, b) => a - b)
        start = values[0]
        end = values[1]
        const code = content.split("\n").slice(start - 1, end).join("\n")
        setCodeSnippet({ code: code, start_line: start, start: 0 })
      } catch (e) {
        setCodeSnippet({ code: content, start_line: 0, start: 0 })
      }
    }
  }
  const filename = step.path.split("/").pop() as string
  const language = getLanguageFromFilename(filename)

  useEffect(() => { getCodeSnippet() }, [step.query, content])

  const codeContainer = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setTimeout(() => {
      if (!codeContainer.current) return
      const firstLine = codeContainer.current.querySelector("[data-is-highlighted]")
      if (!firstLine) return
      firstLine.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 10)
  }, [index])

  return (
    <div className="h-full flex flex-col">
      {isEditing ? (
        <div className="w-full">
          <label className="">
            Step name
          </label>
          <input className="form-control py-2 w-full" value={step.name} onChange={(e) => onChange({ ...step, name: e.target.value })} />
          {/* <textarea value={step.description} onChange={(e) => onChange({ ...step, description: e.target.value })} className="w-full h-40 py-3 px-5  border border-gray-300 rounded" /> */}

          <div className="flex mt-2">
            <div className="flex-1 min-w-0">
              <label className="">
                Path
              </label>
              <Select options={pathOptions} value={pathOptions.find(d => d.value === step.path)}
                styles={selectStyles}
                onChange={(newValue: any) => {
                  const path = newValue.value
                  onChange({ ...step, path })
                }} />
            </div>
            <div className="flex-none min-w-0 w-40 ml-1">
              <label className="">
                Query
              </label>
              <input className="form-control py-2" value={localQuery} onChange={(e) => setLocalQuery(e.target.value)} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="font-semibold text-lg mb-1">
            {step.name}
          </div>
          <div className="opacity-60 font-mono text-xs truncate mb-2">
            {step.path}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-y-auto mt-1">

        <div className="flex-1 h-full flex flex-col overflow-y-auto overflow-x-hidden" ref={codeContainer}>
          <Code code={content} language={language} highlightRangeStart={codeSnippet?.start_line} highlightRangeEnd={codeSnippet && codeSnippet?.start_line + codeSnippet.code.split("\n").length - 1}
            onLineClick={isEditing ? ((lineIndex) => {
              let [start, end] = step.query.split("-").map(d => Number.isFinite(+d) ? +d : null)
              if (end === null || end === undefined) {
                end = lineIndex
              } else {
                start = lineIndex
                end = null
              }
              onChange({
                ...step,
                query: start && end ? `${start}-${end}` : `${start || end}`
              })
            }) : null}
          />
        </div>
      </div>
    </div>
  )
}



const Code = ({ code = "", language, startLineNumber = 1, highlightRangeStart, highlightRangeEnd, onLineClick }: {
  code: string,
  language: string,
  startLineNumber?: number,
  highlightRangeStart?: number,
  highlightRangeEnd?: number
  onLineClick: ((lineNumber: number) => void) | null
}) => {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTimeout(() => {
      if (!container.current) return
      const firstHighlightedLine = container.current.querySelector("[data-is-highlighted='true']")
      if (!firstHighlightedLine) return
      firstHighlightedLine.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 100)
  }, [highlightRangeStart, highlightRangeEnd])

  return (
    <div className="code text-sm w-full overflow-x-auto" ref={container}>
      <SyntaxHighlighter
        language={language}
        useInlineStyles={false}
        showLineNumbers
        startingLineNumber={startLineNumber}
        lineNumberStyle={{ padding: "0.03em 0.6em 0.03em 0.6em", opacity: 0.45 }}
        wrapLines
        lineProps={(i) => {
          if (!highlightRangeStart || !highlightRangeEnd) {
            return {
              ["data-is-highlighted"]: "false",
              style: {
                cursor: onLineClick ? "pointer" : "default",
                width: "100%",
                display: "block",
              },
              onClick: onLineClick ? () => onLineClick(i) : undefined
            }
          } else {
            const isHighlighted = i >= highlightRangeStart && i <= highlightRangeEnd
            return {
              ["data-is-highlighted"]: isHighlighted,
              style: {
                backgroundColor: isHighlighted ? "#FEF2C7" : "",
                width: "100%",
                display: "block",
                color: isHighlighted ? "#000" : "",
                cursor: onLineClick ? "pointer" : "default",
              },
              onClick: onLineClick ? () => onLineClick(i) : undefined
            }
          }
        }}

      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

const selectStyles = {
  // @ts-ignore
  menu: (provided, state) => ({
    ...provided,
    width: "auto",
    minWidth: "100%",
    zIndex: 1000,
  }),
  // @ts-ignore
  input: (provided, state) => ({
    ...provided,
    minWidth: "8em",
    borderColor: "#D1D5DB"
  }),
}