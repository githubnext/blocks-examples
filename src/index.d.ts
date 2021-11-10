interface FileContext {
  download_url: string;
  filename: string;
  path: string;
  repo: string;
  owner: string;
  sha: string;
  username: string;
}

interface CommonViewerProps {
  metadata: any;
  onUpdateMetadata: () => any;
  onRequestUpdateContent: () => any;
}

interface FileData {
  content: string;
  context: FileContext;
}
type FileViewerProps = FileData & CommonViewerProps;

interface FolderViewerProps extends CommonViewerProps {
  tree: {
    path: string;
    mode: string;
    type: string;
    sha: string;
    size: number;
    url: string;
  }[];
  content: string;
  meta: {
    theme: string;
    download_url: string;
    name: string;
    path: string;
    repo: string;
    owner: string;
    sha: string;
    username: string;
  };
}
