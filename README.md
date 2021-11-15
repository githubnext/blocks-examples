# Composable Github Example Viewers

The Composable Github app depends on a set of "viewers" that handle how to render files and folders. This repo contains a set of example viewers that can serve as inspiration for you to create your own. 

## Example viewers

Viewers come in two types: file viewers and folder viewers. 

All viewers require an object within [`package.json`](https://github.com/githubnext/composable-github-example-viewers/blob/main/package.json#L9) to describe their intended use. For example:

```json
{
      "type": "file",
      "title": "CSS viewer",
      "description": "View selectors in a css file",
      "entry": "/viewers/file-viewers/css.tsx",
      "extensions": [
        "css"
      ]
}
```

### File viewers

| Viewer name     | Description |  Supported extensions |
| ----------- | ----------- | ----------- |
| Code      | Simple viewer for code       |  all extensions
| 3D Files   | 3D model viewer with Three.js        | obj, fbx, gltf, glb
| Css   | View selectors in a css file        | css
| Excalidraw   | A drawing/whiteboard viewer        | excalidraw
| Flat  | A viewer for flat data files        | csv, json
| Iframe  | Render any html iframe        | iframe
| Chart  | A vega chart viewer        | chart

### Folder viewers

| Viewer name     | Description |
| ----------- | ----------- | 
| Minimap      | A visualization of your folders and files


## Create your own custom viewer

Follow the instructions in our [custom viewer template](https://github.com/githubnext/composable-github-viewer-template) repository.
