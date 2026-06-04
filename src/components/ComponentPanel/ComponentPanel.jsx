
import React from 'react';
import useStore from '../../stores/useStore.js';
import AddedComponentsList from './AddedComponentsList.jsx';
import styles from './ComponentPanel.css';

const componentTypes = [
    { type: 'title', name: '标题', icon: 'T' },
    { type: 'label', name: '标签', icon: 'L' },
    { type: 'rectangle', name: '方形', icon: '□' },
    { type: 'circle', name: '圆形', icon: '○' },
    { type: 'line', name: '直线', icon: '—' },
    { type: 'image', name: '图像', icon: '🖼' },
    { type: 'text', name: '文本', icon: '📝' },
    { type: 'button', name: '按钮', icon: '🔘' },
    { type: 'switch', name: '开关', icon: '⚡' },
    { type: 'slider', name: '滑块', icon: '🎚' },
    { type: 'barChart', name: '柱状图', icon: '📊' },
    // 新增组件
    { type: 'lineChart', name: '折线图', icon: '📈' },
    { type: 'pieChart', name: '饼状图', icon: '🥧' },
    { type: 'gauge', name: '仪表盘', icon: '🎛️' },
    { type: 'joystick', name: '手柄', icon: '🕹️' }
];

/**
 * 组件面板组件
 * 用于展示可用组件库和已添加组件列表
 */
const ComponentPanel = () => {
    // 从全局状态管理中获取添加组件的方法
    const addComponent = useStore(state => state.addComponent);

    /**
     * 处理组件拖拽开始事件
     * @param {Event} e - 拖拽事件对象
     * @param {string} type - 组件类型
     */
    const handleDragStart = (e, type) => {
        // 设置拖拽数据，包含组件类型信息
        e.dataTransfer.setData('componentType', type);
    };

    /**
     * 处理组件点击事件
     * @param {string} type - 组件类型
     */
    const handleClick = (type) => {
        // 调用全局状态管理中的添加组件方法
        addComponent(type);
    };

    return (
        <div className={styles.componentPanelContainer}>
            <div className={styles.componentLibrary}>
                <h3>组件库</h3>
                <div className={styles.componentList}>
                    {componentTypes.map(comp => (
                        <div
                            key={comp.type}
                            className={styles.componentItem}
                            draggable
                            onDragStart={(e) => handleDragStart(e, comp.type)} // 绑定拖拽开始事件处理函数
                            onClick={() => handleClick(comp.type)} // 绑定点击事件处理函数
                        >
                            <div className={styles.componentIcon}>{comp.icon}</div>
                            <span className={styles.componentName}>{comp.name}</span>
                        </div>
                    ))}
                </div>
            </div>
            <AddedComponentsList /> {/* 渲染已添加组件列表 */}
        </div>
    );
};

export default ComponentPanel;