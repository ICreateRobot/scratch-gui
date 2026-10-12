import { useState, useEffect, useRef } from 'react';
import formatMessage  from 'format-message';
import { setIsMaster, setIsBricks, getIsBricks, setRobotIp, setCurrent, getCurrent } from '../utils/utils.js';
import codeModule from '../../../../../utils/global.js';
import { getIsCode, setIsCode } from '../../../../../utils/whatModule.js';
import { setAdd } from '../../../../../utils/isAddMaster.js';
import { setLan, getLan } from '../../../../../utils/lanMode.js';
import { setIsRobot, getShowCodeDb, setShowCodeDb, addLoadExtension, delLoadExtension, getLoadExtension, getAllLoaded, setAllLoaded, codeArray,setIsAiMode,getIsAiMode } from 'scratch-gui/src/components/utils/utils.js';

let attemptCount = 0;
let extensionSelect = [false, false, false,false,false,false];
let isRecive = false;
let isUpLoadMode = false;
let IP;
let reciveTimer = '';
let hasReceivedResponse = false;
let isPostIp = false;
let socketSuccess = false;
let socketTimer;
let whatConnect = [0, 0, 0];
let bleDownloadTimer;
let serialDownloadTimer;
let isUnMount = false;

export const useGuiLogic = (props) => {
    const {
        onExtensionButtonClick,
        onOpenCustomExtensionModal,
        download,
        SerialDownload,
        saveCode,
        loadCode,
        cancelload,
        clickDownloadCode,
        clickEspSend,
        clickSendWifi,
    } = props;

    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(1);
    const [pythonCode, setPythonCode] = useState('print("Hello, World!")');
    const [childData, setChildData] = useState(1);
    const [isTrain, setIsTrain] = useState(false);
    const [isBricks, setbricks] = useState(false);
    const [showCode, setShowCode] = useState(getShowCodeDb());
    const [lanMode, setLanMode] = useState(getLan());
    const [isDown, setIsDown] = useState(false);
    // const [currentExtension, setCurrentExtension] = useState('2');
    const [currentExtension, setCurrentExtension] = useState(() => {
        const current = getCurrent();
        if (current === 'ICBricks') return '1';
        if (current === 'ICRobot') return '2';
        if (current === 'Microbit') return '3';
        if (current === 'ArduinoUno') return '4';
        if (current === 'py32') return '5';
        if (current === 'ic2007') return '6';
        return ''; // 包括 '' 或其他情况
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);
    const [logs, setLogs] = useState([]);
    const [extensionName, setExtensionName] = useState(getCurrent().length > 0 ? getCurrent() : '选择设备');
    const [childBalls, setChildBalls] = useState([
        { image: '', text: '1', data: '', isShow: false },
        { image: '', text: '2', data: '', isShow: false },
        { image: '', text: '3', data: '', isShow: false },
        { image: '', text: '4', data: '', isShow: false },
        { image: '', text: '5', data: '', isShow: false },
        { image: '', text: '6', data: '', isShow: false },
        { image: '', text: '7', data: '', isShow: false },
        { image: '', text: '8', data: '', isShow: false },
    ]);
    const [socket, setSocket] = useState(null);
    const [soc, setSoc] = useState(null);
    const [upload, setUpload] = useState(null);
    const [data, setData] = useState('');
    const [selectedOption, setSelectedOption] = useState('');
    const currentModelValue= showCode ? 'upload':'interactive'
    const [modeValue, setModeValue] = useState(currentModelValue); // 控制 ModeToggle 状态

    const portArr = [7, 0, 6, 1, 5, 2, 4, 3];
    const channelMode = new BroadcastChannel('mode');
    const channel1 = new BroadcastChannel('extensionSecondly');
    const channel2 = new BroadcastChannel('startRobotSocket');
    const channelBleIsDown = new BroadcastChannel('ble-download');
    const channelLoadExtension = new BroadcastChannel('loadExtension');
    const channelHostPot = new BroadcastChannel('hostpot');
    const channelSendIp = new BroadcastChannel('sendIp');
    const channelTrain = new BroadcastChannel('channelTrain');
    const stopAll = new BroadcastChannel('stopAll');
    const channel = new BroadcastChannel('distance_channel');
    const channelMasterClose = new BroadcastChannel('master_close');
    const channelLoad = new BroadcastChannel('isLoading');
    const bleChangeMode = new BroadcastChannel('ble-change')
    const channelLoadExample = new BroadcastChannel('load_example')
    const channelProjectExtension = new BroadcastChannel('project_extension')

    //选择设备后将模块置灰
    const channelGrayBlock = new BroadcastChannel('gray-block')

    const [showIot, setShowIot] = useState(false);
    const [aiMode,setAiMode] = useState(getIsAiMode())

    const [flashLogs, setFlashLogs] = useState('');
    const [showFlash, setShowFlash] = useState(false);

    useEffect(() => {
        window.EditorPreload.sendArduinoFlash((flash) => {
            console.log(flash);

            if(flash.includes('start compile')){
                setFlashLogs('')
                setShowFlash(true);
            }
            
            

            setFlashLogs(prev => {
                if (!prev) {
                    return String(flash);
                }

                return prev + String(flash);
            });

            // if(flash.includes('DONE')) {
            //     setShowFlash(false)
            //     setFlashLogs('')
            // };
            // if(flash.includes('ERROR: No PY32 bootloader found on')){
            //     alert('请确保当前端口已连接设备')
            //     setShowFlash(false)
            //     setFlashLogs('')
            // }
        });
    },[])

    useEffect(() => {
        channelProjectExtension.addEventListener('message',(event)=>{
            let data=JSON.parse(event.data)
            console.log(data)
            if(data.type=='load'){
                for(let i=0;i<data.extension.length;i++){
                    addLoadExtension(data.extension[i])
                    setAllLoaded(data.extension[i])
                }
            }
            
        })
    },[])
    

    useEffect(() => {
        console.log('abcdefg:'+currentExtension)

    }, [currentExtension]);

    useEffect(() => {
        const newSocket = new WebSocket('ws://localhost:48219');
        setSocket(newSocket);

        newSocket.addEventListener('open', (event) => {
        console.log('WebSocket connection opened');
        });

        // Handle incoming WebSocket messages
        newSocket.addEventListener('message', (event) => {
            // console.log(event.data)
            // console.log(JSON.parse(event.data))
            let sensorState=JSON.parse(event.data)
        //   let distance = event.data.split(',');
        //   distance = distance.map(Number);

        channel.postMessage(sensorState);  // 广播数据给其他页面

        });
    // Cleanup WebSocket connection when component unmounts
    return () => {
        console.log('Cleaning up WebSocket connection');
        newSocket.close();
        };
    }, []); // Empty dependency array to run only once
    useEffect(() => {
        channelLoad.addEventListener('message',(event)=>{
            if(!event.data){
                setIsLoading(event.data)
            }else{
                setIsLoading(event.data)
            }
        })
    }, []);

    useEffect(() => {
        console.log('发送了一次当前模式');
        channelMode.postMessage(!getShowCodeDb());
    }, []);

    useEffect(() => {
        channel2.addEventListener('message', (event) => {
            if (event.data == 'response') {
                hasReceivedResponse = true;
            }
        });
    }, []);

    useEffect(() => {
        channelTrain.addEventListener('message', (event) => {
            setIsTrain(event.data);
        });
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setPythonCode(prevCode => codeModule.getCode());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setbricks(prevCode => getIsBricks());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const handleOffline = () => {
            console.log(socketRef.current?.readyState)
            socketRef.current?.send(JSON.stringify({
                type: 'offline',
                data: { message: 'true' }
            }));
            whatConnect[1] = 0;
            channelHostPot.postMessage(false);
            console.log('Offline event handled');
        };

        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('offline', handleOffline); //  清除绑定，防止重复
        };
    }, []); //  空依赖数组，确保只绑定一次
    const handleLoadSelectedCode = (index) => {
        const codeIndex = index ?? selectedIndex; // 👈 如果传了参数就用参数
        console.log('代码索引', codeIndex)
        const code = codeArray[codeIndex - 1];
        codeModule.setCode(code);
    };

    const handleChildData = async (data) => {
        setChildData(data + 1);
        console.log('子组件传来的数据:', data);
        downloadCodeTotal(data + 1);
    };

    function modifyPythonCode(code) {
        const lines = code.split('\n');
        let modifiedLines = [];
        let insideWhile = false;
        let whileStack = [];
        let importTimeAdded = false;
        let addedSleepLines = new Set();

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            modifiedLines.push(line);

            let trimmed = line.trim();
            let indentLevel = line.match(/^ */)[0].length;

            if (/^while\b.*:\s*$/.test(trimmed)) {
                whileStack.push({
                    startLine: i,
                    indent: indentLevel,
                    lineTrackingFound: false,
                    bodyStart: null
                });
            }

            if (whileStack.length > 0) {
                const currentWhile = whileStack[whileStack.length - 1];

                if (currentWhile.bodyStart === null && indentLevel > currentWhile.indent) {
                    currentWhile.bodyStart = i;
                }

                if (trimmed.includes('icrobot.rgb_sensor.line_tracking')) {
                    currentWhile.lineTrackingFound = true;
                }

                if (i > currentWhile.startLine && indentLevel <= currentWhile.indent) {
                    if (currentWhile.lineTrackingFound && currentWhile.bodyStart !== null) {
                        let insertIndent = ' '.repeat(currentWhile.indent + 4);
                        modifiedLines.splice(i, 0, insertIndent + 'time.sleep(0.05)');
                        i++;
                    }
                    whileStack.pop();
                }
            }
        }

        whileStack.forEach(w => {
            if (w.lineTrackingFound && w.bodyStart !== null) {
                let insertIndent = ' '.repeat(w.indent + 4);
                modifiedLines.push(insertIndent + 'time.sleep(0.05)');
            }
        });

        return modifiedLines.join('\n');
    }

    function checkAiModelInitialization(code) {
        // 代码完全没有使用 icrobot.ai，不需要检查
        if (!code.includes('icrobot.ai')) {
            return true;
        }
    
        const aiModels = [
            {
                name: formatMessage({
                    id: 'gui.extension.robotqr.name',
                    default: 'QR Code Recognition',
                    description: 'gui.extension.robotqr.name'
                }),
                apis: [
                    'icrobot.ai.qr_isrecognized(',
                    'icrobot.ai.get_qr_information('
                ],
                initApi: 'icrobot.ai.set_model(icrobot.ai.qr_recognition)'
            },
            {
                name: formatMessage({
                    id: 'gui.extension.robotapriltag.name',
                    default: 'AprilTag Recognition',
                    description: 'gui.extension.robotapriltag.name'
                }),
                apis: [
                    'icrobot.ai.apriltag_isrecognized(',
                    'icrobot.ai.get_apriltag_information(',
                    'icrobot.ai.get_apriltag_location(',
                    'icrobot.ai.get_apriltag_size('
                ],
                initApi: 'icrobot.ai.set_model(icrobot.ai.apriltag_recognition)'
            },
            {
                name: formatMessage({
                    id: 'gui.extension.robotface.name',
                    default: 'Face Recognition',
                    description: 'gui.extension.robotface.name'
                }),
                apis: [
                    'icrobot.ai.face_isdetected(',
                    'icrobot.ai.get_face_number(',
                    'icrobot.ai.get_face_location('
                ],
                initApi: 'icrobot.ai.set_model(icrobot.ai.face_detection)'
            },
            {
                name: formatMessage({
                    id: 'gui.extension.robotcolorxy.name',
                    default: 'Color Coordinate Tracking',
                    description: 'gui.extension.robotcolorxy.name'
                }),
                apis: [
                    'icrobot.ai.color_istracked(',
                    'icrobot.ai.set_color_tracking(',
                    'icrobot.ai.get_color_location('
                ],
                initApi: 'icrobot.ai.set_model(icrobot.ai.color_tracking)'
            },
            {
                name: formatMessage({
                    id: 'gui.extension.robotcat.name',
                    default: 'Cat Face Recognition',
                    description: 'gui.extension.robotcat.name'
                }),
                apis: [
                    'icrobot.ai.cat_isdetected(',
                    'icrobot.ai.get_cat_number(',
                    'icrobot.ai.get_cat_location('
                ],
                initApi: 'icrobot.ai.set_model(icrobot.ai.cat_detection)'
            }
        ];
    
        // 逐个检查 AI 模型
        for (const model of aiModels) {
    
            // 判断代码中是否真正使用了这个模型的 API
            const isUsed = model.apis.some(api => code.includes(api));
    
            // 没有使用这个模型，跳过
            if (!isUsed) {
                continue;
            }
    
            // 使用了，但是没有初始化
            if (!code.includes(model.initApi)) {
                // alert(
                //     `AI模型初始化错误\n\n` +
                //     `检测到代码使用了【${model.name}】相关功能，` +
                //     `但是没有初始化对应的AI模型。\n\n` +
                //     `请添加：\n${model.name}对应的初始化模块`
                // );
                alert(
                    formatMessage({
                        id: 'gui.robot.aicode1',
                        default: 'AI model initialization error',
                        description: 'gui.robot.aicode1'
                    })+`\n\n`+
                    formatMessage({
                        id: 'gui.robot.aicode2',
                        default: 'Detected that the code uses 【',
                        description: 'gui.robot.aicode2'
                    })+`${model.name}`+
                    formatMessage({
                        id: 'gui.robot.aicode3',
                        default: '】-related features,',
                        description: 'gui.robot.aicode3'
                    })+
                    formatMessage({
                        id: 'gui.robot.aicode4',
                        default: 'but the corresponding AI model has not been initialized.',
                        description: 'gui.robot.aicode4'
                    })+`\n\n`+
                    formatMessage({
                        id: 'gui.robot.aicode5',
                        default: 'Please add:',
                        description: 'gui.robot.aicode5'
                    })+`\n${model.name}`+
                    formatMessage({
                        id: 'gui.robot.aicode6',
                        default: 'the corresponding initialization module',
                        description: 'gui.robot.aicode6'
                    })

                )
    
                return false;
            }
        }
    
        return true;
    }

    // function getAudioAssetId(name){
    //     for(let i=0; i<name.length;i++){
            
    //     }
    // }

    // function getAllSounds(vm) {
    //     const sounds = [];
    
    //     vm.runtime.targets.forEach(target => {
    //         if (target.sprite && Array.isArray(target.sprite.sounds)) {
    //             sounds.push(...target.sprite.sounds);
    //         }
    //     });
    
    //     return sounds;
    // }
    // function getSoundMd5ByNames(vm, names) {
    //     const sounds = getAllSounds(vm);
    
    //     return names
    //         .map(name => {
    //             const sound = sounds.find(sound => sound.name === name);
    //             return sound ? sound.md5 : null;
    //         })
    //         .filter(md5 => md5 !== null);
    // }

    // // async function getSoundData(codeAudioName) {
    // //     const md5 = getSoundMd5ByNames(vm, codeAudioName);
    
    // //     console.log('音频文件:', md5);
    
    // //     const currentURL = window.location.href;
    
    // //     // 获取前一级路径
    // //     const oneLevelUp = currentURL.substring(0, currentURL.lastIndexOf('/'));
    
    // //     // 获取前两级路径
    // //     const twoLevelsUp = oneLevelUp.substring(0, oneLevelUp.lastIndexOf('/'));
    
    // //     const assetsPath = twoLevelsUp + '/assets';
    
    // //     const result = [];
    
    // //     for (let i = 0; i < md5.length; i++) {
    // //         const response = await fetch(`${assetsPath}/${md5[i]}`);
    
    // //         if (!response.ok) {
    // //             console.error(`音频加载失败: ${md5[i]}`);
    // //             continue;
    // //         }
    
    // //         const arrayBuffer = await response.arrayBuffer();
    
    // //         // 原始音频解码
    // //         const audioContext = new AudioContext();
    
    // //         const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // //         /*
    // //          * 使用 OfflineAudioContext：
    // //          * 1. 声道数 = 1
    // //          * 2. 采样率 = 16000
    // //          */
    // //         const targetSampleRate = 16000;
    // //         const targetChannels = 1;
    
    // //         const targetLength = Math.ceil(
    // //             audioBuffer.duration * targetSampleRate
    // //         );
    
    // //         const offlineContext = new OfflineAudioContext(
    // //             targetChannels,
    // //             targetLength,
    // //             targetSampleRate
    // //         );
    
    // //         const source = offlineContext.createBufferSource();
    
    // //         source.buffer = audioBuffer;
    
    // //         source.connect(offlineContext.destination);
    
    // //         source.start(0);
    
    // //         // 渲染重采样后的音频
    // //         const renderedBuffer = await offlineContext.startRendering();
    
    // //         console.log(`处理后音频: ${md5[i]}`);
    // //         console.log('采样率:', renderedBuffer.sampleRate);
    // //         console.log('声道数:', renderedBuffer.numberOfChannels);
    // //         console.log('采样点数量:', renderedBuffer.length);
    // //         console.log('时长:', renderedBuffer.duration);
    
    // //         /*
    // //          * 获取单声道 Float32 数据
    // //          *
    // //          * 因为 OfflineAudioContext 已经设置为 1 声道，
    // //          * 所以这里直接获取第 0 个声道。
    // //          */
    // //         const float32Data = renderedBuffer.getChannelData(0);
    
    // //         /*
    // //          * Float32 [-1.0, 1.0]
    // //          * 转换成 16-bit PCM
    // //          *
    // //          * Int16 范围：
    // //          * -32768 ~ 32767
    // //          */
    // //         const pcm16 = new Int16Array(float32Data.length);
    
    // //         for (let j = 0; j < float32Data.length; j++) {
    // //             let sample = float32Data[j];
    
    // //             // 防止超过 [-1, 1]
    // //             sample = Math.max(-1, Math.min(1, sample));
    
    // //             if (sample < 0) {
    // //                 pcm16[j] = sample * 32768;
    // //             } else {
    // //                 pcm16[j] = sample * 32767;
    // //             }
    // //         }
    
    // //         console.log('PCM16:', pcm16);
    // //         console.log('PCM16 字节数:', pcm16.byteLength);
    
    // //         result.push({
    // //             name: md5[i],
    // //             sampleRate: 16000,
    // //             channels: 1,
    // //             bitsPerSample: 16,
    // //             data: pcm16
    // //         });
    
    // //         // 释放 AudioContext
    // //         await audioContext.close();
    // //     }
    
    // //     return result;
    // // }
    // async function getSoundData(codeAudioName) {
    //     const sounds = getAllSounds(vm);
    
    //     const result = [];
    
    //     for (let i = 0; i < codeAudioName.length; i++) {
    //         const audioName = codeAudioName[i];
    
    //         // 根据声音名称找到对应的 sound
    //         const sound = sounds.find(sound => sound.name === audioName);
    
    //         if (!sound) {
    //             console.error(`没有找到音频: ${audioName}`);
    //             continue;
    //         }
    
    //         // 直接使用 sound.asset.data
    //         const audioData = sound.asset && sound.asset.data;
    
    //         if (!audioData) {
    //             console.error(`音频没有 data 数据: ${audioName}`);
    //             continue;
    //         }
    
    //         console.log('音频名称:', audioName);
    //         console.log('音频 MD5:', sound.md5);
    //         console.log('音频原始数据:', audioData);
    
    //         /*
    //          * sound.asset.data 可能是：
    //          * ArrayBuffer
    //          * Uint8Array
    //          * 或其他 TypedArray
    //          *
    //          * decodeAudioData 需要 ArrayBuffer，
    //          * 所以统一转换一下。
    //          */
    //         let arrayBuffer;
    
    //         if (audioData instanceof ArrayBuffer) {
    //             arrayBuffer = audioData;
    //         } else if (ArrayBuffer.isView(audioData)) {
    //             arrayBuffer = audioData.buffer.slice(
    //                 audioData.byteOffset,
    //                 audioData.byteOffset + audioData.byteLength
    //             );
    //         } else {
    //             console.error(`无法识别音频数据类型: ${audioName}`);
    //             continue;
    //         }
    
    //         // 原始音频解码
    //         const audioContext = new AudioContext();
    
    //         let audioBuffer;
    
    //         try {
    //             audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    //         } catch (error) {
    //             console.error(`音频解码失败: ${audioName}`, error);
    //             await audioContext.close();
    //             continue;
    //         }
    
    //         /*
    //          * 使用 OfflineAudioContext：
    //          * 1. 声道数 = 1
    //          * 2. 采样率 = 16000
    //          */
    //         const targetSampleRate = 16000;
    //         const targetChannels = 1;
    
    //         const targetLength = Math.ceil(
    //             audioBuffer.duration * targetSampleRate
    //         );
    
    //         const offlineContext = new OfflineAudioContext(
    //             targetChannels,
    //             targetLength,
    //             targetSampleRate
    //         );
    
    //         const source = offlineContext.createBufferSource();
    
    //         source.buffer = audioBuffer;
    
    //         source.connect(offlineContext.destination);
    
    //         source.start(0);
    
    //         // 渲染重采样后的音频
    //         const renderedBuffer = await offlineContext.startRendering();
    
    //         console.log(`处理后音频: ${audioName}`);
    //         console.log('MD5:', sound.md5);
    //         console.log('采样率:', renderedBuffer.sampleRate);
    //         console.log('声道数:', renderedBuffer.numberOfChannels);
    //         console.log('采样点数量:', renderedBuffer.length);
    //         console.log('时长:', renderedBuffer.duration);
    
    //         /*
    //          * 获取单声道 Float32 数据
    //          */
    //         const float32Data = renderedBuffer.getChannelData(0);
    
    //         /*
    //          * Float32 [-1.0, 1.0]
    //          * 转换成 16-bit PCM
    //          */
    //         const pcm16 = new Int16Array(float32Data.length);
    
    //         for (let j = 0; j < float32Data.length; j++) {
    //             let sample = float32Data[j];
    
    //             // 防止超过 [-1, 1]
    //             sample = Math.max(-1, Math.min(1, sample));
    
    //             if (sample < 0) {
    //                 pcm16[j] = sample * 32768;
    //             } else {
    //                 pcm16[j] = sample * 32767;
    //             }
    //         }
    
    //         console.log('PCM16:', pcm16);
    //         console.log('PCM16 字节数:', pcm16.byteLength);
    
    //         result.push({
    //             name: sound.md5,
    //             originalName: audioName,
    //             sampleRate: 16000,
    //             channels: 1,
    //             bitsPerSample: 16,
    //             data: pcm16
    //         });
    
    //         // 释放 AudioContext
    //         await audioContext.close();
    //     }
    
    //     return result;
    // }

    // function getPlayAudioNames(code) {
    //     const names = [];
    
    //     const regex = /icrobot\.playAudio\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    
    //     let match;
    
    //     while ((match = regex.exec(code)) !== null) {
    //         let audioName = match[1].trim();
    
    //         // 去掉 .wav 后缀
    //         audioName = audioName.replace(/\.wav$/i, '').trim();
    
    //         names.push(audioName);
    //     }
    
    //     return names;
    // }
    async function downloadCodeTotal(args) {
        // console.log('vm',vm)
        // let codeAudioName = getPlayAudioNames(codeModule.getCode())
        // const audioData = await getSoundData(codeAudioName);

        // console.log(audioData);
        // for (const audio of audioData) {
        //     const buffer = audio.data.buffer;
        
        //     console.log('发送字节数:', buffer);
        
        //     // WebSocket
        //     // websocket.send(buffer);
        
        //     // Web Serial
        //     // await writer.write(new Uint8Array(buffer));
        // }
        if(whatConnect[1]==1){
            console.log('wifi下载');
            let isCheck = checkAiModelInitialization(codeModule.getCode())
            if (!isCheck) return

            setIsLoading(true);
            let timerLoad = setTimeout(() => {
                alert(formatMessage({
                    id: 'gui.alert.downFailed',
                    default: 'Download failed',
                    description: 'gui.alert.downFailed'
                }));
                setIsLoading(false);
            }, 10000);
            let downloadCode = pythonCode;
            // if (!downloadCode.includes('while')) {
            //     downloadCode += '\nwhile True:\n    pass\n';
            // }
            downloadCode = modifyPythonCode(downloadCode);
            console.log(downloadCode);

            let place = args;
            console.log(place);
            if (place > 0 && place < 6) {
                let socket = new WebSocket(`ws://${IP}:8084`);
                socket.addEventListener('open', async () => {
                    socket.addEventListener('message', (event) => {
                        if (event.data === 'success') {
                            showToast(formatMessage({
                                id: 'gui.alert.downSuccess',
                                default: 'Download successful',
                                description: 'gui.alert.downSuccess'
                            }));
                            socket.close();
                            clearTimeout(timerLoad);
                            setIsLoading(false);
                        } else if (event.data === 'failed') {
                            showToast(formatMessage({
                                id: 'gui.alert.downFailed',
                                default: 'Download failed',
                                description: 'gui.alert.downFailed'
                            }));
                            socket.close();
                            clearTimeout(timerLoad);
                            setIsLoading(false);
                        }
                    });
                    const jsonData = {
                        command: "upload_script",
                        params: {
                            name: `${place}.py`,
                            script: downloadCode
                        }
                    };
                    socket.send(JSON.stringify(jsonData));
                });
            } else {
                alert(formatMessage({
                    id: 'gui.alert.selectplace',
                    default: '请选择正确坑位',
                    description: 'gui.alert.selectplace'
                }));
            }
        }else if(whatConnect[0]==1){
            console.log('蓝牙下载')
            console.log(args)
            if(extensionName=='ICBricks'){
                if (args==0) {
                    download(args);
                    setIsLoading(true)
                    if(bleDownloadTimer){
                        clearTimeout(bleDownloadTimer)
                    }
                    bleDownloadTimer=setTimeout(()=>{
                        setIsLoading(false)
                        alert(formatMessage({
                            id: 'gui.alert.downFailed',
                            default: 'Download failed',
                            description: 'gui.alert.downFailed'
                        }))
                    },6000)
                    
                } else {
                    cancelload();
                }
                 setIsDown(!isDown);
            }else if(extensionName=='ICRobot'){
                let isCheck = checkAiModelInitialization(codeModule.getCode())
                if (!isCheck) return
                download(args);
                setIsLoading(true)
                if(bleDownloadTimer){
                    clearTimeout(bleDownloadTimer)
                }
                bleDownloadTimer=setTimeout(()=>{
                    setIsLoading(false)
                    alert(formatMessage({
                        id: 'gui.alert.downFailed',
                        default: 'Download failed',
                        description: 'gui.alert.downFailed'
                    }))
                },10000)
            }else if(extensionName == 'ic2007'){
                setIsLoading(true)
                window.EditorPreload.bleDownloadIC2007(codeModule.getCode())
                if(bleDownloadTimer){
                    clearTimeout(bleDownloadTimer)
                }
                bleDownloadTimer=setTimeout(()=>{
                    setIsLoading(false)
                    alert(formatMessage({
                        id: 'gui.alert.downFailed',
                        default: 'Download failed',
                        description: 'gui.alert.downFailed'
                    }))
                },10000)
            }
        }else if(whatConnect[2]==1){
            console.log('串口下载')
            // let place = await new Promise(resolve => {
            //     resolve(prompt('请输入坑位(1-5)'));
            // });
            console.log(SerialDownload)
            let place=args
            if (place > 0 && place < 6) {
                SerialDownload(place);
                setIsLoading(true)
                if(serialDownloadTimer){
                    clearTimeout(serialDownloadTimer)
                }
                serialDownloadTimer=setTimeout(()=>{
                    setIsLoading(false)
                    alert(formatMessage({
                        id: 'gui.alert.downFailed',
                        default: 'Download failed',
                        description: 'gui.alert.downFailed'
                    }))
                },10000)
            } else {
                alert(formatMessage({
                        id: 'gui.alert.selectplace',
                        default: 'Please select the correct slot',
                        description: 'gui.alert.selectplace'
                    }));
            }
        }

        if(extensionName=='ic2007' && whatConnect[0]!=1){
            alert(formatMessage({
                id: 'gui.download.ic2007',
                default: 'Please connect the device first.',
                description: 'gui.download.ic2007'
            }))
        }
        // if(whatConnect[2]==1){
        //     console.log('串口下载')
        //     // let place = await new Promise(resolve => {
        //     //     resolve(prompt('请输入坑位(1-5)'));
        //     // });
        //     console.log(SerialDownload)
        //     let place=args
        //     if (place > 0 && place < 6) {
        //         SerialDownload(place);
        //         setIsLoading(true)
        //         if(serialDownloadTimer){
        //             clearTimeout(serialDownloadTimer)
        //         }
        //         serialDownloadTimer=setTimeout(()=>{
        //             setIsLoading(false)
        //             alert(formatMessage({
        //                 id: 'gui.alert.downFailed',
        //                 default: 'Download failed',
        //                 description: 'gui.alert.downFailed'
        //             }))
        //         },10000)
        //     } else {
        //         alert(formatMessage({
        //                 id: 'gui.alert.selectplace',
        //                 default: 'Please select the correct slot',
        //                 description: 'gui.alert.selectplace'
        //             }));
        //     }
        // }else if(whatConnect[2]==0 && whatConnect[0]==1){
        //     console.log('蓝牙下载')
        //     console.log(args)
        //     if(extensionName=='ICBricks'){
        //         if (args==0) {
        //             download(args);
        //             setIsLoading(true)
        //             if(bleDownloadTimer){
        //                 clearTimeout(bleDownloadTimer)
        //             }
        //             bleDownloadTimer=setTimeout(()=>{
        //                 setIsLoading(false)
        //                 alert(formatMessage({
        //                     id: 'gui.alert.downFailed',
        //                     default: 'Download failed',
        //                     description: 'gui.alert.downFailed'
        //                 }))
        //             },6000)
                    
        //         } else {
        //             cancelload();
        //         }
        //          setIsDown(!isDown);
        //     }else if(extensionName=='ICRobot'){
        //         download(args);
        //         setIsLoading(true)
        //         if(bleDownloadTimer){
        //             clearTimeout(bleDownloadTimer)
        //         }
        //         bleDownloadTimer=setTimeout(()=>{
        //             setIsLoading(false)
        //             alert(formatMessage({
        //                 id: 'gui.alert.downFailed',
        //                 default: 'Download failed',
        //                 description: 'gui.alert.downFailed'
        //             }))
        //         },10000)
        //     }
        // } else if (whatConnect[2] == 0 && whatConnect[1] == 1) {
        //     console.log('wifi下载');

        //     setIsLoading(true);
        //     let timerLoad = setTimeout(() => {
        //         alert(formatMessage({
        //             id: 'gui.alert.downFailed',
        //             default: 'Download failed',
        //             description: 'gui.alert.downFailed'
        //         }));
        //         setIsLoading(false);
        //     }, 8000);
        //     let downloadCode = pythonCode;
        //     if (!downloadCode.includes('while')) {
        //         downloadCode += '\nwhile True:\n    pass\n';
        //     }
        //     downloadCode = modifyPythonCode(downloadCode);
        //     console.log(downloadCode);

        //     let place = args;
        //     console.log(place);
        //     if (place > 0 && place < 6) {
        //         let socket = new WebSocket(`ws://${IP}:8084`);
        //         socket.addEventListener('open', async () => {
        //             socket.addEventListener('message', (event) => {
        //                 if (event.data === 'success') {
        //                     showToast(formatMessage({
        //                         id: 'gui.alert.downSuccess',
        //                         default: 'Download successful',
        //                         description: 'gui.alert.downSuccess'
        //                     }));
        //                     socket.close();
        //                     clearTimeout(timerLoad);
        //                     setIsLoading(false);
        //                 } else if (event.data === 'failed') {
        //                     showToast(formatMessage({
        //                         id: 'gui.alert.downFailed',
        //                         default: 'Download failed',
        //                         description: 'gui.alert.downFailed'
        //                     }));
        //                     socket.close();
        //                     clearTimeout(timerLoad);
        //                     setIsLoading(false);
        //                 }
        //             });
        //             const jsonData = {
        //                 command: "upload_script",
        //                 params: {
        //                     name: `${place}.py`,
        //                     script: downloadCode
        //                 }
        //             };
        //             socket.send(JSON.stringify(jsonData));
        //         });
        //     } else {
        //         alert(formatMessage({
        //             id: 'gui.alert.selectplace',
        //             default: '请选择正确坑位',
        //             description: 'gui.alert.selectplace'
        //         }));
        //     }
        // }
    }

    function showToast(message, duration = 3000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            Object.assign(container.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            });
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.textContent = message;

        Object.assign(toast.style, {
            background: '#333',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            maxWidth: '300px'
        });

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                toast.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }, duration);
    }

    const updateChildBallText = (index, image, data, isShow) => {
        setChildBalls((prev) =>
            prev.map((child, i) =>
                i === index ? { ...child, image: image, data: data, isShow: isShow } : child
            )
        );
    };

    const handleModeChange = (mode) => {
        console.log('主页面收到模式变更：', mode);
        let result = confirm(
            formatMessage({
                id: 'gui.alert.confirmchangemode',
                default: 'This operation will clear the workspace. Continue?',
                description: 'gui.alert.confirmchangemode'
            })
        );
        if (result) {
            vm.stopAll()
            // let enableChange = false;
            // if (getCurrent().length > 0) enableChange = true;
            // if (!enableChange) {
            //     alert(
            //         formatMessage({
            //             id: 'gui.alert.selectDevice',
            //             default: 'Please select a device first',
            //             description: 'gui.alert.selectDevice'
            //         })
            //     );
            //     return;
            // }

            setModeValue(mode);
            if(mode=='interactive'){
                setShowIot(false)
                setShowCode(false);
                setShowCodeDb(false);
                setIsCode(false);
                channelMode.postMessage(true);
                codeModule.setCode('');

                soc.send(JSON.stringify({
                    type:'mode',
                    data:false
                }))
            }else if(mode == 'upload'){
                setShowIot(false)
                setShowCode(true);
                setShowCodeDb(true);
                setIsCode(true);
                channelMode.postMessage(false);
                codeModule.setCode('');

                soc.send(JSON.stringify({
                    type:'mode',
                    data:true
                }))
            }else if(mode == 'iot'){
                setShowIot(true)
            }
            

            
            if(!showCode){
                if(extensionName=='Microbit'){
                    window.EditorPreload.exitReplMode()
                }
                if(extensionName == 'ic2007'){
                    window.EditorPreload.bleSendIC2007(JSON.stringify([0xCC,0x02]));
                }
                isUpLoadMode=true
                if(whatConnect[1]==1){

                    const Socket = new WebSocket(`ws://${IP}:8084`);

                    Socket.addEventListener('open', (event) => {
                        console.log('连接成功');
                        let timer=setInterval(async()=>{
                            Socket.send('file')
                            if(isRecive){
                                isRecive=false
                                Socket.close()
                                clearInterval(timer)
                                await new Promise(resolve => setTimeout(resolve, 100)); 
                                channel2.postMessage(true)
                            }
                        
                        },1000)
                    });

                    Socket.addEventListener('message', (event) => {
                        if(event.data=='success'){
                            isRecive=true
                        }
                    })
                }else if(whatConnect[0]==1){
                    bleChangeMode.postMessage('file')
                }else if(whatConnect[2]==1){
                    soc?.send(JSON.stringify({
                        type: 'port',
                        data: { message: JSON.stringify({
                            "command": "select_mode",
                            "params": 
                                {
                                    "mode": `file`,
                                }
                        })}
                    }));
                }
                // if(whatConnect[2]==1){

                //     soc?.send(JSON.stringify({
                //         type: 'port',
                //         data: { message: JSON.stringify({
                //             "command": "select_mode",
                //             "params": 
                //                 {
                //                     "mode": `file`,
                //                 }
                //         })}
                //     }));
                // }else if(whatConnect[2]==0 && whatConnect[0]==1){
                //     bleChangeMode.postMessage('file')
                // }else{
                //     const Socket = new WebSocket(`ws://${IP}:8084`);

                //     Socket.addEventListener('open', (event) => {
                //         console.log('连接成功');
                //         let timer=setInterval(async()=>{
                //             Socket.send('file')
                //             if(isRecive){
                //                 isRecive=false
                //                 Socket.close()
                //                 clearInterval(timer)
                //                 await new Promise(resolve => setTimeout(resolve, 100)); 
                //                 channel2.postMessage(true)
                //             }
                        
                //         },1000)
                //     });

                //     Socket.addEventListener('message', (event) => {
                //         if(event.data=='success'){
                //             isRecive=true
                //         }
                //     })
                // }
                

                
            }else{
                if(extensionName=='Microbit'){
                    window.EditorPreload.enterReplMode()
                }
                if(extensionName == 'ic2007'){
                    window.EditorPreload.bleSendIC2007(JSON.stringify([0xCC,0x01]));
                }
                isUpLoadMode=false
                if(whatConnect[1]==1){
                     const Socket = new WebSocket(`ws://${IP}:8084`);

                    Socket.addEventListener('open', (event) => {
                        console.log('连接成功');
                        let timer=setInterval(()=>{
                            Socket.send('scratch')
                            if(isRecive){
                                isRecive=false
                                Socket.close()
                                clearInterval(timer)
                                channel2.postMessage(true)
                            }
                        
                        },1000)
                    });

                    Socket.addEventListener('message', (event) => {
                        if(event.data=='success'){
                            isRecive=true
                        }
                    })
                }else if(whatConnect[0]==1){
                    bleChangeMode.postMessage('scratch')
                }else if(whatConnect[2]==1){
                    soc?.send(JSON.stringify({
                        type: 'port',
                        data: { message: JSON.stringify({
                            "command": "select_mode",
                            "params": 
                                {
                                    "mode": `scratch`,
                                }
                        })}
                    }));
                }
                // if(whatConnect[2]==1){
                //     soc?.send(JSON.stringify({
                //         type: 'port',
                //         data: { message: JSON.stringify({
                //             "command": "select_mode",
                //             "params": 
                //                 {
                //                     "mode": `scratch`,
                //                 }
                //         })}
                //     }));
                // }else if(whatConnect[2]==0 && whatConnect[0]==1){
                //     bleChangeMode.postMessage('scratch')
                // }else{
                //     const Socket = new WebSocket(`ws://${IP}:8084`);

                //     Socket.addEventListener('open', (event) => {
                //         console.log('连接成功');
                //         let timer=setInterval(()=>{
                //             Socket.send('scratch')
                //             if(isRecive){
                //                 isRecive=false
                //                 Socket.close()
                //                 clearInterval(timer)
                //                 channel2.postMessage(true)
                //             }
                        
                //         },1000)
                //     });

                //     Socket.addEventListener('message', (event) => {
                //         if(event.data=='success'){
                //             isRecive=true
                //         }
                //     })
                // }
                
                
            }
        }
    };
    const handleOpenExample =()=>{
        console.log('点击了默认程序按钮')
        setOpen(true)
    }
    const handleSelect=async(item)=>{
        console.log('选择了示例程序',item)
        if(item.mode=='py'){
            console.log('itemid',item.id)
            setSelectedIndex(item.id)
            // await new Promise(resolve => setTimeout(resolve, 100));
            handleLoadSelectedCode(item.id)
        }else{
            channelLoadExample.postMessage(item)
        }
        
    }

    const handleOpenAiMode =(isOpen)=>{
        setAiMode(isOpen)
        setIsAiMode(isOpen)
    }

    const aliveRef = useRef(false);
    const socketRef = useRef(null);

    useEffect(() => {
        isUnMount = false;
        aliveRef.current = true;
        console.log(window);
        let Socket = new WebSocket('ws://localhost:39147');
        socketRef.current = Socket;
        setSoc(Socket);


        const RECONNECT_INTERVAL = 3000;
        const MAX_RETRIES = 10;
        let retryCount = 0;
        let reconnectTimer = null;

        const channelBle = new BroadcastChannel('isBle')
        const channelPort = new BroadcastChannel('channelPort');
        channelPort.addEventListener('message', (event) => {
            if (!aliveRef.current) return;
            // console.log(event.data)
            socketRef.current?.send(JSON.stringify({
                type: 'port',
                data: { message: event.data }
            }));
        });

        let loadTimer;
        const channelSerialData = new BroadcastChannel('serial-data');

        function logWithTime(msg) {
            console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
        }

        const setupListeners = (sock) => {
            sock.addEventListener('open', () => {
                if (!aliveRef.current) return;
                logWithTime('WebSocket connection opened');
                console.log('readyState:', sock.readyState);
                retryCount = 0;
            });

            sock.addEventListener('close', (event) => {
                if (!aliveRef.current) return;
                logWithTime(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
                console.warn('readyState:', sock.readyState);

                if (!isUnMount) {
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        reconnectTimer = setTimeout(() => {
                            if (!aliveRef.current) return;
                            logWithTime(`Reconnecting... attempt ${retryCount}`);
                            // Socket = new WebSocket('ws://localhost:8081');
                            
                            // setSoc(Socket);
                            // setupListeners(Socket);
                            const newSocket = new WebSocket('ws://localhost:39147');
                            socketRef.current = newSocket;
                            setSoc(newSocket);
                            setupListeners(newSocket);
                        }, RECONNECT_INTERVAL);
                    } else {
                        console.error('Max reconnect attempts reached.');
                    }
                }
            });

            sock.addEventListener('error', (event) => {
                if (!aliveRef.current) return;
                logWithTime('WebSocket error occurred!');
                console.error(event);
                console.warn('readyState:', sock.readyState);
            });

            sock.addEventListener('message', async (event) => {
                if (!aliveRef.current) return;
                try {
                    if (JSON.parse(event.data).type == 'bricks') {
                        console.log('################',JSON.parse(event.data).data.message)
                        setIsDown(JSON.parse(event.data).data.message);
                        channelBleIsDown.postMessage(false)
                    } else if (JSON.parse(event.data).type == 'wifiDown') {
                        if (JSON.parse(event.data).data.message == 'success') {
                            alert('下载成功');
                        } else {
                            alert('下载失败');
                        }
                    } else if (JSON.parse(event.data).type == 'ble') {
                        if (JSON.parse(event.data).data.message) {
                            whatConnect[0] = 0;
                            channelBleIsDown.postMessage(false)
                            channelBle.postMessage(false)
                            portArr.forEach(port => {
                                updateChildBallText(port, '', '', false);
                            });
                            setIsDown(false);
                        }
                    } else if (JSON.parse(event.data).type == 'wifi') {
                        if (JSON.parse(event.data).data.message) {
                            attemptCount = 0;
                            if (!isUpLoadMode) {
                                let timeOut = setInterval(() => {
                                    try {
                                        if (attemptCount >= 2) {
                                            clearInterval(timeOut);
                                            console.log("尝试连接 2 次，停止重试");
                                            if (!isRecive) {
                                                alert('socket连接失败');
                                            }
                                            return;
                                        }

                                        attemptCount++;
                                        console.log(`尝试连接第 ${attemptCount} 次`);
                                        const Socket = new WebSocket('ws://192.168.4.1:8084');

                                        Socket.addEventListener('open', (event) => {
                                            console.log('连接成功');
                                            let timer = setInterval(async () => {
                                                Socket.send('scratch');
                                                await new Promise(resolve => setTimeout(resolve, 100));
                                                Socket.send('stop');

                                                if (isRecive) {
                                                    isRecive = false;
                                                    Socket.close();
                                                    clearInterval(timer);
                                                    clearInterval(timeOut);
                                                    channel2.postMessage(true);
                                                }
                                            }, 1000);
                                        });
                                        Socket.addEventListener('message', (event) => {
                                            if (event.data == 'success') {
                                                isRecive = true;
                                            }
                                        });
                                    } catch (e) { }
                                }, 1000);
                            } else {
                                let timeOut = setInterval(() => {
                                    try {
                                        if (attemptCount >= 2) {
                                            clearInterval(timeOut);
                                            console.log("尝试连接 2 次，停止重试");
                                            if (!isRecive) {
                                                alert('socket连接失败');
                                            }
                                            return;
                                        }

                                        attemptCount++;
                                        console.log(`尝试连接第 ${attemptCount} 次`);
                                        const Socket = new WebSocket('ws://192.168.4.1:8084');

                                        Socket.addEventListener('open', (event) => {
                                            console.log('连接成功');
                                            let timer = setInterval(() => {
                                                Socket.send('file');
                                                if (isRecive) {
                                                    isRecive = false;
                                                    Socket.close();
                                                    clearInterval(timer);
                                                    clearInterval(timeOut);
                                                }
                                            }, 1000);
                                        });
                                        Socket.addEventListener('message', (event) => {
                                            if (event.data == 'success') {
                                                isRecive = true;
                                            }
                                        });
                                    } catch (e) { }
                                }, 1000);
                            }
                        }
                    } else if (JSON.parse(event.data).type == 'masterClose') {
                        channelMasterClose.postMessage(JSON.parse(event.data).data.message);
                        if (!JSON.parse(event.data).data.message[1]) {
                            stopAll.postMessage(true);
                        }
                        setCurrent('');
                        setCurrentExtension('')
                        setExtensionName('选择设备');
                        
                    } else if (JSON.parse(event.data).type == 'setExtension') {
                        stopAll.postMessage(true);
                        let extension = JSON.parse(event.data).data.message;
                        if (extension == 1) {
                            setCurrent('ICBricks');
                            setCurrentExtension('1');
                            setExtensionName('ICBricks');
                            
                            if (extensionSelect[extension - 1]) {
                                setIsBricks(true);
                                channel1.postMessage(extension);
                                await new Promise(resolve => setTimeout(resolve, 100));
                                await fetch('http://localhost:38127/set-extension', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'text/plain'
                                    },
                                    body: 0
                                })
                                    .then(response => response.text())
                                    .then(data => { })
                                    .catch(error => {
                                        console.error('错误:', error);
                                    });
                            } else {
                                setIsLoading(true);
                                setIsMaster(true);
                                setIsBricks(true);
                                setAdd(true);
                                onExtensionButtonClick();
                                extensionSelect[extension - 1] = true;
                            }

                            setLan('Lua');
                            setLanMode('Lua');
                            codeModule.setCode('');
                        } else if (extension == 2) {
                            setCurrent('ICRobot');
                            setCurrentExtension('2');
                            setExtensionName('ICRobot');
                            
                            if (extensionSelect[extension - 1]) {
                                setIsBricks(false);
                                channel1.postMessage(extension);
                                let extensionName = [
                                    'robotimg',
                                    'robotapriltag',
                                    'robotcat',
                                    'robotcolordete',
                                    'robotcolorplace',
                                    'robotcolorxy',
                                    'robotface',
                                    'robotgood',
                                    'robotqr',
                                    'robottraffic'
                                ];

                                for (let i = 0; i < 10; i++) {
                                    if (getAllLoaded().includes(extensionName[i])) {
                                        addLoadExtension(extensionName[i]);
                                    } else {
                                        addLoadExtension(extensionName[i]);
                                        setAllLoaded(extensionName[i]);
                                    }
                                }
                                await new Promise(resolve => setTimeout(resolve, 100));
                                await fetch('http://localhost:38127/set-extension', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'text/plain'
                                    },
                                    body: 0
                                })
                                    .then(response => response.text())
                                    .then(data => { })
                                    .catch(error => {
                                        console.error('错误:', error);
                                    });
                            } else {
                                setIsLoading(true);
                                setIsBricks(false);
                                setIsMaster(true);
                                setIsRobot(true);
                                setAdd(true);
                                onExtensionButtonClick();
                                extensionSelect[extension - 1] = true;
                            }
                            setLan('Python');
                            setLanMode('Python');
                            codeModule.setCode('');
                        } else if (extension == 3) {
                            setCurrent('Microbit');
                            setCurrentExtension('3');
                            setExtensionName('Microbit');
                            
                            if (extensionSelect[extension - 1]) {
                                setIsBricks(false);
                                channel1.postMessage(extension);
                                await new Promise(resolve => setTimeout(resolve, 100));
                                await fetch('http://localhost:38127/set-extension', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'text/plain'
                                    },
                                    body: 0
                                })
                                    .then(response => response.text())
                                    .then(data => { })
                                    .catch(error => {
                                        console.error('错误:', error);
                                    });
                            } else {
                                setIsLoading(true);
                                setIsBricks(false);
                                setIsMaster(true);
                                setIsRobot(false);
                                setAdd(true);
                                onExtensionButtonClick();
                                extensionSelect[extension - 1] = true;
                            }
                            setLan('Python');
                            setLanMode('Python');
                            codeModule.setCode('');
                        }else if(extension == 4){
                            console.log('选择了arduino')
                            setCurrent('ArduinoUno');
                            setCurrentExtension('4');
                            setExtensionName('ArduinoUno');
                            
                            if (extensionSelect[extension - 1]) {
                                setIsBricks(false);
                                channel1.postMessage(extension);
                                await new Promise(resolve => setTimeout(resolve, 100));
                                await fetch('http://localhost:38127/set-extension', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'text/plain'
                                    },
                                    body: 0
                                })
                                    .then(response => response.text())
                                    .then(data => { })
                                    .catch(error => {
                                        console.error('错误:', error);
                                    });
                            } else {
                                setIsLoading(true);
                                setIsBricks(false);
                                setIsMaster(true);
                                setIsRobot(false);
                                setAdd(true);
                                onExtensionButtonClick();
                                extensionSelect[extension - 1] = true;
                            }
                            setLan('Arduino');
                            setLanMode('Arduino');
                            codeModule.setCode('');
                            setTimeout(()=>{
                                channelGrayBlock.postMessage('arduino')
                            },1000)
                        }else if(extension == 5){
                            console.log('选择了py32')
                            setCurrent('py32');
                            setCurrentExtension('5');
                            setExtensionName('py32');
                            
                            if (extensionSelect[extension - 1]) {
                                setIsBricks(false);
                                channel1.postMessage(extension);
                                await new Promise(resolve => setTimeout(resolve, 100));
                                await fetch('http://localhost:38127/set-extension', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'text/plain'
                                    },
                                    body: 0
                                })
                                    .then(response => response.text())
                                    .then(data => { })
                                    .catch(error => {
                                        console.error('错误:', error);
                                    });
                            } else {
                                setIsLoading(true);
                                setIsBricks(false);
                                setIsMaster(true);
                                setIsRobot(false);
                                setAdd(true);
                                onExtensionButtonClick();
                                extensionSelect[extension - 1] = true;
                            }
                            setLan('Arduino');
                            setLanMode('Arduino');
                            codeModule.setCode('');
                            setTimeout(()=>{
                                channelGrayBlock.postMessage('py32')
                            },1000)
                        }else if(extension == 6){
                            console.log('选择了ic2007')
                            setCurrent('ic2007');
                            setCurrentExtension('6');
                            setExtensionName('ic2007');
                            
                            if (extensionSelect[extension - 1]) {
                                setIsBricks(false);
                                channel1.postMessage(extension);
                                await new Promise(resolve => setTimeout(resolve, 100));
                                await fetch('http://localhost:38127/set-extension', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'text/plain'
                                    },
                                    body: 0
                                })
                                    .then(response => response.text())
                                    .then(data => { })
                                    .catch(error => {
                                        console.error('错误:', error);
                                    });
                            } else {
                                setIsLoading(true);
                                setIsBricks(false);
                                setIsMaster(true);
                                setIsRobot(false);
                                setAdd(true);
                                onExtensionButtonClick();
                                extensionSelect[extension - 1] = true;
                            }
                            setLan('Python');
                            setLanMode('Python');
                            codeModule.setCode('');
                            
                        }
                        channelMode.postMessage(!getShowCodeDb())
                    } else if (JSON.parse(event.data).type == 'whatIp') {
                        setIsLoading(true);
                        await new Promise(resolve => setTimeout(resolve, 500));

                        channelHostPot.postMessage(true);
                        IP = JSON.parse(event.data).data.message;
                        let ip = IP;
                        console.log(ip);
                        setRobotIp(ip);

                        const socketMode = new WebSocket(`ws://${ip}:8084`);

                        let hasReceivedSuccess = false;
                        let sendInterval;
                        let socketTimer = setTimeout(() => {
                            alert(formatMessage({
                                id: 'gui.alert.connectFailed',
                                default: 'Connection failed',
                                description: 'gui.alert.connectFailed'
                            }));
                            setIsLoading(false);
                            socketMode.close();
                            channelSendIp.postMessage('');
                            window.EditorPreload.disConnectWifi(true)
                            clearInterval(sendInterval);
                            clearInterval(loadTimer);
                        }, 10000);

                        socketMode.addEventListener('open', () => {
                            console.log('连接成功');

                            sendInterval = setInterval(() => {
                                if (hasReceivedSuccess) return;

                                if (!isUpLoadMode) {
                                    socketMode.send('scratch');
                                    socketMode.send('stop');
                                } else {
                                    socketMode.send('file');
                                }
                            }, 1000);

                            socketMode.addEventListener('message', (event) => {
                                console.log(event.data);
                                if (event.data === 'success') {
                                    hasReceivedSuccess = true;
                                    clearTimeout(socketTimer);
                                    clearInterval(sendInterval);
                                    setIsLoading(false);
                                    clearInterval(loadTimer);

                                    channelSendIp.postMessage(ip);
                                    channel2.postMessage(true);

                                    if (reciveTimer) clearInterval(reciveTimer);

                                    reciveTimer = setInterval(() => {
                                        if (!hasReceivedResponse) {
                                            console.log('继续发送');
                                            channelSendIp.postMessage(ip);
                                            channel2.postMessage(true);
                                        } else {
                                            console.log('停止发送');
                                            clearInterval(reciveTimer);
                                            hasReceivedResponse = false;
                                            whatConnect[1] = 1;
                                            socketMode.close();
                                        }
                                    }, 1000);
                                }
                            });

                            socketMode.addEventListener('close', () => {
                                console.log('8084已关闭');
                            });
                        });
                    } else if (JSON.parse(event.data).type == 'espIpStatus') {
                        if (JSON.parse(event.data).data.message) {
                            channelHostPot.postMessage(false);
                            whatConnect[1] = 0;
                            showToast(formatMessage({
                                id: 'gui.alert.robotDisConnect',
                                default: 'Robot disconnected',
                                description: 'gui.alert.robotDisConnect'
                            }));
                        }
                    } else if (JSON.parse(event.data).type == 'isOpenPort') {
                        if (JSON.parse(event.data).data.message) {
                            whatConnect[2] = 1;
                        } else {
                            whatConnect[2] = 0;
                        }
                        channelPort.postMessage(JSON.parse(event.data).data.message);
                    } else if (JSON.parse(event.data).type == 'serialData') {
                        channelSerialData.postMessage(JSON.parse(event.data).data.message);
                        setData(prev => prev + JSON.parse(event.data).data.message+'\n');
                    } else if (JSON.parse(event.data).type == 'ble-connect') {
                        console.log('蓝牙已连接');
                        channelBle.postMessage(true)
                        whatConnect[0] = 1;
                    } else if (JSON.parse(event.data).type == 'addLoad') {
                        if (JSON.parse(event.data).data.message) {
                            console.log('添加遮罩');
                            setIsLoading(true);
                        } else {
                            setTimeout(() => {
                                setIsLoading(false);
                            }, 5000);
                        }
                    } else if (JSON.parse(event.data).type == 'wifiIsConnected') {
                        showToast(formatMessage({
                            id: 'gui.alert.robotDisConnect',
                            default: 'Robot disconnected',
                            description: 'gui.alert.robotDisConnect'
                        }));
                        whatConnect[1] = 0;
                        channelHostPot.postMessage(false);
                        console.log('333333333333333333333333');
                    } else if (JSON.parse(event.data).type == 'burnLogs') {
                        console.log(JSON.parse(event.data).data.message);
                        if (JSON.parse(event.data).data.message.flashing) {
                            setIsFlashing(JSON.parse(event.data).data.message.flashing);
                        } else {
                            console.log('进入了关闭进度条')
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            setIsFlashing(JSON.parse(event.data).data.message.flashing);
                        }

                        if (typeof JSON.parse(event.data).data.message.logs === 'string') {
                            const newLines = JSON.parse(event.data).data.message.logs.split(/\r?\n/).filter(line => line.trim() !== '');
                            setLogs(prevLogs => [...prevLogs, ...newLines]);
                        }

                        if (JSON.parse(event.data).data.message.flashing && (JSON.parse(event.data).data.message.logs.includes('A serial exception error occurred:') || (JSON.parse(event.data).data.message.logs.includes('fatal error')))) {
                            setLogs([])
                            alert(formatMessage({
                                id: 'gui.alert.espToolTimeout',
                                default: 'Flashing timed out. Please check the port connection',
                                description: 'gui.alert.espToolTimeout'
                            }));
                            setIsFlashing(!JSON.parse(event.data).data.message.flashing);
                        }
                        if (!JSON.parse(event.data).data.message.flashing && JSON.parse(event.data).data.message.logs == 'success') {
                            setLogs([])
                            alert(formatMessage({
                                id: 'gui.alert.espToolFinish',
                                default: 'Flashing completed',
                                description: 'gui.alert.espToolFinish'
                            }));
                        } else if (!JSON.parse(event.data).data.message.flashing && JSON.parse(event.data).data.message.logs == 'Failed') {
                            setLogs([])
                            alert(formatMessage({
                                id: 'gui.alert.espToolFailed',
                                default: 'Flashing failed',
                                description: 'gui.alert.espToolFailed'
                            }));
                        }
                    }else if(JSON.parse(event.data).type=='bleIsDownLoad'){
                        console.log(JSON.parse(event.data).data.message)
                        if(JSON.parse(event.data).data.message){
                            // console.log('蓝牙下载成功')
                            channelBleIsDown.postMessage(true)
                            setIsLoading(false)
                            clearTimeout(bleDownloadTimer)
                            showToast(formatMessage({
                                id: 'gui.alert.downSuccess',
                                default: 'Download successful',
                                description: 'gui.alert.downSuccess'
                            }));
                        }
                    }else if(JSON.parse(event.data).type=='serialSuccess'){
                        console.log(JSON.parse(event.data).data.message)
                        if(JSON.parse(event.data).data.message){
                            setIsLoading(false)
                            clearTimeout(serialDownloadTimer)
                            showToast(formatMessage({
                                id: 'gui.alert.downSuccess',
                                default: 'Download successful',
                                description: 'gui.alert.downSuccess'
                            }));
                        }
                    }else if(JSON.parse(event.data).type=='wifiDisConnect'){
                        if (soc?.readyState === WebSocket.OPEN) {
                            soc.send(JSON.stringify({
                                type: 'offline',
                                data: { message: 'true' }
                            }));
                        }
                        whatConnect[1] = 0;
                        channelHostPot.postMessage(false);
                    }
                } catch (e) {
                    console.log('8081error' + e);
                }
            });
        };

        setupListeners(Socket);

        return () => {
            isUnMount = true;

            aliveRef.current = false;
            socketRef.current?.close();
            socketRef.current = null;
            Socket?.close();
            // channelPort.close();
            // channelSerialData.close();
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, []);


    
//     useEffect(() => {
//     aliveRef.current = true;
//     isUnMount = false;

