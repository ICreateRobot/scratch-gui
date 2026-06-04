import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

/**
 * 组件渲染器，用于渲染各种类型的UI组件
 * @param {Object} component - 组件配置对象
 * @param {Function} onInteraction - 组件交互回调函数
 */
const ComponentRenderer = ({ component, onInteraction }) => {
    // 本地状态管理
    const [joystickPosition, setJoystickPosition] = useState({
        x: 0,
        y: 0,
        isDragging: false
    });
    const chartRefs = useRef({});

    // 处理鼠标和触摸事件的释放
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (joystickPosition.isDragging) {
                if (component.returnToCenter) {
                    setJoystickPosition({ x: 0, y: 0, isDragging: false });
                    if (onInteraction) {
                        onInteraction({
                            xValue: 0,
                            yValue: 0,
                            x: 0,
                            y: 0
                        });
                    }
                } else {
                    setJoystickPosition(prev => ({ ...prev, isDragging: false }));
                }
            }
        };

        if (component.type === 'joystick') {
            window.addEventListener('mouseup', handleGlobalMouseUp);
            window.addEventListener('touchend', handleGlobalMouseUp);

            return () => {
                window.removeEventListener('mouseup', handleGlobalMouseUp);
                window.removeEventListener('touchend', handleGlobalMouseUp);
            };
        }
    }, [component.type, component.returnToCenter, joystickPosition.isDragging, onInteraction]);

    // 获取图表数据
    const getChartData = () => {
        if (!component.data || !Array.isArray(component.data)) {
            return [
                { name: '数据1', value: 40 },
                { name: '数据2', value: 60 },
                { name: '数据3', value: 80 }
            ];
        }
        return component.data;
    };

    // 生成ECharts配置
    const getEChartsOption = (type) => {
        const data = getChartData();
        const color = component.color || '#3498db';

        const commonOption = {
            backgroundColor: 'transparent',
            tooltip: {
                show: component.showTooltip !== false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#333',
                textStyle: {
                    color: '#fff',
                    fontSize: 12
                }
            },
            grid: {
                left: component.showYAxis ? '10%' : '5%',
                right: '5%',
                bottom: component.showXAxis ? '15%' : '5%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                show: component.showXAxis !== false,
                type: 'category',
                data: data.map(item => item.name),
                axisLine: {
                    lineStyle: {
                        color: '#fff'
                    }
                },
                axisLabel: {
                    color: '#fff',
                    fontSize: 10
                },
                name: component.xAxisName || '',
                nameTextStyle: {
                    color: '#fff',
                    fontSize: 10
                }
            },
            yAxis: {
                show: component.showYAxis !== false,
                type: 'value',
                axisLine: {
                    lineStyle: {
                        color: '#fff'
                    }
                },
                axisLabel: {
                    color: '#fff',
                    fontSize: 10
                },
                splitLine: {
                    show: component.showGrid !== false,
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.2)',
                        type: 'dashed'
                    }
                },
                name: component.yAxisName || '',
                nameTextStyle: {
                    color: '#fff',
                    fontSize: 10
                }
            }
        };

        switch (type) {
            case 'barChart':
                return {
                    ...commonOption,
                    series: [{
                        type: 'bar',
                        data: data.map(item => item.value),
                        itemStyle: {
                            color: color,
                            borderRadius: component.barRadius || 0
                        },
                        barWidth: component.barSize ? `${component.barSize}%` : '40%'
                    }]
                };
            case 'lineChart':
                return {
                    ...commonOption,
                    series: [{
                        type: 'line',
                        data: data.map(item => item.value),
                        itemStyle: {
                            color: color
                        },
                        lineStyle: {
                            color: color,
                            width: component.strokeWidth || 2
                        },
                        symbol: component.showPoints !== false ? 'circle' : 'none',
                        symbolSize: 6,
                        smooth: component.lineType === 'monotone' || component.lineType === 'smooth'
                    }]
                };
            case 'pieChart':
                return {
                    backgroundColor: 'transparent',
                    tooltip: {
                        show: component.showTooltip !== false,
                        formatter: '{b}: {c} ({d}%)'
                    },
                    series: [{
                        type: 'pie',
                        radius: component.innerRadius ?
                            [`${component.innerRadius}%`, component.outerRadius || '80%'] :
                            (component.outerRadius || '80%'),
                        data: data.map((item, index) => ({
                            name: item.name,
                            value: item.value,
                            itemStyle: {
                                color: item.color || color
                            }
                        })),
                        label: {
                            show: component.showLabel !== false,
                            color: '#fff',
                            fontSize: 10,
                            formatter: (params) => {
                                if (component.showPercentage) {
                                    return `${params.name}: ${params.percent}%`;
                                }
                                return params.name;
                            }
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: 12,
                                fontWeight: 'bold'
                            }
                        }
                    }]
                };
            default:
                return {};
        }
    };

    // 辅助函数：获取应用透明后的颜色
    const getColorWithTransparency = (colorProp, transparentProp) => {
        const isTransparent = component[transparentProp];
        const color = component[colorProp];

        if (isTransparent) {
            return 'transparent';
        }
        return color || getDefaultColor(colorProp);
    };

    // 辅助函数：获取默认颜色
    const getDefaultColor = (colorProp) => {
        const defaults = {
            color: '#ffffff',
            backgroundColor: '#000000',
            borderColor: '#2980b9',
            strokeColor: '#ffffff',
            fillColor: '#3498db',
            onColor: '#4CAF50'
        };
        return defaults[colorProp] || '#000000';
    };

    const renderComponent = () => {
        const baseStyle = {
            width: '100%',
            height: '100%',
            position: 'relative',
            boxSizing: 'border-box'
        };

        if (!component.type) {
            return (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ff4757',
                    color: 'white',
                    fontSize: '12px',
                    ...baseStyle
                }}>
                    未知组件类型
                </div>
            );
        }

        switch (component.type) {
            case 'title':
                return (
                    <div
                        className="component-title"
                        style={{
                            ...baseStyle,
                            fontSize: `${component.fontSize || 14}px`,
                            color: getColorWithTransparency('color', 'colorTransparent'),
                            backgroundColor: getColorWithTransparency('backgroundColor', 'backgroundColorTransparent'),
                            fontWeight: component.fontWeight || 'bold',
                            textAlign: component.textAlign || 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px'
                        }}
                    >
                        {component.text || '标题'}
                    </div>
                );

            case 'label':
                return (
                    <div
                        className="component-label"
                        style={{
                            ...baseStyle,
                            fontSize: `${component.fontSize || 12}px`,
                            color: getColorWithTransparency('color', 'colorTransparent'),
                            backgroundColor: getColorWithTransparency('backgroundColor', 'backgroundColorTransparent'),
                            fontWeight: component.fontWeight || 'normal',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            textAlign: 'center'
                        }}
                    >
                        {component.text || '标签'}
                    </div>
                );

            case 'rectangle':
                return (
                    <div
                        className="component-rectangle"
                        style={{
                            ...baseStyle,
                            backgroundColor: getColorWithTransparency('backgroundColor', 'backgroundColorTransparent'),
                            border: component.borderColorTransparent ? 'none' : `2px solid ${component.borderColor || '#2980b9'}`
                        }}
                    />
                );

            case 'circle':
                return (
                    <div
                        className="component-circle"
                        style={{
                            ...baseStyle,
                            backgroundColor: getColorWithTransparency('backgroundColor', 'backgroundColorTransparent'),
                            border: component.borderColorTransparent ? 'none' : `2px solid ${component.borderColor || '#c0392b'}`,
                            borderRadius: '50%'
                        }}
                    />
                );

            case 'line':
                return (
                    <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="100%" height="100%">
                            <line
                                x1="0%"
                                y1="50%"
                                x2="100%"
                                y2="50%"
                                stroke={getColorWithTransparency('strokeColor', 'strokeColorTransparent')}
                                strokeWidth={component.strokeWidth || 2}
                            />
                        </svg>
                    </div>
                );

            case 'image':
                return component.src ? (
                    <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                            src={component.src}
                            alt="组件图片"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                ) : (
                    <div style={{
                        ...baseStyle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#7f8c8d',
                        color: 'white',
                        fontSize: '10px'
                    }}>
                        图片
                    </div>
                );

            case 'text':
                return (
                    <div
                        className="component-text"
                        style={{
                            ...baseStyle,
                            fontSize: `${component.fontSize || 12}px`,
                            color: getColorWithTransparency('color', 'colorTransparent'),
                            backgroundColor: getColorWithTransparency('backgroundColor', 'backgroundColorTransparent'),
                            fontWeight: component.fontWeight || 'normal',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            textAlign: 'center'
                        }}
                    >
                        {component.text || '文本'}
                    </div>
                );

            case 'button':
                return (
                    <button
                        className={`component-button ${component.pressed ? 'pressed' : ''}`}
                        style={{
                            ...baseStyle,
                            fontSize: `${component.fontSize || 12}px`,
                            color: getColorWithTransparency('color', 'colorTransparent'),
                            backgroundColor: getColorWithTransparency('backgroundColor', 'backgroundColorTransparent'),
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {component.text || '按钮'}
                    </button>
                );

            case 'switch':
                const isOn = component.value;
                const bgColor = isOn
                    ? getColorWithTransparency('onColor', 'onColorTransparent')
                    : getColorWithTransparency('backgroundColor', 'backgroundColorTransparent');

                return (
                    <div
                        className={`component-switch ${isOn ? 'on' : 'off'}`}
                        style={{
                            ...baseStyle,
                            backgroundColor: bgColor,
                            cursor: 'pointer',
                            position: 'relative',
                            borderRadius: '20px',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <div
                            style={{
                                width: 'calc(50% - 4px)',
                                height: 'calc(100% - 4px)',
                                backgroundColor: '#ffffff',
                                borderRadius: '50%',
                                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isOn ? 'translateX(calc(100% + 4px))' : 'translateX(0)',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                position: 'absolute',
                                left: '2px'
                            }}
                        />
                    </div>
                );

            case 'slider':
                const sliderValue = component.value || 0;
                const sliderMin = component.min || 0;
                const sliderMax = component.max || 100;
                const fillPercent = ((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100;
                const fillColor = component.fillColorTransparent
                    ? 'transparent'
                    : (component.fillColor || '#3498db');

                return (
                    <div
                        className="component-slider"
                        style={{
                            ...baseStyle,
                            padding: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        <input
                            type="range"
                            min={sliderMin}
                            max={sliderMax}
                            value={sliderValue}
                            readOnly
                            style={{
                                width: '90%',
                                WebkitAppearance: 'none',
                                height: '8px',
                                borderRadius: '4px',
                                outline: 'none',
                                cursor: 'pointer',
                                background: `linear-gradient(to right, ${fillColor} ${fillPercent}%, #2c3e50 ${fillPercent}%)`
                            }}
                        />
                        <div style={{
                            textAlign: 'center',
                            color: '#fff',
                            fontSize: '12px',
                            marginTop: '8px',
                            fontWeight: 'bold'
                        }}>
                            {sliderValue}
                        </div>
                    </div>
                );

            case 'barChart':
            case 'lineChart':
            case 'pieChart':
                return (
                    <div style={{
                        ...baseStyle,
                        minWidth: '60px',
                        minHeight: '60px',
                        padding: '4px'
                    }}>
                        <ReactECharts
                            option={getEChartsOption(component.type)}
                            style={{ width: '100%', height: '100%' }}
                            notMerge={true}
                            lazyUpdate={true}
                            theme="dark"
                            onChartReady={(echartsInstance) => {
                                chartRefs.current[component.id] = echartsInstance;
                            }}
                        />
                    </div>
                );

            case 'gauge':
                const gaugeValue = component.value || 0;
                const gaugeMin = component.min || 0;
                const gaugeMax = component.max || 100;
                const startAngle = 135;
                const endAngle = 45;
                const totalAngle = endAngle - startAngle;
                const gaugePercent = Math.min(1, Math.max(0, (gaugeValue - gaugeMin) / (gaugeMax - gaugeMin)));
                const needleAngle = startAngle + gaugePercent * (360 + totalAngle);
                const gaugeColor = getColorWithTransparency('color', 'colorTransparent');

                return (
                    <div style={{
                        ...baseStyle,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'relative',
                            width: '90%',
                            height: '90%',
                            borderRadius: '50%',
                            border: '10px solid #2c3e50',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '-5px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '20%',
                                height: '15%',
                                backgroundColor: 'transparent'
                            }}>
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'transparent',
                                    borderBottom: '10px solid #2c3e50',
                                    borderLeft: '10px solid transparent',
                                    borderRight: '10px solid transparent'
                                }} />
                            </div>

                            <div style={{
                                position: 'absolute',
                                width: '40%',
                                height: '4px',
                                backgroundColor: gaugeColor,
                                left: '50%',
                                top: '50%',
                                transformOrigin: 'left center',
                                transform: `rotate(${needleAngle}deg)`,
                                transition: 'transform 0.3s ease',
                                zIndex: 2,
                                borderRadius: '2px'
                            }} />

                            <div style={{
                                position: 'absolute',
                                width: '12px',
                                height: '12px',
                                backgroundColor: gaugeColor,
                                borderRadius: '50%',
                                zIndex: 3
                            }} />
                        </div>

                        {component.showRange !== false && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                width: '90%',
                                marginTop: '5px',
                                fontSize: '10px',
                                color: '#ecf0f1',
                                fontWeight: 'bold'
                            }}>
                                <span>{gaugeMin}</span>
                                <span>{gaugeMax}</span>
                            </div>
                        )}

                        {component.showValue !== false && (
                            <div style={{
                                marginTop: '5px',
                                fontSize: '12px',
                                color: gaugeColor,
                                fontWeight: 'bold'
                            }}>
                                {gaugeValue}
                            </div>
                        )}
                    </div>
                );

            case 'joystick':
                const joystickColor = getColorWithTransparency('color', 'colorTransparent');

                return (
                    <div
                        id={`comp-${component.id}`}
                        style={{
                            ...baseStyle,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'transparent',
                            borderRadius: '50%',
                            cursor: joystickPosition.isDragging ? 'grabbing' : 'grab',
                            userSelect: 'none',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{
                            width: '80%',
                            height: '80%',
                            backgroundColor: '#2c3e50',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: 0,
                                    width: '1px',
                                    height: '100%',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    transform: 'translateX(-50%)'
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: 0,
                                    width: '100%',
                                    height: '1px',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    transform: 'translateY(-50%)'
                                }} />
                            </div>

                            <div
                                style={{
                                    width: '40%',
                                    height: '40%',
                                    backgroundColor: joystickColor,
                                    borderRadius: '50%',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                    transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
                                    transition: joystickPosition.isDragging ? 'none' : 'transform 0.15s ease',
                                    position: 'relative'
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '30%',
                                    height: '30%',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    opacity: 0.3
                                }} />
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div style={{
                        ...baseStyle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#95a5a6',
                        color: 'white',
                        fontSize: '10px'
                    }}>
                        未知组件: {component.type}
                    </div>
                );
        }
    };

    return (
        <div className="component-renderer" style={{ width: '100%', height: '100%' }}>
            {renderComponent()}
        </div>
    );
};

export default ComponentRenderer;