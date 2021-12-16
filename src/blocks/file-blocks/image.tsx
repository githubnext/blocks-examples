import { FileBlockProps } from "@githubnext/utils";

export default function (props: FileBlockProps) {
  const { context } = props;

  const url = `https://github.com/${context.owner}/${context.repo}/blob/${context.sha}/${context.path}?raw=true`

  return (
    <div style={{
      width: "100%",
      minHeight: "60%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <img src={url} style={{
        maxWidth: '100%',
      }} />
    </div>
  )
}
