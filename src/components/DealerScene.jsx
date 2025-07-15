import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { OrbitControls } from "@react-three/drei";
import Dealer from "./Dealer";
import Table from "./Table";

export default function DealerScene() {
    return(
        <div className="threeDmodel"
        style={{
            position: "relative",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vw",
            pointerEvents: "none",
            zIndex: 0,
            }}
        >
            <Canvas camera={{position: [0, 8, 6], fov: 55 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <Suspense fallback={null}>
                   <Table />
                    <Dealer animationName="Idle" />
                </Suspense>
                <OrbitControls 
                enableZoom={false}
                enableRotate={false}
                enablePan={false}
                target={[-4, 2, 70]}
                />
            </Canvas>
        </div>
    );
}