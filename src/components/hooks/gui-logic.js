import { useState, useEffect, useRef } from 'react';
import formatMessage  from 'format-message';
import { setIsMaster, setIsBricks, getIsBricks, setRobotIp, setCurrent, getCurrent } from '../utils/utils.js';
import codeModule from '../../../../../utils/global.js';
import { getIsCode, setIsCode } from '../../../../../utils/whatModule.js';
import { setAdd } from '../../../../../utils/isAddMaster.js';
import { setLan, getLan } from '../../../../../utils/lanMode.js';
import { setIsRobot, getShowCodeDb, setShowCodeDb, addLoadExtension, delLoadExtension, getLoadExtension, getAllLoaded, setAllLoaded, codeArray } from 'scratch-gui/src/components/utils/utils.js';
import { setLongIsDown,getLongIsDown } from 'scratch-gui/src/components/utils/utils.js';
// import { createHex } from "https://esm.sh/@microbit/microbit-fs";
import {MicropythonFsHex }  from '@microbit/microbit-fs';
import { microbitBoardId } from '@microbit/microbit-universal-hex';

import {safeSerialWrite} from '../utils/safeSerialWrite'
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
let bufferData = '';

const currentURL = window.location.href;
const oneLevelUp = currentURL.substring(0, currentURL.lastIndexOf("/"));
const modelPath = oneLevelUp + "/static/model";
const MICRO_PATH = `${modelPath}/MICROBIT.hex`

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
        PROPS,
        onClickConnect
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
    const [isDown, setIsDown] = useState(getLongIsDown());
    // const [currentExtension, setCurrentExtension] = useState(getCurrent());
    const [currentExtension, setCurrentExtension] = useState(() => {
    const current = getCurrent();
    if (current === 'ICBricks') return '1';
    if (current === 'ICRobot') return '2';
    if (current === 'Microbit') return '3';
    return '2'; // 包括 '' 或其他情况
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
    const [portData, setPortData] = useState('');
    const [selectedOption, setSelectedOption] = useState('');
    const currentModelValue= showCode ? 'upload':'interactive'
    const [modeValue, setModeValue] = useState(currentModelValue); // 控制 ModeToggle 状态

    const portArr = [7, 0, 6, 1, 5, 2, 4, 3];
    const channelMode = new BroadcastChannel('mode');
    const channel1 = new BroadcastChannel('extensionSecondly');
    const channel2 = new BroadcastChannel('startRobotSocket');
    const channelPort = new BroadcastChannel('channelPort');
    const channelBleIsDown = new BroadcastChannel('ble-download');
    const channelBleData = new BroadcastChannel('ble-data')
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
    const channelBle = new BroadcastChannel('isBle')
    const getBricksPort = new BroadcastChannel('get-bricks-port');
    const channelProjectExtension = new BroadcastChannel('project_extension')
    const channelLoading = new BroadcastChannel('channel-loading-tabSwitcher')
    useEffect(() => {
        channelLoading.addEventListener('message',(event)=>{
            setIsLoading(event.data)
            
        })
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
    let lanyaMsg

    let isElectron
    

    useEffect(()=>{
        isElectron = !!(window && window.process && window.process.type);
    },[])

    async function sendSerialCommand(command, delay = 50) {
        const encoder = new TextEncoder();
        const buffer = encoder.encode(command);
        
        await window.__serialWriter.write(buffer);
    }
    if (!window.EditorPreload && !isElectron) {
            window.EditorPreload = {
            _robotData: '[]',
            _stateCallbacks: [],
            _sensorCallbacks: [],  // ✅ 新增，用于保存传感器回调
            _MicroData:'',
            _pendingMap: new Map(), // ✅ 多命令等待池
            _requestId: 0,

            // 模拟 Electron 的 getRobotData
            getRobotData() {
                return this._robotData;
            },

            // 模拟 Electron 的 sendStateData 注册函数
            sendStateData(callback) {
                this._stateCallbacks.push(callback);
            },

            // 模拟 Electron 的 sendSenorData 注册函数 ✅ 新增
            sendSenorData(callback) {
                this._sensorCallbacks.push(callback);
            },

            // 内部函数：用于从外部触发状态更新
            _emitState(state) {
                for (const cb of this._stateCallbacks) {
                    try {
                        cb(state);
                    } catch (err) {
                        console.error("sendStateData callback error:", err);
                    }
                }
            },

            // 内部函数：用于更新机器人传感器数据 ✅ 修改
            _setRobotData(data) {
                // const jsonStr = JSON.stringify(data);
                const jsonStr=data
                this._robotData = jsonStr;
                // console.log(this._robotData)

                // 每次更新 robotData 时，同时通知 sendSenorData 注册的所有回调
                for (const cb of this._sensorCallbacks) {
                    try {
                        cb(jsonStr);
                    } catch (err) {
                        console.error("sendSenorData callback error:", err);
                    }
                }
            },

            //microbit用到的函数
            setMicroData(data){
                this._MicroData=data
                const firstKey = this._pendingMap.keys().next().value;
                if (firstKey) {
                    const resolve = this._pendingMap.get(firstKey);
                    if (resolve) {
                    resolve(data);
                    this._pendingMap.delete(firstKey);
                    }
                }
            },
            async sendCommandToDevice(command) {
                console.log('[Mock sendCommandToDevice]', command);
                const encoder = new TextEncoder();
                const buffer = encoder.encode(command + '\r\n');
                await window.__serialWriter.write(buffer)

                // await new Promise(resolve => setTimeout(resolve, 100))
                // 为本次请求分配 ID
                const reqId = ++this._requestId;

                // 返回一个 Promise，等待 setMicroData() resolve
                const response = await new Promise((resolve) => {
                    this._pendingMap.set(reqId, resolve);

                    
                    setTimeout(() => {
                    if (this._pendingMap.has(reqId)) {
                        console.warn("sendCommandToDevice timeout", command);
                        this._pendingMap.delete(reqId);
                        resolve(">>> TIMEOUT >>>");
                    }
                    }, 3000);
                });
                return {
                    success: true,
                    response: this._MicroData,
                };
            },

            // 模拟读取命令
            async readFromDevice(command) {
                console.log('[Mock readFromDevice]', command);
                return {
                    success: true,
                    response: '42',
                };
            },

            // 模拟烧录固件
            async flashFirmware() {
                console.log('[Mock flashFirmware]');
                return {
                    success: true,
                    message: '固件烧录成功（模拟）',
                };
            },

            // 模拟下载代码
            async downloadCode(code) {
                console.log('[Mock downloadCode]', code);

                
                return { success: true };
            },

            // 模拟进入/退出 REPL 模式
            async enterReplMode() {
                console.log('[Mock enterReplMode]');
                await sendSerialCommand('\x03'); 
                await sendSerialCommand('from microbit import *\r',200);
                await sendSerialCommand('from ICreate import *\r',200);
                await sendSerialCommand('display.show(Image.HEART)\n\r', 200);
                return { success: true };
            },
            async exitReplMode() {
                console.log('[Mock exitReplMode]');
                return { success: true };
            },
            async enterDownloadMode() {
                console.log('进入下载模式')
                await sendSerialCommand('\x03'); 
                await sendSerialCommand('\x04'); 
                return { success: true };
            },

            // 模拟 USB 设备请求
            async requestUSBPermission() {
                console.log('[Mock requestUSBPermission]');
                return {
                    success: true,
                    devices: [
                    { comPort: '模拟端口-1' },
                    { comPort: '模拟端口-2' },
                    ],
                };
            },

            // 模拟连接设备
            async connectUSBDevice(device) {
                console.log('[Mock connectUSBDevice]', device);
                return { success: true };
            },

            // 模拟断开设备
            async disconnectUSBDevice() {
                console.log('[Mock disconnectUSBDevice]');
                return { success: true };
            },

            // 模拟 USB 事件监听
            onUSBDeviceEvent(callback) {
                console.log('[Mock onUSBDeviceEvent 注册]');
                // 模拟设备连接后2秒触发
                setTimeout(() => {
                    callback('connected', { comPort: '模拟端口-1' });
                }, 2000);
                // 模拟设备进度
                setTimeout(() => {
                    callback('', null, 50);
                }, 4000);
            },
        };
    }
    useEffect(()=>{
        getBricksPort.addEventListener('message',async(event)=>{
            if(!isElectron && event.data=='getPortState' && getCurrent()=='ICBricks'){
                const uint8Array = new Uint8Array([5]);
                await window.__bluetoothCharacteristicWrite2nd.writeValue(uint8Array.buffer)
            }
        })
    },[])
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
        
        channelPort.addEventListener('message', async(event) => {
            // Socket?.send(JSON.stringify({
            //     type: 'port',
            //     data: { message: event.data }
            // }));
            console.log('$$$$$$$$$$$$$$$$$$$$$$')
            console.log(event.data)
            if(typeof event.data=='string'){
                // setPortData(event.data)
                // let str = event.data+'\n'
                // const encoder = new TextEncoder();
                // const buffer = encoder.encode(str);

                // console.log(buffer)
                // await new Promise(r => setTimeout(r, 100));
                // if (window.__serialWriter) {
                //     window.__serialWriter.write(buffer).catch((err) => {
                //         console.error("写入失败:", err);
                //     });
                // } else {
                // console.warn("没有 writer，无法写入");
                // }
                await safeSerialWrite(window.__serialWriter,event.data)
                
            }
            
        });
    }, []);

    function crc16(arr) {
        let crc = 0xFFFF;
        for (let i = 0; i < arr.length; i++) {
        crc ^= arr[i];
        for (let j = 0; j < 8; j++) {
            if (crc & 0x0001) {
            crc = (crc >> 1) ^ 0xA001;
            } else {
            crc >>= 1;
            }
            crc &= 0xFFFF; // 保持 16 位
        }
        }
        return crc;
    }
    useEffect(() => {
        let writeQueue = Promise.resolve();

        function safeWrite(characteristic, buffer, timeoutMs = 6000) {
          // 把任务排进队列
        //   writeQueue = writeQueue.then(() => {
        //     return characteristic.writeValue(buffer);
        //   }).catch(err => {
        //     console.error("写入失败:", err);
        //   });

        //   return writeQueue;
            writeQueue = writeQueue.then(async () => {
                // 先创建一个等待响应的 Promise
                const responsePromise = createPromiseForRobot(timeoutMs);
            
                // 再发送
                await characteristic.writeValue(buffer);
            
                // 等待本次发送对应的返回
                return await responsePromise;
            
            }).catch(err => {
                console.error("写入或等待失败:", err);
                //throw err;
            });
            
            return writeQueue;
        }

        
        
        channelBleData.addEventListener('message', async(event) => {
            console.log('收到数据：')
            console.log(event.data)
            if(getCurrent()=='ICBricks'){
                let data=JSON.parse(event.data)
                const uint8Array = new Uint8Array(data);
                console.log(uint8Array.buffer)
                if(data.length==1 && data[0]==5){
                    //获取所有端口状态
                    await window.__bluetoothCharacteristicWrite2nd.writeValue(uint8Array.buffer)
                }else{
                    await window.__bluetoothCharacteristicWrite.writeValue(uint8Array.buffer)
                }
            }else if(getCurrent()=='ICRobot'){
                console.log('robotble发送',event.data)
                console.log(event.data)
                let data = event.data; 

                // 转成 Uint8Array
                const raw = new Uint8Array(JSON.parse(data));

                // 计算 CRC16
                let crc = crc16(raw);

                // 新建数组，长度 = 原始数据 + 2
                let packet = new Uint8Array(raw.length + 2);
                packet.set(raw, 0);
                packet[raw.length] = (crc >> 8) & 0xFF;  // 高字节
                packet[raw.length + 1] = crc & 0xFF;     // 低字节
                console.log(packet.buffer)

                const isCC03 =
                data.length === 2 &&
                data[0] === 0xCC &&
                data[1] === 0x03;

                // const hasOtherWriteChar =
                // window.__bluetoothCharacteristicWrite2nd &&
                //   typeof window.__bluetoothCharacteristicWrite2nd.writeValue === 'function';

                // const writeChar =
                //   isCC03 && hasOtherWriteChar
                //     ? window.__bluetoothCharacteristicWrite2nd
                //     : window.__bluetoothCharacteristicWrite;
                // console.log(isCC03)
                // console.log(hasOtherWriteChar)
                // console.log(writeChar)
                // if(hasOtherWriteChar && isCC03){
                //     window.__bluetoothCharacteristicWrite2nd.writeValue(packet.buffer)
                // }else{
                //     await safeWrite(window.__bluetoothCharacteristicWrite, packet.buffer);
                // }

                const writeChar =
                isCC03
                ? window.__bluetoothCharacteristicWrite2nd
                : window.__bluetoothCharacteristicWrite;

                ble.write(
                    window.__deviceId,
                    window.__bluetoothServer,
                    writeChar,
                    packet.buffer,
                    function () {
                        console.log("发送成功:", packet);
                    },
                    function (err) {
                        console.error("发送失败", err);
                    }
                );
                
            }

            
            
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


    

    // async function createPromiseForSerial(port, reader) {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //         while (true) {
    //             const { value, done } = await reader.read();
    //             if (done) {
    //             console.log("🔌 Reader 已关闭");
    //             break;
    //             }
    //             if (value) {
    //             const textChunk = new TextDecoder().decode(value);
    //             bufferData += textChunk;

    //             if (bufferData.endsWith('\r\n')) {
    //                 const message = bufferData.trim();
    //                 bufferData = '';

    //                 let parsed;
    //                 let finalValue;

    //                 try {
    //                 //  判断是否是 ESP32 特殊格式 {[…]}
    //                 if (/^\{\[.*\]\}$/.test(message)) {
    //                     const match = message.match(/\[(.*?)\]/);
    //                     if (match) {
    //                     parsed = match[1].split(',').map(n => Number(n.trim()));
    //                     }
    //                 } else {
    //                     //  普通 JSON 格式
    //                     parsed = JSON.parse(message);
    //                 }
    //                 finalValue = parsed;
    //                 } catch {
    //                 finalValue = message;
    //                 }

    //                 //  收到 [0] 或 "[0]" 结束等待
    //                 if (
    //                 (Array.isArray(finalValue) && finalValue.length === 1 && finalValue[0] === 0) ||
    //                 (typeof finalValue === "string" && finalValue.includes("[0]"))
    //                 ) {
    //                 console.log(" 收到结束信号 [0]");
    //                 resolve(0);
    //                 break;
    //                 }
    //             }
    //             }
    //         }
    //         } catch (err) {
    //         console.error("读取串口数据错误:", err);
    //         reject(err);
    //         }
    //     });
    // }

    async function createPromiseForSerial(timeout = 10000) {
        return new Promise((resolve, reject) => {
            let timer;

            const listener = (msg) => {
            let finalValue = msg.data?.message;

            try {
                // 情况 1：数组 [0]
                if (Array.isArray(finalValue) && finalValue.length === 1 && finalValue[0] === 0) {
                cleanup();
                resolve(0);
                return;
                }

                // 情况 2：字符串包含 [0]
                if (typeof finalValue === "string" && finalValue.includes("[0]")) {
                cleanup();
                resolve(0);
                return;
                }

            } catch (e) {
                console.error("createPromiseForSerial 解析失败:", e);
            }
            };

            function cleanup() {
            clearTimeout(timer);
            window.__removeSerialListener(listener);
            }

            // 注册监听
            window.__addSerialListener(listener);

            // 超时自动 reject
            timer = setTimeout(() => {
            cleanup();
            reject(new Error("等待串口返回超时"));
            }, timeout);
        });
        }
    async function sendCode(port, writer, reader, code, socket) {
        try {
            // 🔁 创建等待 promise
            const p1 = createPromiseForSerial();

            // 🔧 拼接要发送的代码
            let downloadCode = code.code + '\n';
            const jsonData = {
            command: "upload_script",
            params: {
                name: `${code.place}.py`,
                script: downloadCode
            }
            };

            const str = JSON.stringify(jsonData) + '\n';
            console.log("📤 发送数据:", str);

            // ✍️ 写入串口
            const encoder = new TextEncoder();
            await writer.write(encoder.encode(str));
            // console.log(encoder.encode(str))

            // ⏳ 等待设备返回 [0]
            await p1;

            console.log("✅ 所有数据包发送完毕");

            // 🔔 通知 WebSocket

            setIsLoading(false)
            clearTimeout(serialDownloadTimer)
            showToast(formatMessage({
                id: 'gui.alert.downSuccess',
                default: 'Download successful',
                description: 'gui.alert.downSuccess'
            }));

        } catch (err) {
            console.error("❌ 串口写入失败:", err);
        }
    }


    function createPromise() {
        return new Promise(resolve => {
        const eventListener = async (event) => {
            let value = await event.target.value;
            // state = value.getUint8(0);
            //   console.log(value.byteLength)
            lanyaMsg=[]
            for (let i=0;i<value.byteLength-1;i++){
                lanyaMsg.push(value.getUint8(i))
            }
            console.log(lanyaMsg)
            resolve(); // Signal event handling is done
            window.__bluetoothCharacteristicRead2nd.removeEventListener('characteristicvaluechanged', eventListener); // 移除事件监听器
        };
        window.__bluetoothCharacteristicRead2nd.addEventListener('characteristicvaluechanged', eventListener);
        });
    }
    async function downOneCode(code,isFirst,isLast){
        const encoder = new TextEncoder();
        if(isFirst){
        const data1 = encoder.encode('Lua:').buffer;
        await window.__bluetoothCharacteristicWrite2nd.writeValue(data1)
        }

        // const code=stringToBinary(CODE)
        
        const data2 = encoder.encode(code).buffer;
        console.log(data2)
        await window.__bluetoothCharacteristicWrite2nd.writeValue(data2)
        
        if(isLast){
            
            const data3 = encoder.encode('endLua1').buffer;
            await window.__bluetoothCharacteristicWrite2nd.writeValue(data3)
            await createPromise()
            if((lanyaMsg[0]==7 && lanyaMsg[1]==4) || (lanyaMsg[0]==8 && lanyaMsg[1]==1)){
            // window.bleAPI.setIsDownLoad(true)
            channelBleIsDown.postMessage(true)
            setIsLoading(false)
            clearTimeout(bleDownloadTimer)
            showToast(formatMessage({
                id: 'gui.alert.downSuccess',
                default: 'Download successful',
                description: 'gui.alert.downSuccess'
            }));
            // alert('下载结束')
            }
        
        }
        
        // const data4=encoder.encode('Lua1').buffer;
        // await characteristicWriteDown.writeValue(data4)
        console.log('执行了')
    }
    async function downLoadLua(){
        // console.log(CODE);
        let CODE =codeModule.getCode()
        if(CODE.length<=500){
            downOneCode(CODE,true,true)
        }else{
        let start=0
        let end=500
        let flag=true
        let isLast=false
        let isFirst=true
        while(flag){
            if(end>=CODE.length){
            flag=false
            end=CODE.length
            isLast=true
            }
            let tempC=CODE.substring(start, end)
            console.log(tempC)
            await downOneCode(tempC,isFirst,isLast)
            isFirst=false
            start=end
            end=end+500
        }
        
        }
        

    }
    async function cancelDown(){
        const encoder = new TextEncoder();
        const data3 = encoder.encode('endLua2').buffer;
        await window.__bluetoothCharacteristicWrite2nd.writeValue(data3)
        
    }



     function toTwoDigitHexadecimalPair(decimal) {
        if (decimal < 0) {
            throw new Error("Input must be a non-negative integer");
        }

        const rightHex = decimal % 256; // 右边的两位十六进制数表示255以内的数
        const leftHex = Math.floor(decimal / 256); // 左边的两位十六进制数表示右边数满255时往左边进位的次数

        return [
            // leftHex.toString(16).padStart(2, '0'), // 转换为两位十六进制字符串
            // rightHex.toString(16).padStart(2, '0'), // 转换为两位十六进制字符串
            leftHex,
            rightHex
        ];
    }


    function stringToBinary(str) {
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(str);
        return uint8Array;
    }
    function splitUint8Array(uint8Array, chunkSize = 500) {
        const chunks = [];
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
        let slice = uint8Array.slice(i, i + chunkSize);

        // 新包长度 = 头(2) + 数据(N) + CRC16(2)
        let packet = new Uint8Array(slice.length + 4);

        // 设置包头
        packet[0] = 0xaa;
        packet[1] = 0x02;

        // 复制数据
        packet.set(slice, 2);

        // 计算 CRC16（头 + 数据）
        let crc = crc16(packet.slice(0, packet.length - 2));

        // 填充 CRC16 高低字节
        packet[packet.length - 2] = (crc >> 8) & 0xFF;
        packet[packet.length - 1] = crc & 0xFF;

        chunks.push(packet);
        }
        return chunks;
    }

    function createPromiseForRobot(timeoutMs = 6000) {
        return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            // 超时处理
            window.__responseQueue = window.__responseQueue.filter(item => item.resolve !== resolve);
            reject(new Error(`等待超时（>${timeoutMs}ms 未收到数据）`));
        }, timeoutMs);

        // 推入队列，由全局监听处理
        window.__responseQueue.push({ resolve, reject, timer });
        });
    }
    async function downLoadForRobot(place){
        try{
            // startMsg
            let CODE=codeModule.getCode()
            console.log(CODE.length)
            let startRaw = new Uint8Array([0xbb, 0x01, place, toTwoDigitHexadecimalPair(CODE.length)[0],toTwoDigitHexadecimalPair(CODE.length)[1]]);
            let crcStart = crc16(startRaw);
            let startMsg = new Uint8Array(startRaw.length + 2);
            startMsg.set(startRaw, 0);
            startMsg[startRaw.length] = (crcStart >> 8) & 0xFF; // 高字节
            startMsg[startRaw.length + 1] = crcStart & 0xFF;    // 低字节

            // endMsg
            let endRaw = new Uint8Array([0xbb, 0x02]);
            let crcEnd = crc16(endRaw);
            let endMsg = new Uint8Array(endRaw.length + 2);
            endMsg.set(endRaw, 0);
            endMsg[endRaw.length] = (crcEnd >> 8) & 0xFF;
            endMsg[endRaw.length + 1] = crcEnd & 0xFF;

            let codeBin=stringToBinary(CODE)
            // let crcCode = crc16(codeBin)
            // let codeCrcMsg = new Uint8Array(codeBin.length+2)
            // codeCrcMsg.set(codeBin,0)
            // codeCrcMsg[codeBin.length] = (crcCode >> 8) & 0xFF
            // codeCrcMsg[codeBin.length+1] = crcCode & 0xFF

            let codeMsg=splitUint8Array(codeBin)
            console.log(startMsg)
            console.log(endMsg)
            console.log(codeMsg)
            const promise1 = createPromiseForRobot(); // 先创建 Promise 并加入队列
            await window.__bluetoothCharacteristicWrite.writeValue(startMsg)
            await promise1
            for(let i=0;i<codeMsg.length;i++){
                const promise2 = createPromiseForRobot(); // 先创建 Promise 并加入队列
                await window.__bluetoothCharacteristicWrite.writeValue(codeMsg[i])
                await promise2
            }
            const promise3 = createPromiseForRobot(); // 先创建 Promise 并加入队列
            await window.__bluetoothCharacteristicWrite.writeValue(endMsg)
            await promise3
            // window.bleAPI.setIsDownLoad(true)
            channelBleIsDown.postMessage(true)
            setIsLoading(false)
            clearTimeout(bleDownloadTimer)
            showToast(formatMessage({
                id: 'gui.alert.downSuccess',
                default: 'Download successful',
                description: 'gui.alert.downSuccess'
            }));
        }catch(e){
         console.log(e)
        }
        

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
                    if(isElectron){
                        download(args);
                    }else{
                        downLoadLua()
                    }
                    
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
                    if(isElectron){
                        cancelload();
                    }else{
                        cancelDown()
                    }
                    
                }
                //  setIsDown(!isDown);
            }else if(extensionName=='ICRobot'){
                if(isElectron){
                    download(args);
                }else{
                    downLoadForRobot(args)
                }
                
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
                if(getCurrent()=='ICRobot'){
                    let data={
                        place:place,
                        code:codeModule.getCode()
                    }
                    sendCode(window.__serialPort,window.__serialWriter,window.__serialReader,data)
                }else{
                    SerialDownload(place);
                }
                
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

    const handleModeChange = async(mode) => {
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

            // soc.send(JSON.stringify({
            //     type:'mode',
            //     data:!showCode
            // }))

            
            if(!showCode){
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
                    // soc?.send(JSON.stringify({
                    //     type: 'port',
                    //     data: { message: JSON.stringify({
                    //         "command": "select_mode",
                    //         "params": 
                    //             {
                    //                 "mode": `file`,
                    //             }
                    //     })}
                    // }));
                    const jsonData = {
                        command: "select_mode",
                        params: { mode:"file"},
                    };
                    const str = JSON.stringify(jsonData) + "\n";
                    const encoder = new TextEncoder();
                    await window.__serialWriter.write(encoder.encode(str));
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
                    // soc?.send(JSON.stringify({
                    //     type: 'port',
                    //     data: { message: JSON.stringify({
                    //         "command": "select_mode",
                    //         "params": 
                    //             {
                    //                 "mode": `scratch`,
                    //             }
                    //     })}
                    // }));
                    const jsonData = {
                        command: "select_mode",
                        params: { mode:"scratch"},
                    };
                    const str = JSON.stringify(jsonData) + "\n";
                    const encoder = new TextEncoder();
                    await window.__serialWriter.write(encoder.encode(str));
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


    const aliveRef = useRef(false);
    const socketRef = useRef(null);
    useEffect(() => {
        if (window && window.process && window.process.type) {
            console.log("当前运行在 Electron 环境");
        } else {
            console.log("当前运行在浏览器环境");
        }
        if(!(window && window.process && window.process.type)) return

        aliveRef.current = true;
        console.log('------------------------------')
        isUnMount = false;
        console.log(window);
        let Socket = new WebSocket('ws://localhost:8081');
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
                            const newSocket = new WebSocket('ws://localhost:8081');
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
                        setIsDown(JSON.parse(event.data).data.message);
                        setLongIsDown(JSON.parse(event.data).data.message)
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
                            setLongIsDown(false)
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
            aliveRef.current = false;
            socketRef.current?.close();
            socketRef.current = null;
            Socket?.close();
            // channelPort.close();
            // channelSerialData.close();
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, []);
    const handleDisConnectBlePort = async()=>{
        
        try {
            if (window.__bluetoothDevice?.gatt.connected){
                window.__bluetoothDevice.gatt.disconnect();
                window.__bluetoothDevice = null;
                window.__bluetoothServer = null;
                window.__bluetoothCharacteristicWrite = null;
                window.__bluetoothCharacteristicRead = null;
                window.__bluetoothCharacteristicWrite2nd = null;
                window.__bluetoothCharacteristicRead2nd = null;
                window.__bluetoothRssi = null;
                window.__bluetoothSensorState = [[], [], [], [], [], [], [], [], []];

                handleConnectData({
                    type: "isOpenBluetooth",
                    data: { message: false },
                });
            }


            if (window.__serialReader) await window.__serialReader.cancel();
            if (window.__serialWriter) {
                try {
                    await window.__serialWriter.releaseLock();
                } catch {}
            }
            if (window.__serialPort) {
                if (window.__serialPort.readable || window.__serialPort.writable) await window.__serialPort.close();
                handleConnectData({ type: "isOpenPort", data: { message: false } });
                window.__serialPort = null;
            }
        } catch (err) {
            console.error("断开失败:", err);
        }
    }
    const handledata=async (args)=>{
        console.log('传过来的参数为',args)
        // if (window && window.process && window.process.type) {
        //     console.log("当前运行在 Electron 环境");
        // } else {
        //     console.log("当前运行在浏览器环境");
        // }

        handleDisConnectBlePort()
        stopAll.postMessage(true);
        if(args.type=='open'){
            let extension = args.data.message;
            if (extension == 1) {
                setCurrentExtension('1');
                setExtensionName('ICBricks');
                setCurrent('ICBricks');
                if (extensionSelect[extension - 1]) {
                    setIsBricks(true);
                    channel1.postMessage(extension);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    // await fetch('http://localhost:3000/set-extension', {
                    //     method: 'POST',
                    //     headers: {
                    //         'Content-Type': 'text/plain'
                    //     },
                    //     body: 0
                    // })
                    //     .then(response => response.text())
                    //     .then(data => { })
                    //     .catch(error => {
                    //         console.error('错误:', error);
                    //     });
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
                PROPS.onRequestCloseMasterModal()
                onClickConnect()
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
                    // await fetch('http://localhost:3000/set-extension', {
                    //     method: 'POST',
                    //     headers: {
                    //         'Content-Type': 'text/plain'
                    //     },
                    //     body: 0
                    // })
                        // .then(response => response.text())
                        // .then(data => { })
                        // .catch(error => {
                        //     console.error('错误:', error);
                        // });
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
                console.log(PROPS)
                PROPS.onRequestCloseMasterModal()
                onClickConnect()
            } else if (extension == 3) {
                setCurrentExtension('3');
                setExtensionName('Microbit');
                setCurrent('Microbit');
                if (extensionSelect[extension - 1]) {
                    setIsBricks(false);
                    channel1.postMessage(extension);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
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
                PROPS.onRequestCloseMasterModal()
                onClickConnect()
            }
            channelMode.postMessage(!getShowCodeDb())
        }else if(args.type='close'){
            channelMasterClose.postMessage(args.data.message);
            if (!args.data.message[1]) {
                stopAll.postMessage(true);
            }
            setExtensionName('选择设备');
            setCurrent('');
        }
        
    }
    const handleConnectData=async (args)=>{
        // console.log(args)
        // let dataJson=JSON.parse(args)
        let dataJson=args
        // console.log(dataJson)
        if(dataJson.type=='isOpenPort'){
            if (dataJson.data.message) {
                whatConnect[2] = 1;
            } else {
                whatConnect[2] = 0;
            }
            console.log(dataJson.data.message)
            channelPort.postMessage(dataJson.data.message);
        }else if(dataJson.type=='serialData'){
            window.__serialListeners.forEach(fn => fn(dataJson));
            const channelSerialData = new BroadcastChannel('serial-data');
            channelSerialData.postMessage(dataJson.data.message);
            // console.log('#####',dataJson.data.message)
            setData(prev => prev + dataJson.data.message+'\n');
        }else if(dataJson.type=='bluetoothData'){
            let sensorState=dataJson.data.message
            channel.postMessage(sensorState);  // 广播数据给其他页面
        }else if(dataJson.type=='isOpenBluetooth'){
            if(dataJson.data.message){
                console.log('蓝牙已连接');
                channelBle.postMessage(true)
                whatConnect[0] = 1;
            }else{
                whatConnect[0] = 0;
                channelBle.postMessage(false)
                portArr.forEach(port => {
                    updateChildBallText(port, '', '', false);
                });
                setIsDown(false);
                setLongIsDown(false)
            }
        }else if(dataJson.type=='codeIsRun'){
            setIsDown(dataJson.data.message);
            setLongIsDown(dataJson.data.message)
        }else if(dataJson.type=='robotSensor'){
            window.EditorPreload._setRobotData(dataJson.data);
        }else if(dataJson.type=='robotState'){
            window.EditorPreload._emitState(dataJson.data);
        }else if(dataJson.type=='MicroSerialData'){
            window.EditorPreload.setMicroData(dataJson.data.message);
        }else if(dataJson.type=='wifiIp'){
            let loadTimer
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));

            channelHostPot.postMessage(true);
            IP = dataJson.data.message;
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
        }
    }

    const handleFirmwareData=async (args)=>{
        console.log(JSON.parse(args))
        if (JSON.parse(args).data.message.flashing) {
            setIsFlashing(JSON.parse(args).data.message.flashing);
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsFlashing(JSON.parse(args).data.message.flashing);
        }

        if (typeof JSON.parse(args).data.message.logs === 'string') {
            const newLines = JSON.parse(args).data.message.logs.split(/\r?\n/).filter(line => line.trim() !== '');
            setLogs(prevLogs => [...prevLogs, ...newLines]);
        }

        if (JSON.parse(args).data.message.flashing && (JSON.parse(args).data.message.logs.includes('A serial exception error occurred:') || (JSON.parse(args).data.message.logs.includes('fatal error')))) {
            setLogs([])
            alert(formatMessage({
                id: 'gui.alert.espToolTimeout',
                default: 'Flashing timed out. Please check the port connection',
                description: 'gui.alert.espToolTimeout'
            }));
        }
        if (!JSON.parse(args).data.message.flashing && JSON.parse(args).data.message.logs == 'success') {
            setLogs([])
            alert(formatMessage({
                id: 'gui.alert.espToolFinish',
                default: 'Flashing completed',
                description: 'gui.alert.espToolFinish'
            }));
        } else if (!JSON.parse(args).data.message.flashing && JSON.parse(args).data.message.logs == 'Failed') {
            setLogs([])
            alert(formatMessage({
                id: 'gui.alert.espToolFailed',
                default: 'Flashing failed',
                description: 'gui.alert.espToolFailed'
            }));
        }
    }

    return {
        selectedIndex,
        setSelectedIndex,
        pythonCode,
        setPythonCode,
        portData,
        setPortData,
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
        handleSelect,
        handledata,
        handleConnectData,
        handleFirmwareData
    };
};