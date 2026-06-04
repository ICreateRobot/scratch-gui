
import React from 'react';
import useStore from '../../stores/useStore.js';
import styles from './Preview.css';

const Preview = () => {
    const {
        isRunning,
        serverUrl,
        qrCodeUrl,
        stopPreview
    } = useStore();

    if (!isRunning) {
        return null;
    }

    return (
        <div className={styles.previewOverlay}>
            <div className={styles.previewModal}>
                <div className="preview-header">
                    <h2>手机预览</h2>
                    <button className={styles.closeBtn} onClick={stopPreview}>×</button>
                </div>

                <div className={styles.previewContent}>
                    <div className={styles.qrSection}>
                        <h3>扫描二维码在手机上预览</h3>
                        {qrCodeUrl && (
                            <img src={qrCodeUrl} alt="预览二维码" className={styles.qrCode} />
                        )}
                        <p className={styles.urlText}>{serverUrl}</p>
                    </div>

                    <div className={styles.instructions}>
                        <h4>使用说明：</h4>
                        <ul>
                            <li>确保手机和电脑在同一WiFi网络</li>
                            <li>使用手机浏览器扫描二维码</li>
                            <li>可以实时操作开关、按钮、滑块等组件</li>
                            {/* <li>操作结果会同步到编辑界面</li> */}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Preview;
