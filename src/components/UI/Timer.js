import React, { useEffect, useState } from 'react';

function Timer({ 
  seconds, 
  isRunning, 
  onComplete,
  size = 'md',
  showWarning = true,
  className = ''
}) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  
  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);
  
  useEffect(() => {
    let timer;
    
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            if (onComplete) onComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onComplete]);
  
  // 残り時間の表示形式
  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // サイズに応じたスタイル
  const sizeStyles = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };
  
  // 残り時間が少ない場合の警告表示
  const getColorClass = () => {
    if (!showWarning) return 'text-blue-700';
    
    if (timeLeft <= 10) return 'text-red-600 animate-pulse';
    if (timeLeft <= 30) return 'text-orange-500';
    return 'text-blue-700';
  };
  
  return (
    <div className={`timer font-mono font-bold ${sizeStyles[size]} ${getColorClass()} ${className}`}>
      {formatTime(timeLeft)}
    </div>
  );
}

export default Timer;