//     let Socket = new WebSocket('ws://localhost:8081');
//     socketRef.current = Socket;
//     setSoc(Socket);

//     const RECONNECT_INTERVAL = 3000;
//     const MAX_RETRIES = 10;
//     let retryCount = 0;
//     let reconnectTimer = null;

//     const channelBle = new BroadcastChannel('isBle');
//     const channelPort = new BroadcastChannel('channelPort');
//     const channelSerialData = new BroadcastChannel('serial-data');

//     channelPort.addEventListener('message', (event) => {
//         if (!aliveRef.current) return;
//         socketRef.current?.send(JSON.stringify({
//             type: 'port',
//             data: { message: event.data }
//         }));
//     });

//     function logWithTime(msg) {
//         console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
//     }

//     const setupListeners = (sock) => {
//         sock.addEventListener('open', () => {
//             if (!aliveRef.current) return;
//             logWithTime('WebSocket connection opened');
//             retryCount = 0;
//         });

//         sock.addEventListener('close', (event) => {
//             if (!aliveRef.current) return;

//             logWithTime(`WebSocket closed: ${event.code}`);
//             if (retryCount < MAX_RETRIES) {
//                 retryCount++;
//                 reconnectTimer = setTimeout(() => {
//                     if (!aliveRef.current) return;

