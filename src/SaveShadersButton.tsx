import React, { useState } from 'react';
import { useValue } from 'signia-react';
import { shaders } from './App';

const SaveShadersButton: React.FC = () => {
  const [filename, setFilename] = useState('');
  const currentShaders = useValue(shaders)

  const saveToFile = () => {
    if (!filename) {
      alert('Please enter a filename.');
      return;
    }
    const dataStr = JSON.stringify(currentShaders, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter filename"
        value={filename}
        onChange={(e) => setFilename(e.target.value)}
      />
      <button onClick={saveToFile}>Save Session</button>
    </div>
  );
};

export default SaveShadersButton;
