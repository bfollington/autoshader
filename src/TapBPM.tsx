import React, { useState, useRef, useEffect } from "react";
import { atom } from "signia";
import { useValue } from "signia-react";

export const bpm = atom('bpm', 120)

interface TapBPMProps {
}

const TapBPM: React.FC<TapBPMProps> = () => {
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [dotPulse, setDotPulse] = useState<boolean>(false);

  const currentBpm = useValue(bpm)

  useEffect(() => {
    if (currentBpm !== null) {
      const interval = 60000 / currentBpm;
      const pulseInterval = setInterval(() => {
        setDotPulse(true);
        setTimeout(() => setDotPulse(false), interval / 2);
      }, interval);

      return () => clearInterval(pulseInterval);
    }
  }, [currentBpm]);

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
      bpm.set(calculatedBpm);

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
      bpm.set(value);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <input
        type="number"
        style={{ width: "50px" }}
        value={currentBpm !== null ? currentBpm : ''}
        onChange={handleInputChange}
        placeholder="BPM"
      />
      <button
        onClick={handleTap}
        style={{ cursor: "pointer" }}
      >
        Tap BPM
      </button>

      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: dotPulse ? "red" : "gray",
          marginLeft: "10px",
          transition: "background 0.1s"
        }}
      ></div>
    </div>
  );
};

export default TapBPM;