//                     const newSocket = new WebSocket('ws://localhost:8081');
//                     socketRef.current = newSocket;
//                     setSoc(newSocket);
//                     setupListeners(newSocket);
//                 }, RECONNECT_INTERVAL);
//             }
//         });

//         sock.addEventListener('error', () => {
//             if (!aliveRef.current) return;
//             console.warn('WebSocket error');
//         });

//         sock.addEventListener('message', async (event) => {
//             if (!aliveRef.current) return;

//             try {
//                 const msg = JSON.parse(event.data);

//                 /* =========================
//                    ↓↓↓ 以下业务逻辑 100% 保留 ↓↓↓
//                    ========================= */

//                 if (msg.type === 'bricks') {
//                     setIsDown(!msg.data.message);
//                     channelBleIsDown.postMessage(false);

//                 } else if (msg.type === 'wifiDown') {
//                     alert(msg.data.message === 'success' ? '下载成功' : '下载失败');

//                 } else if (msg.type === 'ble') {
//                     if (msg.data.message) {
//                         whatConnect[0] = 0;
//                         channelBleIsDown.postMessage(false);
//                         channelBle.postMessage(false);
//                         portArr.forEach(port => {
//                             updateChildBallText(port, '', '', false);
//                         });
//                         setIsDown(true);
//                     }

