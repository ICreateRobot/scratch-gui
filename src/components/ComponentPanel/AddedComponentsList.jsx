
import React from 'react';
import useStore from '../../stores/useStore.js';
import styles from './AddedComponentsList.css';

const AddedComponentsList = () => {
    const {
        components,
        selectedComponent,
        selectComponent,
        deleteComponent
    } = useStore();

    const componentIcons = {
        screen: '🖥️',
        title: 'T',
        label: 'L',
        rectangle: '□',
        circle: '○',
        line: '—',
        image: '🖼',
        text: '📝',
        button: '🔘',
        switch: '⚡',
        slider: '🎚',
        barChart: '📊',
        // 新增组件图标
        lineChart: '📈',
        pieChart: '🥧',
        gauge: '🎛️',
        joystick: '🕹️'
    };

    const componentNames = {
        screen: '屏幕',
        title: '标题',
        label: '标签',
        rectangle: '方形',
        circle: '圆形',
        line: '直线',
        image: '图像',
        text: '文本',
        button: '按钮',
        switch: '开关',
        slider: '滑块',
        barChart: '柱状图',
        // 新增组件名称
        lineChart: '折线图',
        pieChart: '饼状图',
        gauge: '仪表盘',
        joystick: '手柄'
    };

    const handleComponentClick = (component) => {
        selectComponent(component.id);
    };

    const handleDeleteClick = (e, componentId) => {
        e.stopPropagation();
        // 屏幕组件不可删除
        if (componentId === 'screen') {
            alert('屏幕组件不可删除');
            return;
        }
        if (window.confirm('确定要删除这个组件吗？')) {
            deleteComponent(componentId);
        }
    };

    const getComponentDisplayName = (component) => {
        if (component.name && component.name.trim() !== '') {
            return component.name;
        }

        // 如果有文本内容，使用文本内容作为显示名
        if (component.text && component.text.trim() !== '') {
            return component.text.length > 10
                ? component.text.substring(0, 10) + '...'
                : component.text;
        }

        // 否则使用组件类型名称
        return componentNames[component.type] || component.type;
    };

    // 创建屏幕组件对象 - 确保有正确的类型
    const screenComponent = {
        id: 'screen',
        type: 'screen', // 确保类型是'screen'
        name: '屏幕'
    };

    // 合并屏幕组件和其他组件
    const allComponents = [screenComponent, ...components];

    return (
        <div className={styles.addedComponentsList}>
            <h3>已添加组件 ({allComponents.length})</h3>
            <div className={styles.componentsContainer}>
                {allComponents.map(component => (
                    <div
                        key={component.id}
                        className={`
                            ${styles.componentItem}
                            ${selectedComponent?.id === component.id ? styles.selected : ''}
                            ${component.type === 'screen' ? styles.screenComponent : ''}
                            `}
                        onClick={() => handleComponentClick(component)}
                    >
                        <div className={styles.componentInfo}>
                            <div className={styles.componentIcon}>
                                {componentIcons[component.type] || '?'}
                            </div>
                            <div className={styles.componentDetails}>
                                <div className={styles.componentName}>
                                    {component.type === 'screen' ? '屏幕' : getComponentDisplayName(component)}
                                </div>
                                <div className={styles.componentType}>
                                    {componentNames[component.type] || component.type}
                                </div>
                            </div>
                        </div>
                        {/* 屏幕组件不显示删除按钮 */}
                        {component.type !== 'screen' && (
                            <button
                                className={styles.deleteBtn}
                                onClick={(e) => handleDeleteClick(e, component.id)}
                                title="删除组件"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AddedComponentsList;