import { useGLTF } from "@react-three/drei";
import { useRef } from "react";

export default function Table() {
    const ref = useRef();
    const {scene} = useGLTF("./models/table.glb");

    return(
        <primitive ref={ref} 
        object={scene} 
        scale={2}  
        position={[-5, -21, 50]}
        />
    );
}