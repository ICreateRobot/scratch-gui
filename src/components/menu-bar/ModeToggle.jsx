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



// import React, { useRef, useLayoutEffect, useState } from 'react';
// import { FormattedMessage } from 'react-intl';
// import styles from './ModeToggle.css'

// const ModeToggle = ({ value, onChange }) => {
//     const isInteractive = (value === 'interactive');

//     const handleToggle = async() => {
//         const newMode = isInteractive ? 'upload' : 'interactive';
//         onChange(newMode); // 不改原有逻辑
//     };

//     // ===== 新增：用于测量文字宽度 =====
//     const onlineRef = useRef(null);
//     const downloadRef = useRef(null);
//     const [sizes, setSizes] = useState({ online: 0, download: 0 });

//     useLayoutEffect(() => {
//         if (onlineRef.current && downloadRef.current) {
//             setSizes({
//                 online: onlineRef.current.offsetWidth,
//                 download: downloadRef.current.offsetWidth,
//             });
//         }
//     }, []);

//     return (
//         <div style={{ display: 'flex', alignItems: 'center' }}>
//             <span style={{ marginRight: '10px', color: 'white', fontWeight: 'bold' }}>
//                 <FormattedMessage
//                     defaultMessage="模式"
//                     description="Button in menu bar under settings to open desktop app settings"
//                     id="gui.model.name"
//                 />
//             </span>

//             <div
//                 className={styles.container}
//                 style={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     height: '30px',
//                     borderRadius: '10px',
//                     // backgroundColor: '#78d6ac',
//                     cursor: 'pointer',
//                     position: 'relative',
//                     padding: '3px',
//                     width: sizes.online + sizes.download + 12-8, // 根据文字自动撑开
//                 }}
//                 onClick={handleToggle}
//             >
//                 {/* 滑块 */}
//                 <div
//                     style={{
//                         position: 'absolute',
//                         top: '3px',
//                         left: isInteractive
//                             ? '3px'
//                             : sizes.online + 6 + 'px',
//                         width: isInteractive
//                             ? sizes.online + 'px'
//                             : sizes.download + 'px',
//                         height: '30px',
//                         backgroundColor: 'white',
//                         borderRadius: '10px',
//                         transition: 'all 0.3s ease',
//                         zIndex: 1,
//                     }}
//                 />

//                 {/* 互动 */}
//                 <div
//                     ref={onlineRef}
//                     style={{
//                         padding: '0 14px',
//                         textAlign: 'center',
//                         color: isInteractive ? '#000' : '#eee',
//                         zIndex: 2,
//                         fontWeight: 'bold',
//                         fontSize: '14px',
//                         whiteSpace: 'nowrap',
//                         height:'100%',
//                         display: 'flex',
//                         alignItems: 'center',
//                     }}
//                 >
//                     <FormattedMessage
//                         defaultMessage="互动"
//                         description="Button in menu bar under settings to open desktop app settings"
//                         id="gui.model.online"
//                     />
//                 </div>

//                 {/* 下载 */}
//                 <div
//                     ref={downloadRef}
//                     style={{
//                         padding: '0 14px',
//                         textAlign: 'center',
//                         color: isInteractive ? '#eee' : '#000',
//                         zIndex: 2,
//                         fontWeight: 'bold',
//                         fontSize: '14px',
//                         whiteSpace: 'nowrap',
//                         height:'100%',
//                         display: 'flex',
//                         alignItems: 'center',
//                     }}
//                 >
//                     <FormattedMessage
//                         defaultMessage="下载"
//                         description="Button in menu bar under settings to open desktop app settings"
//                         id="gui.model.download"
//                     />
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ModeToggle;


import React from 'react';
import { FormattedMessage } from 'react-intl';

import interactiveImg from './interactive.svg';
import uploadImg from './upload.svg';
import iotBn from './iotBn.svg'

const ModeToggle = ({ value, onChange }) => {

    const modes = [
        { id: 'interactive', icon: interactiveImg },
        { id: 'upload', icon: uploadImg },
        // { id: 'iot', icon: iotBn }
    ];
    

    const getLeftPosition = () => {
        const index = modes.findIndex(m => m.id === value);
        return `calc(${index * 100 / modes.length}% + 3px)`;
    };

    const handleClick = (mode) => {
        if (mode === value) return;
        console.log(mode)
        onChange(mode); // ✅ 保留你原逻辑
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* 标题 */}
            <span style={{
                marginRight: '10px',
                color: 'white',
                fontWeight: 'bold'
            }}>
                <FormattedMessage
                    defaultMessage="模式"
                    id="gui.model.name"
                />
            </span>

            {/* 外层容器（完全照抄参考样式） */}
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '160px', // 两等分（原来150是三等分）
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--ic-main-light-very)',
                    // backgroundColor:'white',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                }}
            >
                {/* 滑块 */}
                <div
                    style={{
                        position: 'absolute',
                        top: '3px',
                        left: getLeftPosition(),
                        width: `calc(${100 / modes.length}% - 6px)`,
                        height: '26px',
                        backgroundColor: 'var(--ic-main)',
                        borderRadius: '6px',
                        transition: 'all 0.3s ease',
                        zIndex: 1,
                    }}
                />

                {modes.map((mode) => (
                    <div
                        key={mode.id}
                        onClick={() => handleClick(mode.id)}
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            zIndex: 2,
                            color: value === mode.id ? '#000' : '#eee',
                            transition: 'color 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <img
                            src={mode.icon}
                            style={{
                                width: 20,
                                height: 20,
                                filter: value === mode.id
                                    ? 'none'
                                    : 'brightness(0.6)',
                                transition: 'filter .2s',
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ModeToggle;