import "@tensorflow/tfjs";
import { FileBlockProps, useTailwindCdn } from "@githubnext/utils";
import { useEffect, useState } from "react";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import { UniversalSentenceEncoderQnA } from "@tensorflow-models/universal-sentence-encoder/dist/use_qna";
import * as tf from "@tensorflow/tfjs";

// zipWith :: (a -> b -> c) -> [a] -> [b] -> [c]
const zipWith = (
  f: (a: number, b: number) => number,
  xs: number[],
  ys: number[]
) => {
  const ny = ys.length;
  return (xs.length <= ny ? xs : xs.slice(0, ny)).map((x, i) => f(x, ys[i]));
};

// dotProduct :: [Int] -> [Int] -> Int
const dotProduct = (xs: number[], ys: number[]) => {
  const sum = (xs: number[]) =>
    xs ? xs.reduce((a, b) => a + b, 0) : undefined;
  return xs.length === ys.length
    ? sum(zipWith((a, b) => a * b, xs, ys))
    : undefined;
};

const computeEmbedding = (model: UniversalSentenceEncoderQnA, input: Input) => {
  const embedding = model.embed(input);
  const results: QueryResult[] = [];

  tf.tidy(() => {
    const query = embedding["queryEmbedding"].arraySync() as number[][]; // [numQueries, 100]
    const answers = embedding["responseEmbedding"].arraySync() as number[][]; // [numAnswers, 100]
    const queriesLength = input.queries.length;
    const answersLength = input.responses.length;

    // go through each query
    for (let i = 0; i < queriesLength; i++) {
      const temp = [];
      // calculate the dot product of the query and each answer
      for (let j = 0; j < answersLength; j++) {
        temp.push({
          response: input.responses[j],
          score: dotProduct(query[i], answers[j]) || 0,
        });
      }

      results.push({
        query: input.queries[i],
        responses: temp,
      });
    }
  });
  tf.dispose(embedding["queryEmbedding"]); // need to dispose the tensors
  tf.dispose(embedding["responseEmbedding"]);

  return results;
};

interface Input {
  queries: string[];
  responses: string[];
}

interface Response {
  score: number;
  response: string;
}

interface QueryResult {
  query: string;
  responses: Response[];
}

export default function (props: FileBlockProps) {
  const status = useTailwindCdn();

  const { content } = props;
  const input: Input = JSON.parse(content);

  const [editView, setEditView] = useState(false);
  const [model, setModel] = useState<UniversalSentenceEncoderQnA>();
  const [results, setResults] = useState<QueryResult[]>([]);

  // custom edit section
  const [customQuestion, setCustomQuestion] = useState<string>();
  const [customAnswers, setCustomAnswers] = useState<string[]>(["", "", ""]);
  const [computedQuery, setComputedQuery] = useState<QueryResult>();

  const computeScore = async () => {
    if (model && customQuestion) {
      const input = {
        queries: [customQuestion],
        responses: customAnswers.filter((a) => a !== ""),
      };
      const result = computeEmbedding(model, input);
      setComputedQuery(result[0]);
    }
  };

  useEffect(() => {
    const init = async () => {
      const model = await use.loadQnA();
      setModel(model);
      const result = computeEmbedding(model, input);
      setResults(result);
    };

    init();

    // Specify how to clean up after this effect:
    return function cleanup() {
      tf.disposeVariables();
    };
  }, []);

  return (
    <>
      {status === "ready" && model ? (
        <div className="m-4">
          <div className="flex row mb-8">
            <h2 className="text-lg text-gray-900 font-semibold mr-4">
              Sentence Encoder
            </h2>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
              onClick={() => setEditView(!editView)}
            >
              {editView ? "Back to data results" : "Try your own question"}
            </button>
          </div>

          {editView ? (
            <div>
              <div className="mb-3 pt-0">
                <input
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  type="text"
                  placeholder="Question"
                  className="px-3 py-3 placeholder-blueGray-300 text-blueGray-600 relative bg-white bg-white rounded text-sm border border-blueGray-300 outline-none focus:outline-none focus:ring w-full"
                />
              </div>
              <div className="mb-3 pt-0">
                <input
                  onChange={(e) => {
                    customAnswers[0] = e.target.value;
                    setCustomAnswers(customAnswers);
                  }}
                  type="text"
                  placeholder="Answer 1"
                  className="px-3 py-3 placeholder-blueGray-300 text-blueGray-600 relative bg-white bg-white rounded text-sm border border-blueGray-300 outline-none focus:outline-none focus:ring w-full"
                />
              </div>
              <div className="mb-3 pt-0">
                <input
                  onChange={(e) => {
                    customAnswers[1] = e.target.value;
                    setCustomAnswers(customAnswers);
                  }}
                  type="text"
                  placeholder="Answer 2"
                  className="px-3 py-3 placeholder-blueGray-300 text-blueGray-600 relative bg-white bg-white rounded text-sm border border-blueGray-300 outline-none focus:outline-none focus:ring w-full"
                />
              </div>
              <div className="mb-3 pt-0">
                <input
                  onChange={(e) => {
                    customAnswers[2] = e.target.value;
                    setCustomAnswers(customAnswers);
                  }}
                  type="text"
                  placeholder="Answer 3"
                  className="px-3 py-3 placeholder-blueGray-300 text-blueGray-600 relative bg-white bg-white rounded text-sm border border-blueGray-300 outline-none focus:outline-none focus:ring w-full"
                />
              </div>
              {computedQuery ? (
                <div className="mb-3">
                  <Table query={computedQuery}></Table>
                </div>
              ) : null}
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={computeScore}
              >
                Compute score
              </button>
            </div>
          ) : results ? (
            results.map((query, i) => (
              <div key={i}>
                <div>
                  <Table query={query}></Table>
                </div>
                <br />
              </div>
            ))
          ) : (
            <div>Loading...</div>
          )}
        </div>
      ) : (
        <div className="m-4">Loading...</div>
      )}
    </>
  );
}

interface TableProps {
  query: QueryResult;
}

function Table(props: TableProps) {
  const query = props.query;

  return (
    <table className="table-auto">
      <thead>
        <tr>
          <th className="px-4 py-2 text-gray-700">Question</th>
          <th className="px-4 py-2 text-gray-700">Answer</th>
          <th className="px-4 py-2 text-gray-700">Score</th>
        </tr>
      </thead>
      <tbody>
        {query.responses.map((response, j) => (
          <tr key={j}>
            <td
              className={`${j === 0
                  ? "border border-gray-500 border-b-0"
                  : "invisible border-l border-r border-gray-500"
                } ${j === query.responses.length - 1 ? "border-b" : ""
                } px-4 py-2 text-gray-700 font-medium`}
            >
              {query.query}
            </td>
            <td className="border border-gray-500 px-4 py-2 text-gray-700 font-medium">
              {response.response}
            </td>
            <td className="border border-gray-500 px-4 py-2 text-gray-700 font-medium">
              {response.score.toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
