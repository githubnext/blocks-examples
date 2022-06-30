import { tw } from "twind";
import axios from "axios";
import { useQuery } from "react-query";
import type { Explanation } from ".";

const fetchExplanation = async (
  code: string,
  language: string,
  onFetchInternalEndpoint: (url: string, params: any) => Promise<any>
): Promise<Explanation> => {
  const res = await onFetchInternalEndpoint("/api/explain", {
    method: "POST",
    data: {
      code,
      language,
    },
  });
  return res.data;
};

export function ExplanationComponent(props: {
  explanation: Explanation;
  language: string;
}) {
  const { explanation } = props;
  const onFetchInternalEndpoint =
    props.onFetchInternalEndpoint || onFetchInternalEndpointPolyfill;

  const { data, status } = useQuery(
    ["explanation", props.explanation.code],
    () =>
      fetchExplanation(
        props.explanation.code,
        props.language,
        onFetchInternalEndpoint
      ),
    { refetchOnWindowFocus: false }
  );

  return (
    <>
      <div className={tw(`sticky top-0 z-10 pb-2 bg-white`)}>
        <p className={tw(`text-xs font-mono`)}>
          Explanation for{" "}
          <span className={tw(`font-bold`)}>
            L{explanation.start}:L
            {explanation.end}
          </span>
        </p>
      </div>

      <div className={tw(`relative`)}>
        {status === "loading" && (
          <p className={tw(`text-xs  font-mono animate-pulse`)}>Loading...</p>
        )}
        {status === "success" && data && (
          <div className={tw(`pb-2`)}>
            <p className={tw(`text-xs whitespace-pre-line font-mono`)}>
              {data}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

const onFetchInternalEndpointPolyfill = async (url: string, params: any) => {
  const res = await axios(url, params);
  return res.data;
};
