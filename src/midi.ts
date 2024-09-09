import { bpm } from "./TapBPM";

async function initializeMIDI() {
  if (navigator.requestMIDIAccess) {
    try {
      const midiAccess = await navigator.requestMIDIAccess();
      handleMIDIConnection(midiAccess);
    } catch (error) {
      console.error("Failed to get MIDI access:", error);
    }
  } else {
    console.error("WebMIDI is not supported in this browser.");
  }
}

function handleMIDIConnection(midiAccess: MIDIAccess) {
  const inputs = midiAccess.inputs.values();
  for (const input of inputs) {
    input.onmidimessage = handleMIDIMessage;
  }
}

let clockCount = 0;
let startTime: number | null = null;
const CLOCKS_PER_BEAT = 24;

function handleMIDIMessage(message: MIDIMessageEvent) {
  if (message?.data?.[0] === 0xf8) {
    // MIDI Clock message
    if (startTime === null) {
      startTime = performance.now();
    }
    clockCount++;
    if (clockCount >= CLOCKS_PER_BEAT) {
      const currentTime = performance.now();
      const timeElapsed = (currentTime - startTime) / 1000; // in seconds
      const midiBpm = (60 / timeElapsed) * (clockCount / CLOCKS_PER_BEAT);
      console.log("Current BPM:", midiBpm);
      const rounded = Math.round(midiBpm);
      if (rounded !== bpm.value) {
        bpm.set(rounded);
      }
      clockCount = 0;
      startTime = currentTime;
    }
  }
}

initializeMIDI();