//                 } else if (msg.type === 'setExtension') {
//                     stopAll.postMessage(true);

//                     const extension = msg.data.message;

//                     // ⭐ 核心：只要组件活着，这个 setState 一定生效
//                     if (!aliveRef.current) return;
//                     setCurrentExtension(String(extension));

//                     if (extension === 1) {
//                         setExtensionName('ICBricks');
//                         setCurrent('ICBricks');
//                         if (extensionSelect[0]) {
//                             setIsBricks(true);
//                             channel1.postMessage(extension);
//                         } else {
//                             setIsLoading(true);
//                             setIsMaster(true);
//                             setIsBricks(true);
//                             setAdd(true);
//                             onExtensionButtonClick();
//                             extensionSelect[0] = true;
//                         }
//                         setLan('Lua');
//                         setLanMode('Lua');
//                         codeModule.setCode('');

//                     } else if (extension === 2) {
//                         setExtensionName('ICRobot');
//                         setCurrent('ICRobot');
//                         if (extensionSelect[1]) {
//                             setIsBricks(false);
//                             channel1.postMessage(extension);
//                         } else {
//                             setIsLoading(true);
//                             setIsBricks(false);
//                             setIsMaster(true);
//                             setIsRobot(true);
//                             setAdd(true);
//                             onExtensionButtonClick();
//                             extensionSelect[1] = true;
//                         }
//                         setLan('Python');
//                         setLanMode('Python');
//                         codeModule.setCode('');

