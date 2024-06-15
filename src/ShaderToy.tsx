import React, { useRef, useEffect } from "react";
import { atom } from "signia";
import { useValue } from "signia-react";
import * as THREE from "three";
import { videoTexture } from "./webcam";
import { fftTexture } from "./microphone";

interface ShaderToyProps {
  fragmentShader: string;
  bpm: number;
}

const ShaderToy: React.FC<ShaderToyProps> = ({ fragmentShader, bpm }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const webcam = useValue(videoTexture);
  const microphone = useValue(fftTexture);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer();
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const uniforms = {
      iTrueTime: { value: 0 },
      iBpm: { value: bpm },
      iResolution: {
        value: new THREE.Vector3(
          container.clientWidth,
          container.clientHeight,
          1,
        ),
      },
      iMouse: { value: new THREE.Vector2() },
      iChannel0: { value: webcam },
      iChannel1: { value: microphone },
    }

    const material = new THREE.ShaderMaterial({
      fragmentShader: `
        uniform float iTrueTime;
        uniform float iBpm;
        uniform vec3 iResolution;
        uniform vec2 iMouse;
        uniform sampler2D iChannel0;
        uniform sampler2D iChannel1;

        float iTime;
        float alt,lt,atr,tr;
        int bt;
        vec2 asp,asp2;
        void settime(float t)
        {
            alt = lt = t;
            atr = fract(lt);
            tr = tanh(atr * 5.);
            bt = int(lt);
            lt = tr + float(bt);
        }

        ${fragmentShader}

        void main() {
          settime(iTrueTime*iBpm/60.);
          iTime = lt;
          mainImage(gl_FragColor, gl_FragCoord.xy);
          gl_FragColor.a = 1.0;
        }
      `,
      uniforms,
    });

    const plane = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(plane, material);
    scene.add(mesh);

    const animate = () => {
      uniforms.iTrueTime.value = performance.now() / 1000.0;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (container && rendererRef.current) {
        const { clientWidth, clientHeight } = container;
        renderer.setSize(clientWidth, clientHeight);
        uniforms.iResolution.value.set(clientWidth, clientHeight, 1);
      }
    };
    const handleMouseMove = (event: MouseEvent) => {
      if (container) {
        const rect = container.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        uniforms.iMouse.value.set(mouseX, mouseY);
      }
    };

    window.addEventListener("resize", handleResize);
    container.addEventListener("mousemove", handleMouseMove);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [fragmentShader, bpm, webcam, microphone]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      ></div>
      <button onClick={toggleFullScreen} style={{
        position: "absolute",
        top: 0,
        right: 0,
        display: "flex",
        zIndex: 20,
        color: "white",
        border: "none",
        cursor: "pointer",
      }}>👁️</button>
    </div>
  );
};

export default ShaderToy;
