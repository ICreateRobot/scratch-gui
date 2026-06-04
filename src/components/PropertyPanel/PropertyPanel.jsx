import React, { useState, useEffect } from 'react';
import useStore from '../../stores/useStore.js';
import styles from './PropertyPanel.css';

const PropertyPanel = () => {
    const selectedComponent = useStore(state => state.selectedComponent);
    const updateComponent = useStore(state => state.updateComponent);
    const screenBackgroundColor = useStore(state => state.screenBackgroundColor);
    const updateScreenBackgroundColor = useStore(state => state.updateScreenBackgroundColor);
    const bringToFront = useStore(state => state.bringToFront);
    const mqttTopics = useStore(state => state.mqttTopics);
    const mqttConnected = useStore(state => state.mqttConnected);
    const subscribeTopic = useStore(state => state.subscribeTopic);
    const mqttError = useStore(state => state.mqttError);
    const refreshTopics = useStore(state => state.refreshTopics);
    const isLoadingTopics = useStore(state => state.isLoadingTopics);
    const addCustomTopic = useStore(state => state.addCustomTopic);

    const [showDataEditor, setShowDataEditor] = useState(false);
    const [editingData, setEditingData] = useState([]);
    const [customTopic, setCustomTopic] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [newCustomTopic, setNewCustomTopic] = useState('');

    // 监听topic列表变化
    useEffect(() => {
        if (selectedComponent && selectedComponent.topic) {
            const topic = selectedComponent.topic;
            if (topic && !mqttTopics.includes(topic)) {
                setCustomTopic(topic);
                setShowCustomInput(true);
            }
        }
    }, [selectedComponent, mqttTopics]);

    const handlePropertyChange = (property, value) => {
        if (selectedComponent && selectedComponent.id === 'screen') {
            if (property === 'backgroundColor') {
                updateScreenBackgroundColor(value);
            }
            return;
        }

        // 处理透明切换
        if (property.endsWith('Transparent')) {
            const colorProp = property.replace('Transparent', '');
            updateComponent(selectedComponent.id, {
                [property]: value
            });
            return;
        }

        // 如果是颜色属性且当前处于透明状态，只更新值但不改变透明状态
        const colorProps = ['backgroundColor', 'borderColor', 'color', 'fillColor', 'strokeColor', 'onColor'];
        if (colorProps.includes(property)) {
            const transparentKey = `${property}Transparent`;
            if (selectedComponent[transparentKey]) {
                // 如果当前是透明状态，先取消透明再更新颜色
                updateComponent(selectedComponent.id, {
                    [transparentKey]: false,
                    [property]: value
                });
                return;
            }
        }

        // 处理数值类型
        if (property === 'fontSize' || property === 'index' || property === 'radius' ||
            property === 'strokeWidth' || property === 'min' || property === 'max' || property === 'value' ||
            property === 'x' || property === 'y' || property === 'w' || property === 'h' ||
            property === 'barSize' || property === 'barRadius' ||
            property === 'strokeWidth' || property === 'innerRadius' || property === 'arcWidth' ||
            property === 'startAngle' || property === 'endAngle' ||
            property === 'xMin' || property === 'xMax' || property === 'yMin' || property === 'yMax' ||
            property === 'xValue' || property === 'yValue') {
            value = value === '' ? 0 : Number(value);
        }

        if (property === 'radius' && selectedComponent.type === 'circle') {
            const radius = value === '' ? 0 : Number(value);
            const diameter = radius * 2;
            updateComponent(selectedComponent.id, {
                w: diameter,
                h: diameter,
                radius: radius
            });
            return;
        }

        if ((property === 'w' || property === 'h') && selectedComponent.type === 'circle') {
            const size = value === '' ? 0 : Number(value);
            const radius = Math.round(size / 2);
            updateComponent(selectedComponent.id, {
                w: size,
                h: size,
                radius: radius
            });
            return;
        }

        if (property === 'showGrid' || property === 'showXAxis' || property === 'showYAxis' ||
            property === 'showTooltip' || property === 'showLine' || property === 'showPoints' ||
            property === 'showLabel' || property === 'showPercentage' || property === 'showValue' ||
            property === 'showRange' || property === 'showValues' || property === 'returnToCenter') {
            value = Boolean(value);
        }

        // 如果是topic属性变化，需要重新订阅
        if (property === 'topic') {
            const oldTopic = selectedComponent.topic;
            updateComponent(selectedComponent.id, { [property]: value });

            if (mqttConnected && value && value.trim() !== '') {
                subscribeTopic(value);
            }
        } else {
            updateComponent(selectedComponent.id, { [property]: value });
        }
    };

    const handleScreenBackgroundChange = (color) => {
        updateScreenBackgroundColor(color);
    };

    const handleBringToFront = () => {
        bringToFront(selectedComponent.id);
    };

    // 渲染颜色输入组件
    const renderColorInput = (field, component) => {
        const isTransparent = component[`${field.key}Transparent`] || false;
        const currentColor = component[field.key] || getDefaultColor(field.key);

        return (
            <div className={styles.colorInputWrapper}>
                <input
                    type="color"
                    value={isTransparent ? '#000000' : currentColor}
                    onChange={(e) => handlePropertyChange(field.key, e.target.value)}
                    disabled={isTransparent}
                    style={{
                        opacity: isTransparent ? 0.5 : 1,
                        cursor: isTransparent ? 'not-allowed' : 'pointer'
                    }}
                    title={isTransparent ? "透明状态下颜色选择器禁用" : "选择颜色"}
                />
                <button
                    type="button"
                    className={`
                        ${styles.transparentBtn}
                        ${isTransparent ? styles.active : ''}
                    `}
                    onClick={() => handlePropertyChange(`${field.key}Transparent`, !isTransparent)}
                    title={isTransparent ? "取消透明" : "设置为透明"}
                >
                    {isTransparent ? '取消透明' : '透明'}
                </button>
            </div>
        );
    };

    // 获取默认颜色
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

    // 处理编辑图表数据
    const handleEditChartData = () => {
        const currentData = selectedComponent.data || [
            { name: 'A', value: 40 },
            { name: 'B', value: 60 },
            { name: 'C', value: 80 }
        ];
        setEditingData([...currentData]);
        setShowDataEditor(true);
    };

    const handleSaveChartData = () => {
        updateComponent(selectedComponent.id, { data: editingData });
        setShowDataEditor(false);
    };

    const handleAddDataRow = () => {
        setEditingData([...editingData, { name: `数据${editingData.length + 1}`, value: 50 }]);
    };

    const handleDeleteDataRow = (index) => {
        const newData = editingData.filter((_, i) => i !== index);
        setEditingData(newData);
    };

    const handleUpdateDataRow = (index, field, value) => {
        const newData = [...editingData];
        newData[index] = { ...newData[index], [field]: value };
        setEditingData(newData);
    };

    const handleCustomTopicChange = (e) => {
        const value = e.target.value;
        setCustomTopic(value);
        handlePropertyChange('topic', value);
    };

    const handleAddNewCustomTopic = () => {
        if (newCustomTopic.trim() !== '') {
            addCustomTopic(newCustomTopic.trim());
            handlePropertyChange('topic', newCustomTopic.trim());
            setNewCustomTopic('');
            setShowCustomInput(false);
        }
    };

    // 渲染屏幕背景设置界面
    const renderScreenBackgroundSettings = () => {
        return (
            <div className={styles.propertyPanel}>
                <h3>属性面板</h3>
                <div className={styles.propertyContent}>
                    <div className={styles.screenBackgroundSection}>
                        <h4>屏幕背景设置</h4>
                        <div className={styles.propertyField}>
                            <label>背景颜色:</label>
                            <div className={styles.colorInputWrapper}>
                                <input
                                    type="color"
                                    value={screenBackgroundColor || '#000000'}
                                    onChange={(e) => handleScreenBackgroundChange(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className={styles.transparentBtn}
                                    onClick={() => handleScreenBackgroundChange('#000000')}
                                    title="设置为黑色"
                                >
                                    黑色
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (selectedComponent && selectedComponent.id === 'screen') {
        return renderScreenBackgroundSettings();
    }

    if (!selectedComponent) {
        return renderScreenBackgroundSettings();
    }

    // 判断是否支持topic属性
    const hasTopicProperty = selectedComponent &&
        ['text', 'button', 'switch', 'slider', 'barChart', 'lineChart', 'pieChart', 'gauge', 'joystick'].includes(selectedComponent.type);

    const renderTopicField = () => {
        if (!hasTopicProperty) return null;

        const currentTopic = selectedComponent.topic || '';

        return (
            <div className={styles.propertyField}>
                <label>Topic:</label>
                <div className={styles.topicInputWrapper}>
                    <div className={styles.topicSelectRow}>
                        <select
                            value={currentTopic}
                            onChange={(e) => {
                                const value = e.target.value;
                                handlePropertyChange('topic', value);
                            }}
                            disabled={!mqttConnected}
                        >
                            <option value="">请选择Topic</option>
                            {mqttTopics.map(topic => (
                                <option key={topic} value={topic}>
                                    {topic}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className={styles.refreshTopicsBtn}
                            onClick={refreshTopics}
                            title="刷新Topic列表"
                            disabled={!mqttConnected || isLoadingTopics}
                        >
                            {isLoadingTopics ? '⌛' : '🔄'}
                        </button>
                    </div>

                    <div className={styles.topicStatus}>
                        {mqttConnected ? '✅ MQTT已连接' : '❌ MQTT未连接'}
                        {isLoadingTopics && <span className={styles.topicLoading}> (加载中...)</span>}
                        {mqttError && <span className={styles.topicError}> ({mqttError})</span>}
                    </div>
                </div>
            </div>
        );
    };

    const getCommonFields = () => {
        const commonFields = [
            { key: 'name', label: '名称', type: 'text' },
            { key: 'index', label: '层级 (z-index)', type: 'number' }
        ];

        if (selectedComponent.type !== 'title') {
            commonFields.push(
                { key: 'x', label: 'X坐标', type: 'number', min: 0, max: 460, step: 1 },
                { key: 'y', label: 'Y坐标', type: 'number', min: 0, max: 345, step: 1 }
            );

            if (selectedComponent.type !== 'circle') {
                commonFields.push(
                    { key: 'w', label: '宽度', type: 'number', min: 1, max: 460, step: 1 },
                    { key: 'h', label: '高度', type: 'number', min: 1, max: 345, step: 1 }
                );
            }
        }

        return commonFields;
    };

    const typeSpecificFields = {
        title: [
            { key: 'text', label: '文本内容', type: 'text' },
            { key: 'color', label: '文字颜色', type: 'color' },
            { key: 'backgroundColor', label: '背景颜色', type: 'color' },
            { key: 'fontSize', label: '文字大小', type: 'number' },
            { key: 'fontWeight', label: '文字粗细', type: 'select', options: ['normal', 'bold'] }
        ],
        label: [
            { key: 'text', label: '文本内容', type: 'text' },
            { key: 'fontSize', label: '文字大小', type: 'number' },
            { key: 'color', label: '文字颜色', type: 'color' },
            { key: 'backgroundColor', label: '背景颜色', type: 'color' },
            { key: 'fontWeight', label: '文字粗细', type: 'select', options: ['normal', 'bold'] }
        ],
        rectangle: [
            { key: 'backgroundColor', label: '背景颜色', type: 'color' },
            { key: 'borderColor', label: '边框颜色', type: 'color' }
        ],
        circle: [
            { key: 'radius', label: '半径', type: 'number' },
            { key: 'backgroundColor', label: '背景颜色', type: 'color' },
            { key: 'borderColor', label: '边框颜色', type: 'color' }
        ],
        line: [
            { key: 'strokeColor', label: '线条颜色', type: 'color' },
            { key: 'strokeWidth', label: '线条宽度', type: 'number' }
        ],
        image: [
            { key: 'src', label: '图片URL', type: 'text' }
        ],
        text: [
            { key: 'text', label: '文本内容', type: 'text' },
            { key: 'fontSize', label: '文字大小', type: 'number' },
            { key: 'color', label: '文字颜色', type: 'color' },
            { key: 'backgroundColor', label: '背景颜色', type: 'color' },
            { key: 'fontWeight', label: '文字粗细', type: 'select', options: ['normal', 'bold'] }
        ],
        button: [
            { key: 'text', label: '按钮文本', type: 'text' },
            { key: 'fontSize', label: '文字大小', type: 'number' },
            { key: 'color', label: '文字颜色', type: 'color' },
            { key: 'backgroundColor', label: '背景颜色', type: 'color' }
        ],
        switch: [
            { key: 'backgroundColor', label: '背景颜色', type: 'color' },
            { key: 'onColor', label: '开启颜色', type: 'color' }
        ],
        slider: [
            { key: 'min', label: '最小值', type: 'number' },
            { key: 'max', label: '最大值', type: 'number' },
            { key: 'value', label: '当前值', type: 'number' },
            { key: 'fillColor', label: '填充颜色', type: 'color' }
        ],
        barChart: [
            { key: 'color', label: '柱状图颜色', type: 'color' },
            { key: 'barSize', label: '柱子宽度', type: 'number', min: 10, max: 100 },
            { key: 'barRadius', label: '柱子圆角', type: 'number', min: 0, max: 20 },
            { key: 'xAxisName', label: '横坐标名称', type: 'text' },
            { key: 'yAxisName', label: '纵坐标名称', type: 'text' },
            { key: 'showGrid', label: '显示网格', type: 'checkbox' },
            { key: 'showXAxis', label: '显示横坐标', type: 'checkbox' },
            { key: 'showYAxis', label: '显示纵坐标', type: 'checkbox' }
        ],
        lineChart: [
            { key: 'color', label: '线条颜色', type: 'color' },
            { key: 'strokeWidth', label: '线条宽度', type: 'number', min: 1, max: 10 },
            { key: 'xAxisName', label: '横坐标名称', type: 'text' },
            { key: 'yAxisName', label: '纵坐标名称', type: 'text' },
            { key: 'showGrid', label: '显示网格', type: 'checkbox' },
            { key: 'showXAxis', label: '显示横坐标', type: 'checkbox' },
            { key: 'showYAxis', label: '显示纵坐标', type: 'checkbox' },
            { key: 'showTooltip', label: '显示提示', type: 'checkbox' },
            { key: 'showLine', label: '显示线条', type: 'checkbox' },
            { key: 'showPoints', label: '显示数据点', type: 'checkbox' },
            { key: 'lineType', label: '线条类型', type: 'select', options: ['monotone', 'linear', 'step'] }
        ],
        pieChart: [
            { key: 'showLabel', label: '显示标签', type: 'checkbox' },
            { key: 'showPercentage', label: '显示百分比', type: 'checkbox' },
            { key: 'innerRadius', label: '内径 (0-80)', type: 'number', min: 0, max: 80 },
            { key: 'outerRadius', label: '外径 (%)', type: 'text' },
            { key: 'showTooltip', label: '显示提示', type: 'checkbox' }
        ],
        gauge: [
            { key: 'value', label: '当前值', type: 'number' },
            { key: 'min', label: '最小值', type: 'number' },
            { key: 'max', label: '最大值', type: 'number' },
            { key: 'color', label: '仪表颜色', type: 'color' },
            { key: 'showValue', label: '显示数值', type: 'checkbox' },
            { key: 'showRange', label: '显示范围', type: 'checkbox' }
        ],
        joystick: [
            { key: 'xMin', label: 'X最小值', type: 'number' },
            { key: 'xMax', label: 'X最大值', type: 'number' },
            { key: 'yMin', label: 'Y最小值', type: 'number' },
            { key: 'yMax', label: 'Y最大值', type: 'number' },
            { key: 'color', label: '手柄颜色', type: 'color' },
            { key: 'returnToCenter', label: '自动回中', type: 'checkbox' }
        ]
    };

    const getInputValue = (component, key, defaultValue = '') => {
        if (key === 'radius' && component.type === 'circle') {
            const radius = Math.round((component.w || 0) / 2);
            return radius === 0 ? '' : radius;
        }

        const value = component[key];
        if (value === 0 || value === '0') {
            return '';
        }
        return value !== undefined && value !== null ? value : defaultValue;
    };

    const renderPropertyFields = () => {
        const commonFields = getCommonFields();
        const specificFields = typeSpecificFields[selectedComponent.type] || [];

        const fields = [...commonFields];

        if (hasTopicProperty) {
            const nameIndex = fields.findIndex(f => f.key === 'name');
            if (nameIndex !== -1) {
                fields.splice(nameIndex + 1, 0, {
                    key: 'topic',
                    label: 'Topic',
                    type: 'topic'
                });
            }
        }

        fields.push(...specificFields);

        return fields.map(field => {
            if (field.type === 'topic') {
                // return renderTopicField();
                return <div key={field.key}>{renderTopicField()}</div>;
            }

            if ((selectedComponent.type === 'barChart' ||
                selectedComponent.type === 'lineChart' ||
                selectedComponent.type === 'pieChart') && field.key === 'data') {
                return (
                    <div key={field.key} className={styles.propertyField}>
                        <label>{field.label}:</label>
                        <div className={styles.chartDataEditor}>
                            <button
                                type="button"
                                className={styles.dataEditBtn}
                                onClick={() => handleEditChartData()}
                            >
                                编辑数据
                            </button>
                        </div>
                    </div>
                );
            }

            // 对于颜色字段，使用新的渲染方式
            if (field.type === 'color') {
                return (
                    <div key={field.key} className={styles.propertyField}>
                        <label>{field.label}:</label>
                        {renderColorInput(field, selectedComponent)}
                    </div>
                );
            }

            return (
                <div key={field.key} className={styles.propertyField}>
                    <label>{field.label}:</label>
                    {field.type === 'text' && (
                        <input
                            type="text"
                            value={getInputValue(selectedComponent, field.key, '')}
                            onChange={(e) => handlePropertyChange(field.key, e.target.value)}
                        />
                    )}
                    {field.type === 'number' && (
                        <input
                            type="number"
                            value={getInputValue(selectedComponent, field.key, '')}
                            onChange={(e) => handlePropertyChange(field.key, e.target.value)}
                            placeholder="0"
                            min={field.min}
                            max={field.max}
                            step={field.step || 1}
                        />
                    )}
                    {field.type === 'select' && (
                        <select
                            value={selectedComponent[field.key] || ''}
                            onChange={(e) => handlePropertyChange(field.key, e.target.value)}
                        >
                            {field.options.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    )}
                    {field.type === 'checkbox' && (
                        <input
                            type="checkbox"
                            checked={selectedComponent[field.key] !== false}
                            onChange={(e) => handlePropertyChange(field.key, e.target.checked)}
                        />
                    )}
                </div>
            );
        });
    };

    return (
        <div className={styles.propertyPanel}>
            <h3>属性面板</h3>
            <div className={styles.propertyContent}>
                <div className={styles.componentInfo}>
                    <strong>类型:</strong> {selectedComponent.type}
                    {selectedComponent.type === 'title' && (
                        <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                            (此组件位置固定，无法移动)
                        </div>
                    )}
                </div>

                {(selectedComponent.type === 'barChart' ||
                    selectedComponent.type === 'lineChart' ||
                    selectedComponent.type === 'pieChart') && (
                        <div className={styles.propertyField}>
                            <label>图表数据:</label>
                            <div className={styles.chartDataEditor}>
                                <button
                                    type="button"
                                    className={styles.dataEditBtn}
                                    onClick={handleEditChartData}
                                >
                                    编辑数据
                                </button>
                            </div>
                        </div>
                    )}

                {selectedComponent.type !== 'title' && (
                    <div className={styles.layerControls}>
                        <h4>层级控制</h4>
                        <div className={styles.layerButtons}>
                            <button
                                className={`
                                    ${styles.layerBtn}
                                    ${styles.frontBtn}
                                `}
                                onClick={handleBringToFront}
                            >
                                置顶
                            </button>
                        </div>
                    </div>
                )}

                {renderPropertyFields()}
            </div>

            {showDataEditor && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>编辑图表数据</h3>
                        <div className={styles.dataEditor}>
                            <div className={styles.dataHeader}>
                                <span>名称</span>
                                <span>数值</span>
                                <span>操作</span>
                            </div>
                            {editingData.map((item, index) => (
                                <div key={index} className={styles.dataRow}>
                                    <input
                                        type="text"
                                        value={item.name || ''}
                                        onChange={(e) => handleUpdateDataRow(index, 'name', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        value={item.value || 0}
                                        onChange={(e) => handleUpdateDataRow(index, 'value', Number(e.target.value))}
                                    />
                                    <button
                                        type="button"
                                        className={styles.deleteRowBtn}
                                        onClick={() => handleDeleteDataRow(index)}
                                    >
                                        删除
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className={styles.addRowBtn}
                                onClick={handleAddDataRow}
                            >
                                添加数据行
                            </button>
                        </div>
                        <div className={styles.modalActions}>
                            <button onClick={handleSaveChartData}>保存</button>
                            <button onClick={() => setShowDataEditor(false)}>取消</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyPanel;