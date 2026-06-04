
import { create } from 'zustand';
import mqtt from 'mqtt';

// MQTT认证信息
const MQTT_USERNAME = '123';
const MQTT_PASSWORD = '123';

// 默认的topic列表
const DEFAULT_TOPICS = [
    'sensor/temperature',
    'sensor/humidity',
    'light/switch',
    'fan/speed',
    'device/status',
    'control/led',
    'control/motor',
    'gauge/value',
    'joystick/position',
    'chart/line',
    'chart/pie',
    'button/press',
    'switch/state',
    'slider/value'
];

const useStore = create((set, get) => ({
    components: [],
    selectedComponent: { id: 'screen', type: 'screen', name: '屏幕' },
    isRunning: false,
    showGrid: true,
    previewUrl: null,
    screenBackgroundColor:"#CDC1C1",
    // 运行相关状态
    serverUrl: '',
    qrCodeUrl: '',

    // 辅助线相关状态
    showGuides: false,
    guides: [],
    activeGuide: null,
    guidePosition: null,
    allGuidesFixed: false,

    // MQTT相关状态
    mqttConnected: false,
    mqttTopics: DEFAULT_TOPICS,
    mqttClient: null,
    mqttError: null,
    isLoadingTopics: false,

    // 屏幕尺寸相关
    screenSize: {
        width: 640,
        height: 480,
        name: '默认 (640x480)'
    },
    showScreenBorder: false,
    customSizes: [],


    // 在 useStore 的 create 函数中添加以下方法：

    // 保存项目到本地文件
    saveProject: () => {
        const state = get();
        const projectData = {
            version: '1.0',
            saveTime: new Date().toISOString(),
            components: state.components,
            screenBackgroundColor: state.screenBackgroundColor,
            screenSize: state.screenSize,
            showScreenBorder: state.showScreenBorder,
            showGuides: state.showGuides,
            guides: state.guides,
            allGuidesFixed: state.allGuidesFixed
        };

        // 创建 JSON 字符串
        const dataStr = JSON.stringify(projectData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // 创建下载链接
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `iot_project_${new Date().getTime()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return true;
    },

    // 从文件加载项目
    loadProject: (projectData) => {
        try {
            // 验证数据格式
            if (!projectData || !projectData.components || !projectData.screenSize) {
                throw new Error('无效的项目文件格式');
            }

            // 更新状态
            set({
                components: projectData.components || [],
                screenBackgroundColor: projectData.screenBackgroundColor || '#000000',
                screenSize: projectData.screenSize || { width: 640, height: 480, name: '默认 (640x480)' },
                showScreenBorder: projectData.showScreenBorder !== undefined ? projectData.showScreenBorder : true,
                showGuides: projectData.showGuides || false,
                guides: projectData.guides || [],
                allGuidesFixed: projectData.allGuidesFixed || false,
                selectedComponent: { id: 'screen', type: 'screen', name: '屏幕' },
                // 重置一些临时状态
                activeGuide: null,
                guidePosition: null,
                mqttConnected: false,
                mqttClient: null
            });

            return true;
        } catch (error) {
            console.error('加载项目失败:', error);
            throw error;
        }
    },

    // 清空当前项目
    newProject: () => {
        if (window.confirm('确定要创建新项目吗？当前未保存的更改将会丢失。')) {
            set({
                components: [],
                selectedComponent: { id: 'screen', type: 'screen', name: '屏幕' },
                screenBackgroundColor: '#000000',
                showGuides: false,
                guides: [],
                allGuidesFixed: false,
                activeGuide: null,
                guidePosition: null
            });
        }
    },
    addComponent: (type, props = {}) => {
        const components = get().components;
        const screenSize = get().screenSize;

        // 特殊处理：如果是 Title 组件，固定在顶部且不可移动
        if (type === 'title') {
            const existingTitle = components.find(comp => comp.type === 'title');
            if (existingTitle) {
                alert('只能添加一个 Title 组件');
                return existingTitle;
            }

            const titleComponent = {
                id: `title_${Date.now()}`,
                type,
                x: 30,
                y: 30,
                w: screenSize.width, // 横跨整个屏幕宽度
                h: 40, // 固定高度40像素
                name: '标题',
                isStatic: true,
                index: 1000,
                ...getDefaultProps(type),
                ...props
            };

            set(state => ({
                components: [...state.components, titleComponent],
                selectedComponent: titleComponent
            }));

            return titleComponent;
        }

        // 其他组件的默认像素尺寸
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
            default:
                defaultWidth = 100;
                defaultHeight = 100;
        }

        // 关键修改：判断添加方式
        let newX, newY;

        // 判断是否是拖拽添加（props中有位置信息）
        const isDragDrop = props.x !== undefined && props.y !== undefined;

        if (isDragDrop) {
            // 方式1：拖拽添加，使用拖拽位置
            newX = props.x !== undefined ? props.x : 30;
            newY = props.y !== undefined ? props.y : 30;
        } else {
            // 方式2：工具栏点击添加，固定位置 (30,30)
            newX = 30;
            newY = 80;
        }

        let newW = props.w !== undefined ? props.w : defaultWidth;
        let newH = props.h !== undefined ? props.h : defaultHeight;

        // 如果是拖拽添加，需要检查是否超出边界
        if (isDragDrop) {
            const editorWidth = 2000; // 编辑区域宽度
            const editorHeight = 2000; // 编辑区域高度

            // 确保位置不超出编辑区域
            newX = Math.max(0, Math.min(newX, editorWidth - newW));
            newY = Math.max(0, Math.min(newY, editorHeight - newH));
        }

        // 创建组件对象
        const componentNames = {
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
            lineChart: '折线图',
            pieChart: '饼状图',
            gauge: '仪表盘',
            joystick: '手柄'
        };

        const defaultName = componentNames[type] || type;
        const sameTypeComponents = components.filter(comp => comp.type === type);
        const sameTypeCount = sameTypeComponents.length;
        const nameSuffix = ` ${sameTypeCount + 1}`;

        const maxIndex = components.length > 0
            ? Math.max(...components.map(comp => comp.index || 0))
            : 0;

        const newComponent = {
            id: `comp_${Date.now()}`,
            type,
            x: newX,
            y: newY,
            w: newW,
            h: newH,
            name: `${defaultName}${nameSuffix}`,
            index: maxIndex + 1,
            ...getDefaultProps(type),
            ...props
        };

        set(state => ({
            components: [...state.components, newComponent],
            selectedComponent: newComponent
        }));

        return newComponent;
    },
    updateComponent: (id, updates) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type === 'title') {
            const { x, y, w, h, ...safeUpdates } = updates;
            set(state => ({
                components: state.components.map(comp =>
                    comp.id === id ? { ...comp, ...safeUpdates } : comp
                ),
                selectedComponent: state.selectedComponent?.id === id
                    ? { ...state.selectedComponent, ...safeUpdates }
                    : state.selectedComponent
            }));
        } else {
            set(state => ({
                components: state.components.map(comp =>
                    comp.id === id ? { ...comp, ...updates } : comp
                ),
                selectedComponent: state.selectedComponent?.id === id
                    ? { ...state.selectedComponent, ...updates }
                    : state.selectedComponent
            }));
        }
    },

    deleteComponent: (id) => {
        set(state => ({
            components: state.components.filter(comp => comp.id !== id),
            selectedComponent: state.selectedComponent?.id === id
                ? null
                : state.selectedComponent
        }));
    },

    selectComponent: (id) => {
        if (id === 'screen') {
            set({
                selectedComponent: { id: 'screen', type: 'screen', name: '屏幕' }
            });
        } else {
            const component = get().components.find(comp => comp.id === id);
            set({ selectedComponent: component });
        }
    },

    clearComponents: () => {
        set({ components: [], selectedComponent: { id: 'screen', type: 'screen', name: '屏幕' } });
    },

    updateScreenBackgroundColor: (color) => {
        set({ screenBackgroundColor: color });
    },

    bringToFront: (id) => {
        const components = get().components;
        const maxIndex = Math.max(...components.map(comp => comp.index || 0));

        set(state => ({
            components: state.components.map(comp =>
                comp.id === id ? { ...comp, index: maxIndex + 1 } : comp
            )
        }));
    },

    sendToBack: (id) => {
        const components = get().components;
        const minIndex = Math.min(...components.map(comp => comp.index || 0));

        set(state => ({
            components: state.components.map(comp =>
                comp.id === id ? { ...comp, index: minIndex - 1 } : comp
            )
        }));
    },

    // 对齐功能方法 - 修改为像素单位
    // 对齐功能方法 - 修改为只在屏幕区域内对齐
    alignComponentLeft: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type !== 'title') {
            const screenX = 30; // 屏幕区域左上角X坐标
            get().updateComponent(id, { x: screenX });
        }
    },

    alignComponentCenter: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type !== 'title') {
            const screenX = 30; // 屏幕区域左上角X坐标
            const screenWidth = get().screenSize.width;
            const centerX = Math.round(screenX + (screenWidth - component.w) / 2);
            get().updateComponent(id, { x: Math.max(screenX, centerX) });
        }
    },

    alignComponentRight: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type !== 'title') {
            const screenX = 30; // 屏幕区域左上角X坐标
            const screenWidth = get().screenSize.width;
            const rightX = screenX + screenWidth - component.w;
            get().updateComponent(id, { x: Math.max(screenX, rightX) });
        }
    },

    alignComponentTop: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type !== 'title') {
            const screenY = 30; // 屏幕区域左上角Y坐标
            get().updateComponent(id, { y: screenY });
        }
    },

    alignComponentMiddle: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type !== 'title') {
            const screenY = 30; // 屏幕区域左上角Y坐标
            const screenHeight = get().screenSize.height;
            const componentHeight = Math.min(component.h, screenHeight);
            const middleY = Math.max(screenY, Math.round(screenY + (screenHeight - componentHeight) / 2));
            get().updateComponent(id, { y: middleY });
        }
    },

    alignComponentBottom: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type !== 'title') {
            const screenY = 30; // 屏幕区域左上角Y坐标
            const screenHeight = get().screenSize.height;
            const componentHeight = Math.min(component.h, screenHeight);
            const bottomY = Math.max(screenY, screenY + screenHeight - componentHeight);
            get().updateComponent(id, { y: bottomY });
        }
    },

    // 辅助线相关方法 - 修改为像素单位
    toggleGuides: () => {
        set(state => ({ showGuides: !state.showGuides }));
    },

    addGuide: (type) => {
        const screenSize = get().screenSize;
        const newGuide = {
            id: `guide_${Date.now()}`,
            type,
            position: type === 'vertical' ? Math.floor(screenSize.width / 2) : Math.floor(screenSize.height / 2),
            fixed: false
        };

        set(state => ({
            guides: [...state.guides, newGuide],
            activeGuide: newGuide.id,
            guidePosition: {
                x: type === 'vertical' ? newGuide.position : null,
                y: type === 'horizontal' ? newGuide.position : null
            }
        }));
    },

    removeGuide: (id) => {
        set(state => ({
            guides: state.guides.filter(guide => guide.id !== id),
            activeGuide: state.activeGuide === id ? null : state.activeGuide,
            guidePosition: state.activeGuide === id ? null : state.guidePosition
        }));
    },

    removeAllGuides: () => {
        set({
            guides: [],
            allGuidesFixed: false,
            activeGuide: null,
            guidePosition: null
        });
    },

    updateGuidePosition: (id, position) => {
        const guide = get().guides.find(g => g.id === id);
        if (guide && (get().allGuidesFixed || guide.fixed)) return;

        set(state => ({
            guides: state.guides.map(guide =>
                guide.id === id ? { ...guide, position } : guide
            ),
            guidePosition: state.activeGuide === id ?
                {
                    x: state.guides.find(g => g.id === id)?.type === 'vertical' ? position : state.guidePosition?.x,
                    y: state.guides.find(g => g.id === id)?.type === 'horizontal' ? position : state.guidePosition?.y
                } : state.guidePosition
        }));
    },

    toggleFixAllGuides: () => {
        set(state => {
            const newFixedState = !state.allGuidesFixed;
            const updatedGuides = state.guides.map(guide => ({
                ...guide,
                fixed: newFixedState
            }));

            let newActiveGuide = state.activeGuide;
            let newGuidePosition = state.guidePosition;
            if (newFixedState && state.activeGuide) {
                newActiveGuide = null;
                newGuidePosition = null;
            }

            return {
                guides: updatedGuides,
                allGuidesFixed: newFixedState,
                activeGuide: newActiveGuide,
                guidePosition: newGuidePosition
            };
        });
    },

    toggleFixGuide: (id) => {
        set(state => {
            const updatedGuides = state.guides.map(guide =>
                guide.id === id ? { ...guide, fixed: !guide.fixed } : guide
            );

            let newActiveGuide = state.activeGuide;
            let newGuidePosition = state.guidePosition;
            if (id === state.activeGuide) {
                newActiveGuide = null;
                newGuidePosition = null;
            }

            const allFixed = updatedGuides.length > 0 && updatedGuides.every(guide => guide.fixed);

            return {
                guides: updatedGuides,
                allGuidesFixed: allFixed,
                activeGuide: newActiveGuide,
                guidePosition: newGuidePosition
            };
        });
    },

    setActiveGuide: (id) => {
        const guide = get().guides.find(g => g.id === id);
        if (guide && (get().allGuidesFixed || guide.fixed)) return;

        set({
            activeGuide: id,
            guidePosition: guide ? {
                x: guide.type === 'vertical' ? guide.position : null,
                y: guide.type === 'horizontal' ? guide.position : null
            } : null
        });
    },

    clearActiveGuide: () => {
        set({
            activeGuide: null,
            guidePosition: null
        });
    },

    // MQTT连接方法

        connectMQTT: async () => {
            try {
                const wsUrl = 'ws://localhost:8099';
                const options = {
                    username: MQTT_USERNAME,
                    password: MQTT_PASSWORD,
                    keepalive: 60,
                    reconnectPeriod: 1000,
                    connectTimeout: 30 * 1000,
                    clientId: `mqtt_${Math.random().toString(16).substr(2, 8)}`,
                    clean: true
                };

                console.log('尝试连接MQTT，使用认证:', { username: MQTT_USERNAME });
                const client = mqtt.connect(wsUrl, options);

                client.on('connect', () => {
                    console.log('MQTT连接成功');
                    set({
                        mqttConnected: true,
                        mqttClient: client,
                        mqttError: null
                    });

                    // 立即获取一次topic列表
                    get().fetchTopics();

                    // 订阅所有现有组件的topic
                    const components = get().components;
                    components.forEach(component => {
                        if (component.topic && component.topic.trim() !== '') {
                            client.subscribe(component.topic, { qos: 0 });
                            console.log('订阅topic:', component.topic);
                        }
                    });
                });

                client.on('message', (topic, message) => {
                    const msgStr = message.toString();
                    console.log('收到MQTT消息:', topic, msgStr);

                    // 处理MQTT消息
                    const components = get().components;
                    components.forEach(component => {
                        if (component.topic === topic) {
                            handleMQTTMessage(component, topic, msgStr, get);
                        }
                    });
                });

                client.on('error', (err) => {
                    console.error('MQTT连接错误:', err);
                    set({
                        mqttConnected: false,
                        mqttError: err.message
                    });
                    alert('MQTT连接失败: ' + err.message);
                });

                client.on('close', () => {
                    console.log('MQTT连接关闭');
                    set({
                        mqttConnected: false,
                        mqttError: '连接已关闭'
                    });
                });

                client.on('offline', () => {
                    console.log('MQTT离线');
                    set({
                        mqttConnected: false,
                        mqttError: '网络连接已断开'
                    });
                });

                // 设置连接超时检测
                setTimeout(() => {
                    if (!get().mqttConnected) {
                        set({
                            mqttConnected: false,
                            mqttError: '连接超时，请检查MQTT服务是否正常运行'
                        });
                        alert('MQTT连接超时，请检查MQTT服务是否正常运行');
                    }
                }, 10000);

            } catch (error) {
                console.error('MQTT连接异常:', error);
                set({
                    mqttConnected: false,
                    mqttError: error.message
                });
                alert('连接MQTT Broker失败: ' + error.message);
            }
        },

        fetchTopics: async () => {
            set({ isLoadingTopics: true, mqttError: null });

            try {
                console.log('🔄 开始从 http://localhost:3000 获取 topic 列表...');

                // 使用正确的认证信息
                const username = '123'; // MQTT_USERNAME
                const password = '123'; // MQTT_PASSWORD

                const response = await fetch('http://localhost:3000/api/topics', {
                    method: 'GET',
                    credentials: 'include', // 重要：包含认证信息
                    headers: {
                        'x-mqtt-username': username,
                        'x-mqtt-password': password,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('📡 服务器响应状态:', response.status, response.statusText);

                if (response.ok) {
                    const topicData = await response.json();
                    console.log('📊 服务器返回的 topic 数据:', topicData);

                    if (Array.isArray(topicData)) {
                        // 提取 topic 字段
                        const topics = topicData.map(item => item.topic).filter(topic => topic && topic.trim() !== '');

                        console.log(`✅ 成功从服务器获取 ${topics.length} 个 topics`);

                        if (topics.length > 0) {
                            // 添加项目中的额外 topics
                            const components = get().components;
                            const existingTopics = new Set(topics);

                            components.forEach(component => {
                                if (component.topic && component.topic.trim() !== '' && !existingTopics.has(component.topic)) {
                                    topics.push(component.topic);
                                    existingTopics.add(component.topic);
                                }
                            });

                            set({ mqttTopics: topics });
                        } else {
                            // 服务器返回空数组，使用本地 topics
                            const localTopics = [...DEFAULT_TOPICS];
                            const components = get().components;
                            components.forEach(component => {
                                if (component.topic && component.topic.trim() !== '' && !localTopics.includes(component.topic)) {
                                    localTopics.push(component.topic);
                                }
                            });

                            set({
                                mqttTopics: localTopics,
                                mqttError: '服务器返回空的 topic 列表，使用本地默认列表'
                            });
                        }
                    } else {
                        console.warn('⚠️ 服务器返回的数据不是数组，使用本地默认 topics');
                        // 使用本地默认 topics
                        const localTopics = [...DEFAULT_TOPICS];
                        const components = get().components;
                        components.forEach(component => {
                            if (component.topic && component.topic.trim() !== '' && !localTopics.includes(component.topic)) {
                                localTopics.push(component.topic);
                            }
                        });

                        set({ mqttTopics: localTopics });
                    }
                } else if (response.status === 401) {
                    const errorText = await response.text();
                    console.error('❌ 认证失败:', response.status, errorText);

                    set({
                        mqttError: '认证失败，请检查用户名和密码',
                        mqttTopics: DEFAULT_TOPICS
                    });

                    // 尝试使用本地 topics
                    const localTopics = [...DEFAULT_TOPICS];
                    const components = get().components;
                    components.forEach(component => {
                        if (component.topic && component.topic.trim() !== '' && !localTopics.includes(component.topic)) {
                            localTopics.push(component.topic);
                        }
                    });

                    set({ mqttTopics: localTopics });
                } else {
                    const errorText = await response.text();
                    console.error('❌ 获取 topics 失败:', response.status, errorText);

                    // 使用本地 topics
                    const localTopics = [...DEFAULT_TOPICS];
                    const components = get().components;
                    components.forEach(component => {
                        if (component.topic && component.topic.trim() !== '' && !localTopics.includes(component.topic)) {
                            localTopics.push(component.topic);
                        }
                    });

                    set({
                        mqttError: `服务器错误 (${response.status})，使用本地列表`,
                        mqttTopics: localTopics
                    });
                }
            } catch (error) {
                console.error('❌ 获取 topics 时发生网络错误:', error);

                // 使用本地 topics
                const localTopics = [...DEFAULT_TOPICS];
                const components = get().components;
                components.forEach(component => {
                    if (component.topic && component.topic.trim() !== '' && !localTopics.includes(component.topic)) {
                        localTopics.push(component.topic);
                    }
                });

                set({
                    mqttTopics: localTopics,
                    mqttError: `网络错误: ${error.message}`
                });
            } finally {
                set({ isLoadingTopics: false });
            }
        },

        // 辅助函数：处理 topic 数据
        processTopicData: (topicData) => {
            if (Array.isArray(topicData) && topicData.length > 0) {
                // 提取topic字段，组成字符串数组
                const topics = topicData.map(item => item.topic).filter(topic => topic);
                console.log('从服务器获取到topics:', topics);
                set({ mqttTopics: topics });
                return topics;
            } else {
                // 如果没有数据，使用空数组
                console.log('服务器返回空的topic列表');
                set({ mqttTopics: [] });
                return [];
            }
        },

        // 断开MQTT连接
        disconnectMQTT: () => {
            const { mqttClient } = get();
            if (mqttClient) {
                mqttClient.end();
            }
            set({
                mqttConnected: false,
                mqttClient: null,
                mqttTopics: DEFAULT_TOPICS,
                mqttError: null
            });
        },

        // 发布MQTT消息
        publishMQTT: (topic, message) => {
            const { mqttClient, mqttConnected } = get();
            if (mqttConnected && mqttClient) {
                mqttClient.publish(topic, message.toString(), { qos: 0 });
                console.log('发布MQTT消息:', topic, message);
            } else {
                console.warn('MQTT未连接，无法发布消息');
            }
        },

        // 手动刷新topic列表
        refreshTopics: () => {
            get().fetchTopics();
        },

        // 订阅topic（当组件添加或修改topic时调用）
        subscribeTopic: (topic) => {
            const { mqttClient, mqttConnected } = get();
            if (mqttConnected && mqttClient && topic && topic.trim() !== '') {
                mqttClient.subscribe(topic, { qos: 0 });
                console.log('新订阅topic:', topic);

                // 添加到topic列表（如果不在列表中）
                const { mqttTopics } = get();
                if (!mqttTopics.includes(topic)) {
                    set({ mqttTopics: [...mqttTopics, topic] });
                }
            }
        },

        // 添加自定义topic
        addCustomTopic: (topic) => {
            const { mqttTopics } = get();
            if (topic && topic.trim() !== '' && !mqttTopics.includes(topic)) {
                set({ mqttTopics: [...mqttTopics, topic] });
            }
        },

    // 屏幕尺寸相关方法
    updateScreenSize: (size) => {
        set(state => {
            // 更新屏幕尺寸
            const newState = { screenSize: size };

            // ✅ 同时更新所有Title组件的宽度
            const updatedComponents = state.components.map(comp => {
                if (comp.type === 'title') {
                    return {
                        ...comp,
                        w: size.width,  // 更新Title宽度
                    };
                }
                return comp;
            });

            return {
                ...newState,
                components: updatedComponents  // 返回更新后的组件列表
            };
        });
    },
    toggleScreenBorder: () => set(state => ({ showScreenBorder: !state.showScreenBorder })),
    addCustomSize: (size) =>
        set(state => {
            // 检查是否已存在
            const exists = state.customSizes.some(
                s => s.width === size.width && s.height === size.height
            );

            if (!exists) {
                return {
                    customSizes: [...state.customSizes, size].slice(-5) // 只保留最近5个
                };
            }
            return state;
        }),

    // 运行项目
    generatePreview: async () => {
        try {
            set({ isRunning: true });

            // 获取项目数据
            const state = get();
            const projectData = {
                components: state.components,
                screenBackgroundColor: state.screenBackgroundColor,
                screenSize: state.screenSize,
                showScreenBorder: state.showScreenBorder
            };

            // 发送到服务器
            const response = await fetch('http://localhost:3001/api/project', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData)
            });

            if (response.ok) {
                const serverInfoResponse = await fetch('http://localhost:3001/api/server-info');
                const serverInfo = await serverInfoResponse.json();

                const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(serverInfo.url)}`;

                set({
                    serverUrl: serverInfo.url,
                    qrCodeUrl: qrCodeUrl
                });
            }
        } catch (error) {
            console.error('启动预览失败:', error);
            alert('启动预览失败，请确保服务器正在运行');
            set({ isRunning: false });
        }
    },

    // 停止预览
    stopPreview: () => {
        set({
            isRunning: false,
            serverUrl: '',
            qrCodeUrl: ''
        });
    },

    toggleGrid: () => {
        set(state => ({ showGrid: !state.showGrid }));
    }
}));

