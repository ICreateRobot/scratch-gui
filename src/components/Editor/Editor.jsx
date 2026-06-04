import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import useStore from '../../stores/useStore.js';
import ComponentRenderer from './ComponentRenderer.jsx';
import styles from './Editor.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * Editor组件 - 可视化编辑器主组件
 * 提供组件拖放、对齐、辅助线、MQTT连接等功能
 */
const Editor = () => {
    // 从store中获取状态和方法
    const {
        components,              // 组件列表
        selectedComponent,        // 当前选中的组件
        showGrid,                 // 是否显示网格
        screenBackgroundColor,    // 屏幕区域背景色
        screenSize,              // 屏幕区域尺寸
        showScreenBorder,        // 是否显示屏幕边框
        addComponent,             // 添加组件方法
        updateComponent,          // 更新组件方法
        selectComponent,          // 选中组件方法
        clearComponents,          // 清除所有组件方法
        // 对齐功能相关方法
        alignComponentLeft,       // 左对齐
        alignComponentCenter,     // 居中对齐
        alignComponentRight,      // 右对齐
        alignComponentTop,        // 顶部对齐
        alignComponentMiddle,     // 垂直居中
        alignComponentBottom,     // 底部对齐
        // 辅助线功能相关方法
        showGuides,              // 是否显示辅助线
        guides,                  // 辅助线列表
        activeGuide,             // 当前激活的辅助线
        guidePosition,           // 辅助线位置
        allGuidesFixed,          // 是否固定所有辅助线
        toggleGuides,            // 切换辅助线显示
        addGuide,                // 添加辅助线
        removeGuide,             // 删除辅助线
        removeAllGuides,         // 删除所有辅助线
        updateGuidePosition,     // 更新辅助线位置
        toggleFixAllGuides,      // 切换固定所有辅助线
        toggleFixGuide,          // 切换固定单个辅助线
        setActiveGuide,          // 设置激活的辅助线
        clearActiveGuide,        // 清除激活的辅助线
        // MQTT功能相关
        mqttConnected,           // MQTT连接状态
        connectMQTT,             // 连接MQTT
        disconnectMQTT,          // 断开MQTT
        refreshTopics,           // 刷新主题列表
        publishMQTT              // 发布MQTT消息
    } = useStore();

    // 辅助线下拉菜单状态
    const [guideDropdownOpen, setGuideDropdownOpen] = useState(false);

    // 引用和状态
    const editorContentRef = useRef(null);      // 编辑器内容区域引用
    const gridContainerRef = useRef(null);       // 网格容器引用
    const [editorSize, setEditorSize] = useState({ width: 2000, height: 2000 }); // 编辑器尺寸
    const [isDragging, setIsDragging] = useState(false); // 是否正在拖拽
    const dragStartPosRef = useRef({ x: 0, y: 0 }); // 拖拽起始位置

    // 固定屏幕区域的位置和大小偏移量
    const SCREEN_AREA_OFFSET = { x: 30, y: 30 };

    // 监听编辑器内容区域的大小变化
    useEffect(() => {
        const updateEditorSize = () => {
            if (editorContentRef.current) {
                // 设置足够大的编辑区域
                const width = 2000; // 固定宽度
                const height = 2000; // 固定高度
                setEditorSize({ width, height });
            }
        };

        updateEditorSize();

        const resizeObserver = new ResizeObserver(updateEditorSize);
        if (editorContentRef.current) {
            resizeObserver.observe(editorContentRef.current);
        }

        window.addEventListener('resize', updateEditorSize);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateEditorSize);
        };
    }, []);

    // 计算网格列数（固定为编辑器宽度）
    const cols = editorSize.width;
    const handleDrop = useCallback((layout, layoutItem, _event) => {

        const type = _event.dataTransfer.getData('componentType');
        if (type) {

            if (type === 'title') {
        
                const dropProps = {
                    x: SCREEN_AREA_OFFSET.x, // 固定在屏幕区域的x坐标
                    y: SCREEN_AREA_OFFSET.y, // 固定在屏幕区域的y坐标
                    w: screenSize.width, // 宽度与屏幕宽度一致
                    h: 40 // 固定高度40像素
                };

                addComponent(type, dropProps);
                return;
            }
            // 使用拖拽释放的实际位置，而不是固定位置
            const dropProps = {
                x: layoutItem.x,
                y: layoutItem.y,
                w: layoutItem.w,
                h: layoutItem.h
            };

            // 根据组件类型设置默认尺寸
            let defaultWidth, defaultHeight;
            switch (type) {
                case 'label':
                case 'text':
                case 'button':
                    defaultWidth = 120;
                    defaultHeight = 40;
                    break;
                case 'switch':
                    defaultWidth = 80;
                    defaultHeight = 40;
                    break;
                case 'rectangle':
                    defaultWidth = 100;
                    defaultHeight = 60;
                    break;
                case 'circle':
                    defaultWidth = 80;
                    defaultHeight = 80;
                    break;
                case 'line':
                    defaultWidth = 120;
                    defaultHeight = 2;
                    break;
                case 'image':
                    defaultWidth = 100;
                    defaultHeight = 100;
                    break;
                case 'slider':
                    defaultWidth = 200;
                    defaultHeight = 60;
                    break;
                case 'barChart':
                case 'lineChart':
                case 'pieChart':
                    defaultWidth = 250;
                    defaultHeight = 182;
                    break;
                case 'gauge':
                    defaultWidth = 144;
                    defaultHeight = 150;
                    break;
                case 'joystick':
                    defaultWidth = 150;
                    defaultHeight = 150;
                    break;
                case 'title':
                    defaultWidth = 200;
                    defaultHeight = 40;
                    break;
                default:
                    defaultWidth = 100;
                    defaultHeight = 100;
            }

            // 如果拖拽时没有指定尺寸，使用默认尺寸
            if (!dropProps.w || dropProps.w < 20) dropProps.w = defaultWidth;
            if (!dropProps.h || dropProps.h < 20) dropProps.h = defaultHeight;

            // 确保位置不超出编辑区域
            const editorWidth = editorSize.width;
            const editorHeight = editorSize.height;

            dropProps.x = Math.max(0, Math.min(dropProps.x, editorWidth - dropProps.w));
            dropProps.y = Math.max(0, Math.min(dropProps.y, editorHeight - dropProps.h));

            addComponent(type, dropProps);
        }
    }, [addComponent, editorSize.width, editorSize.height,screenSize]);

    const onDragStart = useCallback((layout, oldItem) => {
        setIsDragging(true);
        dragStartPosRef.current = { x: oldItem.x, y: oldItem.y };
    }, []);

    const onDragStop = useCallback((layout, oldItem, newItem) => {
        const component = components.find(comp => comp.id === newItem.i);

        // 检查是否是真正的拖拽（位置发生变化）
        const moved = oldItem.x !== newItem.x || oldItem.y !== newItem.y;

        // 如果不是真正的拖拽，就只是点击选中
        if (!moved) {
            selectComponent(newItem.i);
            setIsDragging(false);
            return;
        }

        // 如果是拖拽，更新位置
        updateComponent(newItem.i, {
            x: newItem.x,
            y: newItem.y
        });
        setIsDragging(false);
    }, [updateComponent, selectComponent, components]);

    const onResizeStop = useCallback((layout, oldItem, newItem) => {
        const component = components.find(comp => comp.id === newItem.i);
        if (component) {
            updateComponent(newItem.i, {
                w: newItem.w,
                h: newItem.h
            });
        }
    }, [updateComponent, components]);

    const handleComponentClick = (e, componentId) => {
        e.stopPropagation();
        e.preventDefault();
        selectComponent(componentId);
    };

    const handleEditorClick = (e) => {
        
        // 只在点击空白区域时选中屏幕
        
            selectComponent('screen');
     
    };

    const handleClear = () => {
        if (window.confirm('确定要清除所有组件吗？')) {
            clearComponents();
        }
    };

    // 对齐功能处理函数 - 修改为只对齐屏幕区域内的组件
    const handleAlignLeft = () => {
        if (selectedComponent && selectedComponent.id !== 'screen') {
            alignComponentLeft(selectedComponent.id);
        }
    };

    const handleAlignCenter = () => {
        if (selectedComponent && selectedComponent.id !== 'screen') {
            alignComponentCenter(selectedComponent.id);
        }
    };

    const handleAlignRight = () => {
        if (selectedComponent && selectedComponent.id !== 'screen') {
            alignComponentRight(selectedComponent.id);
        }
    };

    const handleAlignTop = () => {
        if (selectedComponent && selectedComponent.id !== 'screen') {
            alignComponentTop(selectedComponent.id);
        }
    };

    const handleAlignMiddle = () => {
        if (selectedComponent && selectedComponent.id !== 'screen') {
            alignComponentMiddle(selectedComponent.id);
        }
    };

    const handleAlignBottom = () => {
        if (selectedComponent && selectedComponent.id !== 'screen') {
            alignComponentBottom(selectedComponent.id);
        }
    };

    // 辅助线处理方法
    const handleToggleGuides = () => {
        toggleGuides();
        setGuideDropdownOpen(false);
    };

    const handleAddVerticalGuide = () => {
        addGuide('vertical');
        setGuideDropdownOpen(false);
    };

    const handleAddHorizontalGuide = () => {
        addGuide('horizontal');
        setGuideDropdownOpen(false);
    };

    const handleRemoveAllGuides = () => {
        if (guides.length > 0 && window.confirm('确定要删除所有辅助线吗？')) {
            removeAllGuides();
        }
        setGuideDropdownOpen(false);
    };

    const handleToggleFixAllGuides = () => {
        toggleFixAllGuides();
        setGuideDropdownOpen(false);
    };

    const handleToggleFixGuide = (guideId, e) => {
        e.stopPropagation();
        toggleFixGuide(guideId);
    };

    // 辅助线拖动处理
    const handleGuideMouseDown = (e, guide) => {
        e.stopPropagation();
        if (allGuidesFixed || guide.fixed) return;
        setActiveGuide(guide.id);
    };

    const handleGridMouseMove = (e) => {
        if (!activeGuide || !showGuides) return;

        const gridContainer = e.currentTarget;
        const rect = gridContainer.getBoundingClientRect();

        const guide = guides.find(g => g.id === activeGuide);
        if (!guide || allGuidesFixed || guide.fixed) return;

        if (guide.type === 'vertical') {
            const x = e.clientX - rect.left;
            const clampedX = Math.max(0, Math.min(editorSize.width, x));
            updateGuidePosition(activeGuide, clampedX);
        } else {
            const y = e.clientY - rect.top;
            const clampedY = Math.max(0, Math.min(editorSize.height, y));
            updateGuidePosition(activeGuide, clampedY);
        }
    };

    const handleGridMouseUp = () => {
        if (activeGuide) {
            clearActiveGuide();
        }
    };

    // MQTT连接处理函数
    const handleMQTTConnect = () => {
        if (mqttConnected) {
            disconnectMQTT();
        } else {
            connectMQTT();
        }
    };

    const handleRefreshTopics = () => {
        refreshTopics();
    };

    // 组件交互处理
    const handleComponentInteraction = (componentId, updates) => {
        updateComponent(componentId, updates);

        if (!mqttConnected) return;

        const component = components.find(comp => comp.id === componentId);
        if (component && component.topic) {
            if (component.type === 'slider' && updates.value !== undefined) {
                publishMQTT(component.topic, updates.value.toString());
            } else if (component.type === 'button' && updates.pressed !== undefined) {
                publishMQTT(component.topic, updates.pressed ? '1' : '0');
            } else if (component.type === 'switch' && updates.value !== undefined) {
                publishMQTT(component.topic, updates.value ? '1' : '0');
            } else if (component.type === 'joystick' && updates.xValue !== undefined && updates.yValue !== undefined) {
                publishMQTT(component.topic, JSON.stringify({
                    x: updates.xValue,
                    y: updates.yValue
                }));
            } else if ((component.type === 'barChart' ||
                component.type === 'lineChart' ||
                component.type === 'pieChart') &&
                updates.data !== undefined) {
                publishMQTT(component.topic, JSON.stringify(updates.data));
            } else if (component.type === 'gauge' && updates.value !== undefined) {
                publishMQTT(component.topic, updates.value.toString());
            }
        }
    };

    const getGuideDisplayText = (guide) => {
        if (guide.type === 'vertical') {
            return `X: ${Math.round(guide.position)}px`;
        } else {
            return `Y: ${Math.round(guide.position)}px`;
        }
    };

    const validComponents = Array.isArray(components) ? components.filter(comp => comp && comp.id) : [];

    const onResize = useCallback((layout, oldItem, newItem) => {
        const component = components.find(comp => comp.id === newItem.i);

        // 如果是圆形组件，保持宽高相等（正方形）
        if (component && component.type === 'circle') {
            const size = Math.min(newItem.w, newItem.h);
            newItem.w = size;
            newItem.h = size;

            updateComponent(component.id, {
                w: size,
                h: size
            });

            return newItem;
        }

        return newItem;
    }, [components, updateComponent]);

    // 检查组件是否在屏幕区域内
    const isComponentInScreenArea = (component) => {
        const screenX = SCREEN_AREA_OFFSET.x;
        const screenY = SCREEN_AREA_OFFSET.y;
        const screenWidth = screenSize.width;
        const screenHeight = screenSize.height;

        const componentX = component.x || 0;
        const componentY = component.y || 0;
        const componentWidth = component.w || 0;
        const componentHeight = component.h || 0;

        return (
            componentX >= screenX &&
            componentY >= screenY &&
            componentX + componentWidth <= screenX + screenWidth &&
            componentY + componentHeight <= screenY + screenHeight
        );
    };

    return (
        <div className={styles.editor}>
            <div className={styles.editorToolbar}>
                <button onClick={() => useStore.getState().toggleGrid()}>
                    📐 网格 {showGrid ? '开' : '关'}
                </button>
                <button onClick={handleClear}>
                    🗑️ 清除
                </button>

                {/* 对齐功能按钮 */}
                <div className={styles.alignmentButtons}>
                    <button
                        onClick={handleAlignLeft}
                        disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title' || !isComponentInScreenArea(selectedComponent)}
                        title="水平居左"
                    >
                        ◀️ 左
                    </button>
                    <button
                        onClick={handleAlignCenter}
                        disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title' || !isComponentInScreenArea(selectedComponent)}
                        title="水平居中"
                    >
                        ⬤ 中
                    </button>
                    <button
                        onClick={handleAlignRight}
                        disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title' || !isComponentInScreenArea(selectedComponent)}
                        title="水平居右"
                    >
                        ▶️ 右
                    </button>
                    <button
                        onClick={handleAlignTop}
                        disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title' || !isComponentInScreenArea(selectedComponent)}
                        title="垂直居顶"
                    >
                        ▲ 顶
                    </button>
                    <button
                        onClick={handleAlignMiddle}
                        disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title' || !isComponentInScreenArea(selectedComponent)}
                        title="垂直居中"
                    >
                        ⬤ 中
                    </button>
                    <button
                        onClick={handleAlignBottom}
                        disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title' || !isComponentInScreenArea(selectedComponent)}
                        title="垂直居底"
                    >
                        ▼ 底
                    </button>
                </div>

                {/* MQTT连接按钮 */}
                <div className={styles.mqttControls}>
                    <button
                        className={`
                            ${styles.mqttBtn}
                            ${mqttConnected ? styles.connected : styles.disconnected}
                        `}
                        onClick={handleMQTTConnect}
                        title={mqttConnected ? "断开MQTT连接" : "连接MQTT Broker"}
                    >
                        🌐 {mqttConnected ? '已连接' : '连接MQTT'}
                    </button>

                    {mqttConnected && (
                        <button
                            className={styles.refreshBtn}
                            onClick={handleRefreshTopics}
                            title="刷新Topic列表"
                        >
                            🔄
                        </button>
                    )}
                </div>

                {/* 辅助线功能按钮 */}
                <div className={styles.guideControls}>
                    <button
                        className={`
                            ${styles.guideToggle}
                            ${showGuides ? styles.active : ''}
                        `}
                        onClick={handleToggleGuides}
                        title="显示/隐藏辅助线"
                    >
                        📏 辅助线 {showGuides ? '开' : '关'}
                    </button>

                    {showGuides && (
                        <>
                            <button
                                className={styles.guideActionBtn}
                                onClick={handleToggleFixAllGuides}
                                disabled={guides.length === 0}
                                title={allGuidesFixed ? "取消固定辅助线" : "固定所有辅助线"}
                            >
                                {allGuidesFixed ? "🔓 取消固定" : "🔒 固定"}
                            </button>

                            <button
                                className={styles.guideActionBtn}
                                onClick={handleRemoveAllGuides}
                                disabled={guides.length === 0}
                                title="删除所有辅助线"
                            >
                                🗑️ 删除
                            </button>

                            <div className={styles.guideDropdown}>
                                <button
                                    className={styles.guideDropdownToggle}
                                    onClick={() => setGuideDropdownOpen(!guideDropdownOpen)}
                                >
                                    ⚙️
                                </button>

                                {guideDropdownOpen && (
                                    <div className={styles.guideDropdownMenu}>
                                        <button onClick={handleAddVerticalGuide}>
                                            ➕ 添加垂直线
                                        </button>
                                        <button onClick={handleAddHorizontalGuide}>
                                            ➕ 添加水平线
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div
                className={styles.editorContent}
                onClick={handleEditorClick}
                ref={editorContentRef}
            >
                <div
                    className={styles.gridBackground}
                    style={{
                        width: `${editorSize.width}px`,
                        height: `${editorSize.height}px`,
                        position: 'relative',
                        backgroundImage: showGrid
                            ? 'linear-gradient(rgba(52, 152, 219, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 152, 219, 0.1) 1px, transparent 1px)'
                            : 'none',
                        backgroundSize: '20px 20px'
                    }}
                    ref={gridContainerRef}
                    onMouseMove={handleGridMouseMove}
                    onMouseUp={handleGridMouseUp}
                    onMouseLeave={handleGridMouseUp}
                >
                    {/* 屏幕区域轮廓 */}
                    <div
                        className={styles.screenAreaOutline}
                        style={{
                            position: 'absolute',
                            left: `${SCREEN_AREA_OFFSET.x}px`,
                            top: `${SCREEN_AREA_OFFSET.y}px`,
            
                            width: `${screenSize.width}px`,
                            height: `${screenSize.height}px`,
                           
                            backgroundColor: screenBackgroundColor,
                            pointerEvents: 'none',
                         
                        }}
                    >
                        {/* 屏幕区域标签 */}
                        <div style={{
                            position: 'absolute',
                            top: '-30px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#3498db',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            whiteSpace: 'nowrap'
                        }}>
                            预览区域: {screenSize.width} × {screenSize.height}
                        </div>
                    </div>

                    {guidePosition && (guidePosition.x !== null || guidePosition.y !== null) && (
                        <div className={styles.guidePositionDisplay}>
                            {guidePosition.x !== null && `X: ${Math.round(guidePosition.x)}px`}
                            {guidePosition.x !== null && guidePosition.y !== null && ' | '}
                            {guidePosition.y !== null && `Y: ${Math.round(guidePosition.y)}px`}
                        </div>
                    )}

                    {showGuides && guides.map(guide => (
                        <div
                            key={guide.id}
                            className={`
                                ${styles.guide}
                                ${styles.guide[type]}
                                ${activeGuide === guide.id ? styles.active : ''}
                                ${guide.fixed ? styles.fixed : ''}
                            `}
                            style={{
                                [guide.type === 'vertical' ? 'left' : 'top']: `${guide.position}px`
                            }}
                            onMouseDown={(e) => handleGuideMouseDown(e, guide)}
                            onDoubleClick={() => removeGuide(guide.id)}
                            title={`${getGuideDisplayText(guide)} - ${guide.fixed ? '已固定' : '可移动'} - 双击删除，右键菜单`}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleFixGuide(guide.id, e);
                            }}
                        >
                            <div className={styles.guideLabel}>
                                {getGuideDisplayText(guide)}
                                {guide.fixed && ' 🔒'}
                            </div>
                        </div>
                    ))}

                    <ResponsiveGridLayout
                        className={styles.reactGridLayout}
                        layouts={{
                            lg: validComponents.map(comp => ({
                                i: comp.id,
                                x: comp.x || 0,
                                y: comp.y || 0,
                                w: comp.type === 'title' ? screenSize.width : comp.w || 100, 
                                h: comp.h || 100,
                                isDraggable: comp.type !== 'title',
                                isResizable: comp.type !== 'title',
                                minW: 20,
                                minH: 20,
                                preserveAspectRatio: comp.type === 'circle'
                            }))
                        }}
                        breakpoints={{ lg: 1200 }}
                        cols={{ lg: cols }}
                        rowHeight={1}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onDragStart={onDragStart}
                        onDragStop={onDragStop}
                        onResize={onResize}
                        onResizeStop={onResizeStop}
                        preventCollision={false}
                        compactType={null}
                        verticalCompact={false}
                        allowOverlap={true}
                        isDroppable={true}
                        isResizable={true}
                        isDraggable={true}
                        margin={[0, 0]}
                        containerPadding={[0, 0]}
                        useCSSTransforms={true}
                        // draggableHandle=".grid-item"
                        draggableHandle={`.${styles.gridItem}`}
                    >
                        {validComponents.map(component => (
                            <div
                                key={component.id}
                                className={`
                                    ${styles.gridItem}
                                    ${selectedComponent?.id === component.id ? styles.selected : ''}
                                    ${!isComponentInScreenArea(component) ? styles.outsideScreen : ''}
                                `}
                                onClick={(e) => handleComponentClick(e, component.id)}
                                style={{
                                    zIndex: component.index || 0
                                }}
                                title={!isComponentInScreenArea(component) ? "此组件不在预览区域内" : ""}
                            >
                                <ComponentRenderer
                                    component={component}
                                    onInteraction={(updates) => handleComponentInteraction(component.id, updates)}
                                />
                                {!isComponentInScreenArea(component) && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                        pointerEvents: 'none',
                                        border: '1px dashed red'
                                    }} />
                                )}
                            </div>
                        ))}
                    </ResponsiveGridLayout>
                </div>
            </div>
        </div>
    );
};

export default Editor;