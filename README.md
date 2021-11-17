# Composable Github Example Blocks

The Composable Github app depends on a set of "blocks" that handle how to render files and folders. This repo contains a set of example blocks that can serve as inspiration for you to create your own.

## Example blocks

Blocks come in two types: file blocks and folder blocks.

All blocks require an object within [`package.json`](https://github.com/githubnext/composable-github-example-blocks/blob/main/package.json#L9) to describe their intended use. For example:

```json
{
  "type": "file",
  "title": "CSS block",
  "description": "View selectors in a css file",
  "entry": "/blocks/file-blocks/css.tsx",
  "extensions": ["css"]
}
```

### File blocks

| Block name | Description                  | Supported extensions |
| ---------- | ---------------------------- | -------------------- |
| Code       | Simple block for code        | all extensions       |
| 3D Files   | 3D model block with Three.js | obj, fbx, gltf, glb  |
| Css        | View selectors in a css file | css                  |
| Excalidraw | A drawing/whiteboard block   | excalidraw           |
| Flat       | A block for flat data files  | csv, json            |
| Iframe     | Render any html iframe       | iframe               |
| Chart      | A vega chart block           | chart                |

### Folder blocks

| Block name | Description                               |
| ---------- | ----------------------------------------- |
| Minimap    | A visualization of your folders and files |

## Create your own custom block

Follow the instructions in our [custom block template](https://github.com/githubnext/composable-github-block-template) repository.
