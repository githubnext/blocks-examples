import { Suspense, useRef, useState, useEffect } from "react";
import { tw } from "twind";
import { PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Canvas, useLoader, useStore } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { FileBlockProps } from "@githubnext/blocks";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const LControl = () => {
  // @ts-ignore
  const dom = useStore((state) => state.dom);
  const control = useRef(null);

  // @ts-ignore
  return <OrbitControls ref={control} domElement={dom.current} />;
};

function Model({ url }: { url: string }) {
  // need to load gltf model this way instead of with hook
  // or you get an infinite loop on the production sandbox side
  const { scene } = useLoader(GLTFLoader, url);
  return <primitive object={scene} dispose={null} />;
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