//                     } else if (extension === 3) {
//                         setExtensionName('Microbit');
//                         setCurrent('Microbit');
//                         if (extensionSelect[2]) {
//                             setIsBricks(false);
//                             channel1.postMessage(extension);
//                         } else {
//                             setIsLoading(true);
//                             setIsBricks(false);
//                             setIsMaster(true);
//                             setIsRobot(false);
//                             setAdd(true);
//                             onExtensionButtonClick();
//                             extensionSelect[2] = true;
//                         }
//                         setLan('Python');
//                         setLanMode('Python');
//                         codeModule.setCode('');
//                     }

//                     channelMode.postMessage(!getShowCodeDb());

//                 } else if (msg.type === 'serialData') {
//                     channelSerialData.postMessage(msg.data.message);
//                     setData(prev => prev + msg.data.message + '\n');
//                 }

//                 /* =========================
//                    ↑↑↑ 业务逻辑原样结束 ↑↑↑
//                    ========================= */

//             } catch (e) {
//                 console.log('8081 message error', e);
//             }
//         });
//     };

//     setupListeners(Socket);

//     return () => {
//         aliveRef.current = false;
//         isUnMount = true;

//         if (reconnectTimer) clearTimeout(reconnectTimer);

//         socketRef.current?.close();
//         socketRef.current = null;

