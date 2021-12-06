import '@tensorflow/tfjs';
import { FileBlockProps } from "@githubnext/utils";
import { useEffect, useState } from "react";
import * as use from '@tensorflow-models/universal-sentence-encoder';
// import { Tensor2D } from "@tensorflow/tfjs";
// import * as tf from '@tensorflow/tfjs-core';
// import { UniversalSentenceEncoder } from "@tensorflow-models/universal-sentence-encoder";

// zipWith :: (a -> b -> c) -> [a] -> [b] -> [c]
const zipWith = (f: (a: number, b: number) => number, xs: number[], ys: number[]) => {
      const ny = ys.length;
      return (xs.length <= ny ? xs : xs.slice(0, ny)).map((x, i) => f(x, ys[i]));
}

// dotProduct :: [Int] -> [Int] -> Int
const dotProduct = (xs: number[], ys: number[]) => {
      const sum = (xs: number[]) => xs ? xs.reduce((a, b) => a + b, 0) : undefined;
      return xs.length === ys.length ? (sum(zipWith((a, b) => a * b, xs, ys))) : undefined;
}

interface Response {
  score: number;
  response: string;
}

interface QueryResult {
  query: string;
  responses: Response[]
}

export default function (props: FileBlockProps) {
    const { content } = props;

    const [results, setResults] = useState<QueryResult[]>([]);
    const input = JSON.parse(content);
  
    useEffect(() => {
      const init = async () => {
        console.log("initializing...")
        
        const model = await use.loadQnA();
        const result = model.embed(input);
        const query = result['queryEmbedding'].arraySync() as number[][]; // [numQueries, 100]
        const answers = result['responseEmbedding'].arraySync() as number[][]; // [numAnswers, 100]
        const queriesLength = input.queries.length;
        const answersLength = input.responses.length;
        
        const tempResults = [];
        // go through each query
        for (let i = 0; i < queriesLength; i++) {
          const temp = [];
          // calculate the dot product of the query and each answer
          for (let j = 0; j < answersLength;  j++) {
            temp.push({
              response: input.responses[j],
              score: dotProduct(query[i], answers[j]) || 0
            })
          }

          tempResults.push({
            query: input.queries[i],
            responses: temp
          })
        }
        setResults(tempResults);
      }
      init();
    }, []);
  
    return (
      <div>
        <h2>Sentence Encoder Results</h2>
        {results ? results.map((query, i) => (
          <div key={i}>
            <div>
              <h3>{query.query}</h3>
              {query.responses.map((response, j) => (
                <div key={j}>
                  <span style={{ marginRight: '2px', fontWeight: 'bold' }}>
                    {response.response} — 
                  </span>
                  {response.score.toFixed(2)}
                </div>
              ))}
            </div>
            <br />
          </div>
        )) : <div>Loading...</div>}
      </div>
    )
  }
  