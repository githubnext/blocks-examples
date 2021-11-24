import { Suspense, useRef } from "react";
import { PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Canvas, useStore } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { FileBlockProps } from "@githubnext/utils";

const LControl = () => {
  // @ts-ignore
  const dom = useStore((state) => state.dom);
  const control = useRef(null);

  // @ts-ignore
  return <OrbitControls ref={control} domElement={dom.current} />;
};

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function (props: FileBlockProps) {
  const { context } = props;

  const url = `https://raw.githubusercontent.com/${context.owner}/${context.repo}/${context.sha}/${context.path}`;

  return (
    <Canvas style={{ height: "100vh" }}>
      {/*
        // @ts-ignore */}
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 0.3]}
        near={0.01}
        far={1000}
      />
      <ambientLight />
      <LControl />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null}>
        <Model url={url} />
      </Suspense>
    </Canvas>
  );
}