//         channelPort.close();
//         channelBle.close();
//         channelSerialData.close();
//     };
// }, []);


    return {
        selectedIndex,
        setSelectedIndex,
        pythonCode,
        setPythonCode,
        childData,
        setChildData,
        isTrain,
        setIsTrain,
        isBricks,
        setbricks,
        showCode,
        setShowCode,
        lanMode,
        setLanMode,
        isDown,
        setIsDown,
        currentExtension,
        setCurrentExtension,
        isLoading,
        setIsLoading,
        isFlashing,
        setIsFlashing,
        logs,
        setLogs,
        extensionName,
        setExtensionName,
        childBalls,
        setChildBalls,
        socket,
        setSocket,
        soc,
        setSoc,
        upload,
        setUpload,
        data,
        setData,
        selectedOption,
        setSelectedOption,
        modeValue,
        setModeValue,
        handleLoadSelectedCode,
        handleChildData,
        updateChildBallText,
        handleModeChange,
        downloadCodeTotal,
        showToast,
        getCurrent,
        open,
        setOpen,
        selected,
        aiMode,
        setSelected,
        handleOpenExample,
        handleSelect,
        handleOpenAiMode,
        showIot,
        setShowIot,
        flashLogs,
        setFlashLogs,
        showFlash,
        setShowFlash
    };
};