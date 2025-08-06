import React, { useState } from 'react';
import {FormattedMessage} from 'react-intl';

const ModeToggle = ({ value, onChange }) => {
    const isInteractive = (value === 'interactive');

    const handleToggle = () => {
        const newMode = isInteractive ? 'upload' : 'interactive';
        onChange(newMode); // 通知父组件请求切换
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px', color: 'white', fontWeight: 'bold' }}>
                  <FormattedMessage
                        defaultMessage='模式'
                        description="Button in menu bar under settings to open desktop app settings"
                        id="gui.model.name"
                    />
            </span>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '150px',
                    height: '30px',
                    borderRadius: '10px',
                    backgroundColor: '#78d6ac',
                    // padding: '3px',
                    cursor: 'pointer',
                    position: 'relative',
                }}
                onClick={handleToggle}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '3px',
                        left: isInteractive ? '3px' : 'calc(50% + 1px)',
                        width: 'calc(50% - 6px)',
                        height: '26px',
                        backgroundColor: 'white',
                        borderRadius: '10px',
                        transition: 'all 0.3s ease',
                        zIndex: 1,
                    }}
                />
                <div
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        color: isInteractive ? '#000' : '#eee',
                        zIndex: 2,
                        fontWeight: 'bold',
                        fontSize: '14px',
                    }}
                >
                    <FormattedMessage
                        defaultMessage='互动'
                        description="Button in menu bar under settings to open desktop app settings"
                        id="gui.model.online"
                    />
                </div>
                <div
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        color: isInteractive ? '#eee' : '#000',
                        zIndex: 2,
                        fontWeight: 'bold',
                        fontSize: '14px',
                    }}
                >
                    <FormattedMessage
                        defaultMessage='下载'
                        description="Button in menu bar under settings to open desktop app settings"
                        id="gui.model.download"
                    />
                </div>
            </div>
        </div>
    );
};

export default ModeToggle;
