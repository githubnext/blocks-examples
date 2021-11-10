import { Suspense, useRef } from "react";
import { useGLTF } from "@react-three/drei/index.cjs";
import { Canvas, useStore } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

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

export function Viewer(props: FileViewerProps) {
  const { meta } = props;

  return (
    <Canvas style={{ height: "100%" }}>
      <ambientLight />
      <LControl />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null}>
        <Model url={meta.download_url} />
      </Suspense>
    </Canvas>
  );
}
