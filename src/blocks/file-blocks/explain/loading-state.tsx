export function LoadingState(props: { content: string }) {
  return (
    <div className="space-y-1 p-4">
      {props.content.split("\n").map((line, index) => {
        return (
          <div key={index}>
            <pre
              className="inline-block bg-gray-300 text-gray-300 animate-pulse rounded"
              key={index}
            >
              {line}
            </pre>
          </div>
        );
      })}
    </div>
  );
}
