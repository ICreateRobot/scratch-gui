// import React, { useState } from 'react';
// import {FormattedMessage} from 'react-intl';

// const ModeToggle = ({ value, onChange }) => {
//     const isInteractive = (value === 'interactive');

//     const handleToggle = () => {
//         const newMode = isInteractive ? 'upload' : 'interactive';
//         onChange(newMode); // 通知父组件请求切换
//     };

//     return (
//         <div style={{ display: 'flex', alignItems: 'center' }}>
//             <span style={{ marginRight: '10px', color: 'white', fontWeight: 'bold' }}>
//                   <FormattedMessage
//                         defaultMessage='模式'
//                         description="Button in menu bar under settings to open desktop app settings"
//                         id="gui.model.name"
//                     />
//             </span>

//             <div
//                 style={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     width: '150px',
//                     height: '30px',
//                     borderRadius: '10px',
//                     backgroundColor: '#78d6ac',
//                     // padding: '3px',
//                     cursor: 'pointer',
//                     position: 'relative',
//                 }}
//                 onClick={handleToggle}
//             >
//                 <div
//                     style={{
//                         position: 'absolute',
//                         top: '3px',
//                         left: isInteractive ? '3px' : 'calc(50% + 1px)',
//                         width: 'calc(50% - 6px)',
//                         height: '26px',
//                         backgroundColor: 'white',
//                         borderRadius: '10px',
//                         transition: 'all 0.3s ease',
//                         zIndex: 1,
//                     }}
//                 />
//                 <div
//                     style={{
//                         flex: 1,
//                         textAlign: 'center',
//                         color: isInteractive ? '#000' : '#eee',
//                         zIndex: 2,
//                         fontWeight: 'bold',
//                         fontSize: '14px',
//                     }}
//                 >
//                     <FormattedMessage
//                         defaultMessage='互动'
//                         description="Button in menu bar under settings to open desktop app settings"
//                         id="gui.model.online"
//                     />
//                 </div>
//                 <div
//                     style={{
//                         flex: 1,
//                         textAlign: 'center',
//                         color: isInteractive ? '#eee' : '#000',
//                         zIndex: 2,
//                         fontWeight: 'bold',
//                         fontSize: '14px',
//                     }}
//                 >
//                     <FormattedMessage
//                         defaultMessage='下载'
//                         description="Button in menu bar under settings to open desktop app settings"
//                         id="gui.model.download"
//                     />
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ModeToggle;



import React, { useRef, useLayoutEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import styles from './ModeToggle.css'

const ModeToggle = ({ value, onChange }) => {
    const isInteractive = (value === 'interactive');

    const handleToggle = async() => {
        const newMode = isInteractive ? 'upload' : 'interactive';
        onChange(newMode); // 不改原有逻辑
    };

    // ===== 新增：用于测量文字宽度 =====
    const onlineRef = useRef(null);
    const downloadRef = useRef(null);
    const [sizes, setSizes] = useState({ online: 0, download: 0 });

    useLayoutEffect(() => {
        if (onlineRef.current && downloadRef.current) {
            setSizes({
                online: onlineRef.current.offsetWidth,
                download: downloadRef.current.offsetWidth,
            });
        }
    }, []);

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px', color: 'white', fontWeight: 'bold' }}>
                <FormattedMessage
                    defaultMessage="模式"
                    description="Button in menu bar under settings to open desktop app settings"
                    id="gui.model.name"
                />
            </span>

            <div
                className={styles.container}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '30px',
                    borderRadius: '10px',
                    // backgroundColor: '#78d6ac',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '3px',
                    width: sizes.online + sizes.download + 12-8, // 根据文字自动撑开
                }}
                onClick={handleToggle}
            >
                {/* 滑块 */}
                <div
                    style={{
                        position: 'absolute',
                        top: '3px',
                        left: isInteractive
                            ? '3px'
                            : sizes.online + 6 + 'px',
                        width: isInteractive
                            ? sizes.online + 'px'
                            : sizes.download + 'px',
                        height: '30px',
                        backgroundColor: 'white',
                        borderRadius: '10px',
                        transition: 'all 0.3s ease',
                        zIndex: 1,
                    }}
                />

                {/* 互动 */}
                <div
                    ref={onlineRef}
                    style={{
                        padding: '0 14px',
                        textAlign: 'center',
                        color: isInteractive ? '#000' : '#eee',
                        zIndex: 2,
                        fontWeight: 'bold',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        height:'100%',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <FormattedMessage
                        defaultMessage="互动"
                        description="Button in menu bar under settings to open desktop app settings"
                        id="gui.model.online"
                    />
                </div>

                {/* 下载 */}
                <div
                    ref={downloadRef}
                    style={{
                        padding: '0 14px',
                        textAlign: 'center',
                        color: isInteractive ? '#eee' : '#000',
                        zIndex: 2,
                        fontWeight: 'bold',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        height:'100%',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <FormattedMessage
                        defaultMessage="下载"
                        description="Button in menu bar under settings to open desktop app settings"
                        id="gui.model.download"
                    />
                </div>
            </div>
        </div>
    );
};

export default ModeToggle;
