import React, { useState, useRef, useEffect } from "react";

interface TapBPMProps {
  onBPMChange: (bpm: number) => void;
}

const TapBPM: React.FC<TapBPMProps> = ({ onBPMChange }) => {
  const [bpm, setBpm] = useState<number>(120);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [dotPulse, setDotPulse] = useState<boolean>(false);

  useEffect(() => {
    if (bpm !== null) {
      const interval = 60000 / bpm;
      const pulseInterval = setInterval(() => {
        setDotPulse(true);
        setTimeout(() => setDotPulse(false), interval / 2);
      }, interval);

      return () => clearInterval(pulseInterval);
    }
  }, [bpm]);

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
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <input
        type="number"
        style={{ width: "50px" }}
        value={bpm !== null ? bpm : ''}
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
