import axios from "axios";
import { useQuery } from "react-query";
import type { Explanation } from ".";

const fetchExplanation = async (code: string) => {
  // TODO: Use Blocks API
  const res = await axios.post(`http://localhost:3000/api/explain`, {
    code,
    language: "javascript",
  });
  return res.data;
};

export function ExplanationComponent(props: {
  explanation: Explanation;
  onCommit: (data: string) => void;
}) {
  const { explanation } = props;
  const { data, status } = useQuery(
    ["explanation", props.explanation.code],
    () => fetchExplanation(props.explanation.code),
    { refetchOnWindowFocus: false }
  );

  return (
    <>
      <div className="sticky top-0 z-10 pb-2">
        <p className="text-xs font-mono">
          Explanation for{" "}
          <span className="font-bold">
            L{explanation.start}:L
            {explanation.end}
          </span>
        </p>
      </div>

      <div className=" relative">
        {status === "loading" && (
          <p className="text-xs  font-mono animate-pulse">Loading...</p>
        )}
        {status === "success" && data && (
          <div>
            <p className="text-xs  font-mono">{data}</p>
          </div>
        )}
      </div>
    </>
  );
}