// 处理MQTT消息的函数（保持不变）
// ... 保持不变 ...

const getDefaultProps = (type) => {
    const defaults = {
        title: {
            text: '标题',
            fontSize: 16,
            color: '#ffffff',
            backgroundColor: '#000000',
            colorTransparent: false,
            backgroundColorTransparent: false,
            fontWeight: 'bold',
            textAlign: 'center',
            index: 0
        },
        label: {
            text: '标签',
            fontSize: 12,
            color: '#ffffff',
            backgroundColor: '#000000',
            colorTransparent: false,
            backgroundColorTransparent: false,
            fontWeight: 'normal',
            index: 0
        },
        rectangle: {
            backgroundColor: '#3498db',
            borderColor: '#2980b9',
            backgroundColorTransparent: false,
            borderColorTransparent: false,
            index: 0
        },
        circle: {
            backgroundColor: '#e74c3c',
            borderColor: '#c0392b',
            backgroundColorTransparent: false,
            borderColorTransparent: false,
            index: 0
        },
        line: {
            strokeColor: '#ffffff',
            strokeWidth: 2,
            strokeColorTransparent: false,
            index: 0
        },
        image: {
            src: '',
            index: 0
        },
        text: {
            text: '文本',
            fontSize: 12,
            color: '#ffffff',
            backgroundColor: '#000000',
            colorTransparent: false,
            backgroundColorTransparent: false,
            fontWeight: 'normal',
            topic: '',
            index: 0
        },
        button: {
            text: '按钮',
            fontSize: 12,
            color: '#ffffff',
            backgroundColor: '#27ae60',
            colorTransparent: false,
            backgroundColorTransparent: false,
            topic: '',
            pressed: false,
            index: 0
        },
        switch: {
            backgroundColor: '#95a5a6',
            onColor: '#27ae60',
            backgroundColorTransparent: false,
            onColorTransparent: false,
            topic: '',
            value: false,
            index: 0
        },
        slider: {
            min: 0,
            max: 100,
            value: 50,
            fillColor: '#3498db',
            fillColorTransparent: false,
            topic: '',
            index: 0
        },
        barChart: {
            data: [
                { name: 'A', value: 40 },
                { name: 'B', value: 60 },
                { name: 'C', value: 80 }
            ],
            topic: '',
            color: '#3498db',
            colorTransparent: false,
            index: 0,
            xAxisKey: 'name',
            yAxisKey: 'value',
            xAxisName: '类别',
            yAxisName: '数值',
            showGrid: true,
            showXAxis: true,
            showYAxis: true,
            showTooltip: true,
            barSize: 30,
            barRadius: 0,
            chartMargin: {
                top: 5,
                right: 5,
                left: 5,
                bottom: 5
            }
        },
        lineChart: {
            data: [
                { name: '一月', value: 30 },
                { name: '二月', value: 40 },
                { name: '三月', value: 35 },
                { name: '四月', value: 50 },
                { name: '五月', value: 55 },
                { name: '六月', value: 60 }
            ],
            topic: '',
            color: '#3498db',
            colorTransparent: false,
            strokeWidth: 2,
            index: 0,
            xAxisKey: 'name',
            yAxisKey: 'value',
            xAxisName: '月份',
            yAxisName: '数值',
            showGrid: true,
            showXAxis: true,
            showYAxis: true,
            showTooltip: true,
            showLine: true,
            showPoints: true,
            lineType: 'monotone'
        },
        pieChart: {
            data: [
                { name: '类别A', value: 40, color: '#3498db' },
                { name: '类别B', value: 30, color: '#2ecc71' },
                { name: '类别C', value: 20, color: '#e74c3c' },
                { name: '类别D', value: 10, color: '#f39c12' }
            ],
            topic: '',
            index: 0,
            showLabel: true,
            showPercentage: true,
            innerRadius: 0,
            outerRadius: '80%'
        },
        gauge: {
            name: '仪表盘',
            topic: '',
            value: 50,
            min: 0,
            max: 100,
            color: '#3498db',
            colorTransparent: false,
            unit: '%',
            index: 0,
            showValue: true,
            showRange: true,
            arcWidth: 10,
            startAngle: 180,
            endAngle: 0
        },
        joystick: {
            name: '手柄',
            topic: '',
            xValue: 0,
            yValue: 0,
            xMin: -100,
            xMax: 100,
            yMin: -100,
            yMax: 100,
            color: '#34495e',
            colorTransparent: false,
            index: 0,
            showValues: false,
            returnToCenter: true
        }
    };

    return defaults[type] || {};
};


export default useStore;