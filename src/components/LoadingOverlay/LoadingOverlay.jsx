import React, { useState, useEffect } from 'react';
import styles from './LoadingOverlay.css'; // 这里要确保你的样式文件引入正确

const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null; // 如果 isLoading 为 false，不渲染 LoadingOverlay

  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.spinner}></div>
    </div>
  );
};

export default LoadingOverlay;