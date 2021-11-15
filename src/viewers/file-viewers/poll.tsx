import { useState } from "react";
// import { useUpdateFileContents, useFileContent } from "hooks";
// import { ViewerProps } from ".";

// import './index.css'; // TODO: need to import tailwind

interface PollOptions {
  text: string;
  votes: number;
}

type Poll = {
  poll: string; // title
  options: PollOptions[];
};

export function Viewer(props: FileViewerProps) {
  const { content } = props;
  const [poll, setPoll] = useState<Poll>(JSON.parse(content));

  const totalVotes = poll.options.reduce((acc, cur) => acc + cur.votes, 0);

  // for saving the poll file
  /*
    const {
        data: dataRes,
        status,
        refetch,
    } = useFileContent({
        repo: meta.repo,
        owner: meta.owner,
        path: meta.path,
    });

    const { mutateAsync } = useUpdateFileContents({
        onSuccess: () => {
        console.log("poll saved");
        },
        onError: (e) => {
        console.log("poll did NOT save, something bad happend", e);
        },
    });

    const handleSave = async () => {
        await mutateAsync({
        content: JSON.stringify(poll),
        owner: meta.owner,
        repo: meta.repo,
        path: dataRes[0].name,
        // sha: meta.sha,
        sha: dataRes[0].sha,
        });

        await refetch();
    };
    */

  return (
    <div className="w-full">
      {poll.poll}
      {poll.options.map((option, index) => {
        const percent = Math.floor((option.votes / totalVotes) * 100);
        return (
          <div key={index} className="my-2">
            <div className="font-bold">{option.text}</div>
            <div className="flex row items-center">
              <div className="w-80 border border-gray-200 mr-2">
                <div
                  className="bg-blue-400 h-3"
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
              <span className="mr-2">{percent}%</span>
              <span className="font-light mr-2">{option.votes} votes</span>
              {/* <button
                    className="bg-transparent hover:bg-blue-500 text-blue-400 hover:text-white px-2 border border-blue-500 hover:border-transparent rounded"
                    onClick={() => {
                    poll.options[index].votes += 1;
                    setPoll(poll);
                    handleSave();
                    }}
                >
                    Vote
                </button> */}
            </div>
          </div>
        );
      })}
    </div>
  );
}
