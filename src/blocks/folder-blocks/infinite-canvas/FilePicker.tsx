import { useState } from "react";
import { Files, File } from "./index";

export const FilePicker = ({
  files,
  onFileSelected,
}: {
  files: Files;
  onFileSelected: (file: File) => void;
}) => {
  // needed to close the dropdown, which is an uncontrolled detail element
  const [iteration, setIteration] = useState(0);

  return (
    <details
      className="dropdown details-reset details-overlay d-inline-block"
      key={iteration}
    >
      <summary className="btn" aria-haspopup="true">
        + File
        <div className="dropdown-caret"></div>
      </summary>

      <ul className="dropdown-menu dropdown-menu-se w-full min-w-[16em] max-h-[calc(100vh-16em)] overflow-auto">
        {files.map((file) => {
          return (
            <li key={file.path} className="dropdown-item text-sm w-full">
              <button
                onClick={() => {
                  onFileSelected(file);
                  setIteration(iteration + 1);
                }}
                className="truncate w-full text-left !overflow-hidden"
              >
                {file.path}
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
};
