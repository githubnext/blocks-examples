interface FileContext {
  download_url: string;
  file: string;
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

interface FolderContext {
  download_url: string;
  folder: string;
  path: string;
  repo: string;
  owner: string;
  sha: string;
  username: string;
}
interface FolderData {
  tree: {
    path: string;
    mode: string;
    type: string;
    sha: string;
    size: number;
    url: string;
  }[];
  context: FolderContext;
}
type FolderViewerProps = FolderData & CommonViewerProps;
