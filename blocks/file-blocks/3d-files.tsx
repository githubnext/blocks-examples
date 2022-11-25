import { Suspense, useLayoutEffect } from "react";
import { Stage, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { FileBlockProps } from "@githubnext/blocks";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  useLayoutEffect(() => {
    scene.traverse((object) => {
      if (object.type === "Mesh") {
        object.receiveShadow = object.castShadow = true;
      }
    });
  }, []);
  return <primitive object={scene} dispose={null} />;
}

export default function (props: FileBlockProps) {
  const { context } = props;
  const url = `https://raw.githubusercontent.com/${context.owner}/${context.repo}/${context.sha}/${context.path}`;
  return (
    <Canvas shadows style={{ height: "100vh" }}>
      <Suspense fallback={null}>
        <Stage shadows="accumulative">
          <Model url={url} />
        </Stage>
      </Suspense>
      <OrbitControls makeDefault />
    </Canvas>
  );
}
