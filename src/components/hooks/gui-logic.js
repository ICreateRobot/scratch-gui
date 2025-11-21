import { useState, useEffect, useRef } from 'react';
import formatMessage  from 'format-message';
import { setIsMaster, setIsBricks, getIsBricks, setRobotIp, setCurrent, getCurrent } from '../utils/utils.js';
import codeModule from '../../../../../utils/global.js';
import { getIsCode, setIsCode } from '../../../../../utils/whatModule.js';
import { setAdd } from '../../../../../utils/isAddMaster.js';
import { setLan, getLan } from '../../../../../utils/lanMode.js';
import { setIsRobot, getShowCodeDb, setShowCodeDb, addLoadExtension, delLoadExtension, getLoadExtension, getAllLoaded, setAllLoaded, codeArray } from 'scratch-gui/src/components/utils/utils.js';

let attemptCount = 0;
let extensionSelect = [false, false, false];
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
    const [isDown, setIsDown] = useState(true);
    const [currentExtension, setCurrentExtension] = useState('2');
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

    useEffect(() => {
        const newSocket = new WebSocket('ws://localhost:8082');
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
            if (soc?.readyState === WebSocket.OPEN) {
                soc.send(JSON.stringify({
                    type: 'offline',
                    data: { message: 'true' }
                }));
            }
            whatConnect[1] = 0;
            channelHostPot.postMessage(false);
            console.log('Offline event handled');
        };

        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('offline', handleOffline); // ✅ 清除绑定，防止重复
        };
    }, []); // 👈 空依赖数组，确保只绑定一次
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

    async function downloadCodeTotal(args) {
        if(whatConnect[1]==1){
            console.log('wifi下载');

            setIsLoading(true);
            let timerLoad = setTimeout(() => {
                alert(formatMessage({
                    id: 'gui.alert.downFailed',
                    default: 'Download failed',
                    description: 'gui.alert.downFailed'
                }));
                setIsLoading(false);
            }, 8000);
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
            let enableChange = false;
            if (getCurrent().length > 0) enableChange = true;
            if (!enableChange) {
                alert(
                    formatMessage({
                        id: 'gui.alert.selectDevice',
                        default: 'Please select a device first',
                        description: 'gui.alert.selectDevice'
                    })
                );
                return;
            }

            setModeValue(mode);
            setShowCode(!showCode);
            setShowCodeDb(!showCode);
            setIsCode(!showCode);
            channelMode.postMessage(showCode);
            codeModule.setCode('');

            soc.send(JSON.stringify({
                type:'mode',
                data:!showCode
            }))

            
            if(!showCode){
                if(extensionName=='Microbit'){
                    window.EditorPreload.exitReplMode()
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

    useEffect(() => {
        isUnMount = false;
        console.log(window);
        let Socket = new WebSocket('ws://localhost:8081');
        setSoc(Socket);

        const RECONNECT_INTERVAL = 3000;
        const MAX_RETRIES = 10;
        let retryCount = 0;
        let reconnectTimer = null;

        const channelBle = new BroadcastChannel('isBle')
        const channelPort = new BroadcastChannel('channelPort');
        channelPort.addEventListener('message', (event) => {
            Socket?.send(JSON.stringify({
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
                logWithTime('WebSocket connection opened');
                console.log('readyState:', sock.readyState);
                retryCount = 0;
            });

            sock.addEventListener('close', (event) => {
                logWithTime(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
                console.warn('readyState:', sock.readyState);

                if (!isUnMount) {
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        reconnectTimer = setTimeout(() => {
                            logWithTime(`Reconnecting... attempt ${retryCount}`);
                            Socket = new WebSocket('ws://localhost:8081');
                            setSoc(Socket);
                            setupListeners(Socket);
                        }, RECONNECT_INTERVAL);
                    } else {
                        console.error('Max reconnect attempts reached.');
                    }
                }
            });

            sock.addEventListener('error', (event) => {
                logWithTime('WebSocket error occurred!');
                console.error(event);
                console.warn('readyState:', sock.readyState);
            });

            sock.addEventListener('message', async (event) => {
                try {
                    if (JSON.parse(event.data).type == 'bricks') {
                        setIsDown(!JSON.parse(event.data).data.message);
                    } else if (JSON.parse(event.data).type == 'wifiDown') {
                        if (JSON.parse(event.data).data.message == 'success') {
                            alert('下载成功');
                        } else {
                            alert('下载失败');
                        }
                    } else if (JSON.parse(event.data).type == 'ble') {
                        if (JSON.parse(event.data).data.message) {
                            whatConnect[0] = 0;
                            channelBle.postMessage(false)
                            portArr.forEach(port => {
                                updateChildBallText(port, '', '', false);
                            });
                            setIsDown(true);
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
                        setExtensionName('选择设备');
                        setCurrent('');
                    } else if (JSON.parse(event.data).type == 'setExtension') {
                        stopAll.postMessage(true);
                        let extension = JSON.parse(event.data).data.message;
                        if (extension == 1) {
                            setCurrentExtension('1');
                            setExtensionName('ICBricks');
                            setCurrent('ICBricks');
                            if (extensionSelect[extension - 1]) {
                                setIsBricks(true);
                                channel1.postMessage(extension);
                                await new Promise(resolve => setTimeout(resolve, 100));
                                await fetch('http://localhost:3000/set-extension', {
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
                            setCurrentExtension('2');
                            setExtensionName('ICRobot');
                            setCurrent('ICRobot');
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
                                await fetch('http://localhost:3000/set-extension', {
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
                            setCurrentExtension('3');
                            setExtensionName('Microbit');
                            setCurrent('Microbit');
                            if (extensionSelect[extension - 1]) {
                                setIsBricks(false);
                                channel1.postMessage(extension);
                                await new Promise(resolve => setTimeout(resolve, 100));
                                await fetch('http://localhost:3000/set-extension', {
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
                    }
                } catch (e) {
                    console.log('8081error' + e);
                }
            });
        };

        setupListeners(Socket);

        return () => {
            isUnMount = true;
            Socket?.close();
            // channelPort.close();
            // channelSerialData.close();
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, []);

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
        setSelected,
        handleOpenExample,
        handleSelect
    };
};