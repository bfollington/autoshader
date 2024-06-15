import React, { useRef } from 'react';
import { shaders } from './App';

const LoadShadersButton: React.FC = () => {
  const inputFileRef = useRef<HTMLInputElement>(null);

  const loadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return;
      const loadedShaders = JSON.parse(e.target.result as string) as string[];
      shaders.set(loadedShaders)
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <input
        type="file"
        ref={inputFileRef}
        style={{ display: 'none' }}
        onChange={loadFromFile}
        accept="application/json"
      />
      <button onClick={() => inputFileRef.current?.click()}>Load Session</button>
    </div>
  );
};

export default LoadShadersButton;
