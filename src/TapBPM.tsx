import React, { useState, useRef } from "react";

interface TapBPMProps {
  onBPMChange: (bpm: number) => void;
}

const TapBPM: React.FC<TapBPMProps> = ({ onBPMChange }) => {
  const [bpm, setBpm] = useState<number | null>(null);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = () => {
    const currentTime = Date.now();

    if (tapTimes.length === 0) {
      setTapTimes([currentTime]);
    } else {
      const newTapTimes = [...tapTimes, currentTime];
      const intervals = newTapTimes.slice(1).map((time, i) => time - newTapTimes[i]);
      const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / averageInterval);

      setTapTimes(newTapTimes);
      setBpm(calculatedBpm);
      onBPMChange(calculatedBpm);

      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      tapTimeoutRef.current = setTimeout(() => {
        setTapTimes([]);
      }, 2000);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!isNaN(value) && value > 0) {
      setBpm(value);
      onBPMChange(value);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginBottom: "20px" }}>
      <button
        onClick={handleTap}
        style={{ marginBottom: "10px", cursor: "pointer", }}
      >
        Tap BPM
      </button>
      <input
        type="number"
        value={bpm !== null ? bpm : ''}
        onChange={handleInputChange}
        placeholder="Enter BPM"
        style={{}}
      />
    </div>
  );
};

export default TapBPM;
