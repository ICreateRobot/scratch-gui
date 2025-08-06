import React, { useEffect, useRef } from 'react';
import styles from './BurnLogs.css'; // 用 CSS Module 命名规范

const BurnLogs = ({ isLoading, logs }) => {
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isLoading) return null;

  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.logBox}>
        {logs.map((log, index) => (
          <div key={index} className={styles.logLine}>{log}</div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default BurnLogs;
