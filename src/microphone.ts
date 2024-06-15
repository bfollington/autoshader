import { atom } from "signia";
import * as THREE from "three";

export const fftTexture = atom("fftTexture", null as THREE.DataTexture | null);

navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then((stream) => {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    // analyser.fftSize = 2048;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount; // Should be 1024
    const waveformArray = new Uint8Array(bufferLength);
    const frequencyArray = new Uint8Array(bufferLength);

    // Create a DataTexture with 512x2 dimensions
    const dataArray = new Uint8Array(512 * 2);
    const previousDataArray = new Uint8Array(512 * 2);
    const texture = new THREE.DataTexture(dataArray, 512, 2, THREE.RedFormat);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    fftTexture.set(texture);

    const smoothingFactor = 0.8; // Higher value means more smoothing

    const updateFFT = () => {
      const length = 512;

      analyser.getByteFrequencyData(frequencyArray);
      analyser.getByteTimeDomainData(waveformArray);

      // Populate frequency data with smoothing
      for (let i = 0; i < length; i++) {
        const currentFrequency = frequencyArray[i];
        const previousFrequency = previousDataArray[i];
        const smoothedFrequency =
          smoothingFactor * previousFrequency +
          (1 - smoothingFactor) * currentFrequency;
        dataArray[i] = smoothedFrequency;
        previousDataArray[i] = smoothedFrequency; // Save the smoothed value
      }

      // Populate waveform data with smoothing
      for (let i = 0; i < length; i++) {
        const currentWaveform = waveformArray[i];
        const previousWaveform = previousDataArray[i + length];
        const smoothedWaveform =
          smoothingFactor * previousWaveform +
          (1 - smoothingFactor) * currentWaveform;
        dataArray[i + length] = smoothedWaveform;
        previousDataArray[i + length] = smoothedWaveform; // Save the smoothed value
      }

      texture.needsUpdate = true;
      requestAnimationFrame(updateFFT);
    };

    updateFFT();
  })
  .catch((error) => {
    console.error("Error accessing microphone:", error);
  });
