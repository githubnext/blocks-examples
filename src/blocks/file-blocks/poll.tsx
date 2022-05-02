import { tw } from "twind";
import { FileBlockProps } from "@githubnext/utils"; // to import tailwind css

export default function (props: FileBlockProps) {
  const { content, isEditable, onUpdateContent } = props;
  const poll = JSON.parse(content);

  const onClick = (index: number) => {
    if (!isEditable) return;
    return () => {
      const newPoll = { ...poll };
      newPoll.options[index].votes += 1;
      onUpdateContent(JSON.stringify(newPoll));
    };
  };

  if (!poll || !poll.options)
    return (
      <div className={tw(`py-20 text-gray-500 w-full text-center italic`)}>
        No poll data found
      </div>
    );

  const totalVotes = poll.options.reduce((acc, cur) => acc + cur.votes, 0);

  return (
    <div className={tw(`w-full m-2 py-20 flex flex-col items-center`)}>
      {poll.poll}
      {poll.options.map((option, index) => {
        const percent = Math.floor((option.votes / totalVotes) * 100);
        return (
          <div key={index} className={tw(`my-2`)}>
            <div className={tw(`font-bold`)}>{option.text}</div>
            <div className={tw(`flex row items-center`)}>
              <div className={tw(`w-80 border border-gray-200 mr-2`)}>
                <div
                  className={tw(`bg-blue-400 h-3`)}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
              <span className={tw(`mr-2`)}>{percent}%</span>
              <span className={tw(`font-light mr-2`)}>
                {option.votes} votes
              </span>
              <button
                disabled={!isEditable}
                className={tw(
                  `bg-transparent hover:bg-blue-500 text-blue-400 hover:text-white px-2 border border-blue-500 hover:border-transparent rounded ${
                    !isEditable ? "pointer-events-none" : ""
                  }`
                )}
                onClick={() => onClick(index)}
              >
                Vote
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
