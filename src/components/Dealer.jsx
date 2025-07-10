 import { useGLTF, useAnimations } from "@react-three/drei";
import { useRef, useEffect } from "react";

export default function Dealer({ animationName = "Idle" }) {
  const group = useRef();
  const { scene, animations } = useGLTF("./models/dealer.glb");
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (!actions || !actions[animationName]) {
      console.warn(`Animation ${animationName} not found`);
      return;
    }
    actions[animationName].reset().fadeIn(0.5).play();
    return () => {
      if (actions[animationName]) actions[animationName].fadeOut(0.5);
    };
  }, [actions, animationName]);

  return <primitive ref={group} object={scene} scale={1.5} position={[-5, -25, 5]} />;
}
