// import React, { useState, useEffect, useRef } from "react";
// import styles from "./connectModal.css";
// import { getShowCodeDb } from "scratch-gui/src/components/utils/utils.js";

// /** ✅ 全局只绑定一次设备拔出事件 */
// if (!window.__serialDisconnectBound) {
//   window.__serialDisconnectBound = true;

//   navigator.serial.addEventListener("disconnect", async (event) => {
//     console.warn("🌐 全局监听：串口设备已拔出", event);
//     const port = window.__serialPort;

//     if (port) {
//       try {
//         // ✅ 1. 先取消 reader
//         if (window.__serialReader) {
//           try {
//             await window.__serialReader.cancel();
//           } catch (e) {
//             console.warn("全局拔出事件：取消 reader 失败（可能已关闭）:", e);
//           }
//           window.__serialReader = null;
//         }

//         // ✅ 2. 再释放 writer
//         if (window.__serialWriter) {
//           try {
//             await window.__serialWriter.releaseLock();
//           } catch (e) {
//             console.warn("全局拔出事件：释放 writer 失败（可能已释放）:", e);
//           }
//           window.__serialWriter = null;
//         }

//         // ✅ 3. 然后尝试关闭 port
//         if (port.readable || port.writable) {
//           try {
//             await port.close();
//             console.log("设备拔出后已主动关闭串口连接");
//           } catch (err) {
//             console.warn("设备拔出时关闭端口出错（可能已被系统关闭）:", err);
//           }
//         } else {
//           console.log("设备拔出时端口已被系统关闭，无需再关闭。");
//         }
//         console.log(typeof window.__onSerialConnectData)
//         console.log(window.__onSerialConnectData)
//         if (typeof window.__onSerialConnectData === "function") {
//           window.__onSerialConnectData({
//             type: "isOpenPort",
//             data: { message: false },
//           });
//         }

//         // ✅ 4. 清空全局缓存
//         window.__serialPort = null;
//         window.__serialPortInfo = null;

//         // ✅ 5. 通知组件更新 UI 状态
//         if (window.__onSerialDeviceRemoved) {
//           window.__onSerialDeviceRemoved();
//         }
//       } catch (err) {
//         console.warn("全局清理串口对象失败:", err);
//       }
//     }
//   });
// }

// const ConnectTabs = ({ onRequestClose, handleConnectData, portData }) => {
//   const [activeTab, setActiveTab] = useState("serial");
//   const [port, setPort] = useState(window.__serialPort || null);
//   const [portInfo, setPortInfo] = useState(
//     window.__serialPort?.getInfo ? window.__serialPort.getInfo() : null
//   );

//   const readerRef = useRef(window.__serialReader || null);
//   const writerRef = useRef(window.__serialWriter || null);
//   useEffect(() => {
//     // 把当前组件的 handleConnectData 注册为全局函数
//     window.__onSerialConnectData = handleConnectData;

//     return () => {
//         // 组件卸载时清理
//         // delete window.__onSerialConnectData;
//     };
//     }, [handleConnectData]);
//   useEffect(() => {
//     // 让全局事件可以在设备拔出时更新组件状态
//     window.__onSerialDeviceRemoved = () => {
//         console.log("🔌 串口设备被拔出，全局通知组件更新状态");
//         setPort(null);
//         setPortInfo(null);

//         handleConnectData({
//             type: "isOpenPort",
//             data: { message: false },
//         }
//         );
//     };

//     return () => {
//         // 组件卸载时清理引用
//         delete window.__onSerialDeviceRemoved;
//     };
//     }, []);

//   /** 🔁 接收来自父组件的数据并写入串口 */
//   useEffect(() => {
//     if (!portData) return;
//     console.log("收到新数据:", portData);

//     const encoder = new TextEncoder();
//     const buffer = encoder.encode(portData);

//     if (writerRef.current) {
//       writerRef.current.write(buffer).catch((err) => {
//         console.error("写入失败:", err);
//       });
//     } else {
//       console.warn("没有 writer，无法写入");
//     }
//   }, [portData]);

//   /** 🔌 授权并连接串口 */
//   const handleScanAndConnect = async () => {
//     try {
//         const filters = [
//             { usbVendorId: 0x1A86 }, // CH340
//         ];
//       const newPort = await navigator.serial.requestPort({ filters });
//       await newPort.open({ baudRate: 115200 });

//       console.log(newPort)
//       const info = newPort.getInfo ? newPort.getInfo() : {};
//       setPort(newPort);
//       setPortInfo(info);

//       // 存入全局
//       window.__serialPort = newPort;
//       window.__serialPortInfo = info;

//       handleConnectData({
//           type: "isOpenPort",
//           data: { message: true },
//         }
//       );

//       // 创建 writer
//       const writer = newPort.writable.getWriter();
//       writerRef.current = writer;
//       window.__serialWriter = writer;

//       // 写入初始命令
//       const jsonData = {
//         command: "select_mode",
//         params: { mode: getShowCodeDb() ? "file" : "scratch" },
//       };
//       const str = JSON.stringify(jsonData) + "\n";
//       const encoder = new TextEncoder();
//       await writer.write(encoder.encode(str));

//       // 启动监听
//       listenToPortData(newPort);
//     } catch (err) {
//       console.error("连接失败:", err);
//     }
//   };

//   /** 📡 监听串口数据 */
//   const listenToPortData = async (serialPort) => {
//     if (!serialPort.readable) return;

//     // 如果 readable 已被锁定，跳过
//     if (serialPort.readable.locked) {
//       console.warn("readable 流已被锁定，跳过重复监听");
//       return;
//     }

//     const reader = serialPort.readable.getReader();
//     readerRef.current = reader;
//     window.__serialReader = reader;

//     let bufferData = "";

//     try {
//       while (true) {
//         const { value, done } = await reader.read();
//         if (done) break;
//         if (value) {
//           bufferData += new TextDecoder().decode(value);
//           if (bufferData.endsWith("\r\n")) {
//             const message = bufferData.trim();
//             bufferData = "";

//             try {
//               let parsed;
//               if (/^\{\[.*\]\}$/.test(message)) {
//                 const match = message.match(/\[(.*?)\]/);
//                 if (match) parsed = match[1].split(",").map((n) => Number(n.trim()));
//               } else {
//                 parsed = JSON.parse(message);
//               }

//             //   console.log('111',parsed)
//               handleConnectData({
//                 type: "serialData",
//                 data: { message: parsed },
//               });
//             } catch {
//                 // console.log('222',message)
//                 handleConnectData({
//                     type: "serialData",
//                     data: { message },
//                 });
//             }
//           }
//         }
//       }
//     } catch (err) {
//       console.error("读取串口数据错误:", err);
//     } finally {
//       try {
//         reader.releaseLock();
//       } catch {}
//       readerRef.current = null;
//       window.__serialReader = null;
//     }
//   };

//   /** ❌ 断开连接 */
//   const handleDisconnect = async (isDeviceRemoved = false) => {
//     try {
//       if (readerRef.current) {
//         await readerRef.current.cancel();
//         readerRef.current = null;
//       }

//       if (writerRef.current) {
//         try {
//           await writerRef.current.releaseLock();
//         } catch (e) {
//           console.warn("释放 writer 失败（可能已释放）:", e);
//         }
//         writerRef.current = null;
//       }

//       if (port) {
//         // 判断端口是否仍然可用（浏览器拔出设备时会自动关闭）
//         if (port.readable || port.writable) {
//           try {
//             await port.close();
//           } catch (e) {
//             console.warn("关闭 port 时出错（可能已自动关闭）:", e);
//           }
//         } else {
//           console.log("Port 已经自动关闭，无需再次关闭。");
//         }

//         handleConnectData(
//             {
//               type: "isOpenPort",
//               data: { message: false },
//             }
//           );
//         // if (!isDeviceRemoved) {
//         //   handleConnectData(
//         //     {
//         //       type: "isOpenPort",
//         //       data: { message: false },
//         //     }
//         //   );
//         // }

//         setPort(null);
//         setPortInfo(null);
//         window.__serialPort = null;
//         window.__serialReader = null;
//         window.__serialWriter = null;
//         window.__serialPortInfo = null;
//       }
//     } catch (err) {
//       console.error("断开失败:", err);
//     }
//   };

//   /** 🧩 组件加载时检测已有连接 */
//   useEffect(() => {
//     const checkPort = async () => {
//       if (window.__serialPort) {
//         try {
//           // 测试端口是否仍然有效
//           await window.__serialPort.getSignals();
//           setPort(window.__serialPort);
//           setPortInfo(window.__serialPortInfo || null);
//           console.log("恢复已连接串口:", window.__serialPort);

//           // 恢复监听
//           listenToPortData(window.__serialPort);
//         } catch {
//           console.warn("检测到上次连接的串口已断开");
//           window.__serialPort = null;
//           window.__serialReader = null;
//           window.__serialWriter = null;
//           window.__serialPortInfo = null;
//           setPort(null);
//           setPortInfo(null);
//         }
//       }
//     };
//     checkPort();
//   }, []);

//   return (
//     <div className={styles.overlay}>
//       <div className={styles.connectContainer}>
//         <div className={styles.headerRow}>
//             <button className={styles.closeButton} onClick={onRequestClose}>✕</button>
//         </div>

//         <div className={styles.tabBar}>
//           {["serial", "bluetooth", "wifi", "qr"].map((key) => (
//             <div
//               key={key}
//               className={`${styles.tab} ${
//                 activeTab === key ? styles.active : ""
//               }`}
//               onClick={() => setActiveTab(key)}
//             >
//               {key === "serial"
//                 ? "串口"
//                 : key === "bluetooth"
//                 ? "蓝牙"
//                 : key === "wifi"
//                 ? "WiFi"
//                 : "二维码"}
//             </div>
//           ))}
//         </div>

//         <div className={styles.content}>
//           {activeTab === "serial" && (
//             <div className={styles.serialPanel}>
//               <div className={styles.serialCard}>
//                 <div className={styles.serialStatus}>
//                   <div
//                     className={`${styles.statusDot} ${
//                       port ? styles.connected : styles.disconnected
//                     }`}
//                   ></div>
//                   <span className={styles.deviceText}>
//                     {portInfo
//                       ? `已连接设备 | VID: ${portInfo.usbVendorId || "未知"} | PID: ${
//                           portInfo.usbProductId || "未知"
//                         }`
//                       : "未连接设备"}
//                   </span>
//                 </div>

//                 <div className={styles.serialButtons}>
//                   <button
//                     className={`${styles.serialBtn} ${styles.scanBtn}`}
//                     onClick={handleScanAndConnect}
//                     disabled={!!port}
//                   >
//                     {port ? "已授权" : "扫描设备"}
//                   </button>

//                   <button
//                     className={`${styles.serialBtn} ${styles.disconnectBtn}`}
//                     onClick={handleDisconnect}
//                     disabled={!port}
//                   >
//                     断开连接
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//           {activeTab === "bluetooth" && (
//             <div></div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ConnectTabs;
import React, { useState, useEffect, useRef } from "react";
import styles from "./connectModal.css";
import { getShowCodeDb } from "scratch-gui/src/components/utils/utils.js";
import {getCurrent,setVersion,getVersion } from '../utils/utils.js';
import formatMessage  from 'format-message';

import {getLatestMicrobitVersionWithFallback} from '../TabSwitcher/microbitLatest'

import {FormattedMessage} from 'react-intl';

import {QRCodeSVG} from 'qrcode.react';

import {getLastTime,setLastTime} from '../utils/utils'
import {safeSerialWrite} from '../utils/safeSerialWrite'

let isCheckMicrobit=false
let heartTime;
let timeSpace;
/** 串口全局监听（保持不变） */
if (!window.__serialDisconnectBound) {
  window.__serialDisconnectBound = true;
  try{
    navigator.serial.addEventListener("disconnect", async (event) => {
      console.warn(" 全局监听：串口设备已拔出", event);
      setVersion(['microbit',''])
      setVersion(['icrobot',''])
      if(heartTime){
        clearInterval(heartTime)
      }
      if (event.target !== window.__serialPort) return
      alert(formatMessage({
                    id: 'gui.connect.serialDisconnect',
                    default: 'Serial connection disconnected',
                    description: 'gui.connect.serialDisconnect'
            }))
      const port = window.__serialPort;
      if (port) {
        try {
          if (window.__serialReader) {
            try {
              await window.__serialReader.cancel();
            } catch (e) {
              console.warn("取消 reader 失败:", e);
            }
            window.__serialReader = null;
          }
  
          if (window.__serialWriter) {
            try {
              await window.__serialWriter.releaseLock();
            } catch (e) {
              console.warn("释放 writer 失败:", e);
            }
            window.__serialWriter = null;
          }
  
          if (port.readable || port.writable) {
            try {
              await port.close();
            } catch (err) {
              console.warn("关闭端口失败:", err);
            }
          }
  
          if (typeof window.__onSerialConnectData === "function") {
            window.__onSerialConnectData({
              type: "isOpenPort",
              data: { message: false },
            });
          }
  
          window.__serialPort = null;
          window.__serialPortInfo = null;
  
          if (window.__onSerialDeviceRemoved) {
            window.__onSerialDeviceRemoved();
          }
        } catch (err) {
          console.warn("全局清理失败:", err);
        }
      }
    });
  }catch(e){
    console.log('无法使用web serial')
  }
  
}

/** ✅ 初始化蓝牙全局状态（只执行一次） */
if (!window.__bluetoothGlobalBound) {
  console.log('$$$$$$$$$')
  window.__bluetoothGlobalBound = true;
  window.__bluetoothDevice = null;
  window.__bluetoothServer = null;
  window.__bluetoothCharacteristicWrite = null;
  window.__bluetoothCharacteristicRead = null;
  window.__bluetoothCharacteristicWrite2nd = null;
  window.__bluetoothCharacteristicRead2nd = null;
  window.__bluetoothRssi = null;
  window.__responseQueue=[]
  // sensorState: 九个数组（最后一位是其他类型数据），与原始逻辑一致
  window.__bluetoothSensorState = [[], [], [], [], [], [], [], [], []];

  window.__onBluetoothDisconnected = () => {
    console.warn("🌐 全局监听：蓝牙设备已断开");
    alert(formatMessage({
                    id: 'gui.connect.bleDisconnect',
                    default: 'Bluetooth connection disconnected',
                    description: 'gui.connect.bleDisconnect'
            }))
    window.__bluetoothDevice = null;
    window.__bluetoothServer = null;
    window.__bluetoothCharacteristicWrite = null;
    window.__bluetoothCharacteristicRead = null;
    window.__bluetoothCharacteristicWrite2nd = null;
    window.__bluetoothCharacteristicRead2nd = null;
    window.__bluetoothRssi = null;
    window.__responseQueue=[]
    window.__bluetoothSensorState = [[], [], [], [], [], [], [], [], []];

    setVersion(['icrobot',''])
    if (typeof window.__onBluetoothConnectData === "function") {
      window.__onBluetoothConnectData({
        type: "isOpenBluetooth",
        data: { message: false },
      });
    }
  };
}

const ConnectTabs = ({ onRequestClose, handleConnectData, portData }) => {
  const [activeTab, setActiveTab] = useState("serial");
  const [port, setPort] = useState(window.__serialPort || null);
  const [portInfo, setPortInfo] = useState(
    window.__serialPort?.getInfo ? window.__serialPort.getInfo() : null
  );

  const readerRef = useRef(window.__serialReader || null);
  const writerRef = useRef(window.__serialWriter || null);

  /** 🔵 蓝牙状态（从全局恢复） */
  const [bluetoothDevice, setBluetoothDevice] = useState(window.__bluetoothDevice || null);
  const [bluetoothServer, setBluetoothServer] = useState(window.__bluetoothServer || null);
  const [bluetoothCharacteristicWrite, setBluetoothCharacteristicWrite] = useState(window.__bluetoothCharacteristicWrite || null);
  const [bluetoothCharacteristicRead, setBluetoothCharacteristicRead] = useState(window.__bluetoothCharacteristicRead || null);
  const [bluetoothCharacteristicWrite2nd, setBluetoothCharacteristicWrite2nd] = useState(window.__bluetoothCharacteristicWrite2nd || null);
  const [bluetoothCharacteristicRead2nd, setBluetoothCharacteristicRead2nd] = useState(window.__bluetoothCharacteristicRead2nd || null);
  const [rssi, setRssi] = useState(window.__bluetoothRssi || null);

  const [filterMode, setFilterMode] = useState('filter'); 

  const icRobotConnectedRef = useRef(false);

  const icRobotHandshakeTimerRef = useRef(null);


  useEffect(() => {
    window.__onSerialConnectData = handleConnectData;
    window.__onBluetoothConnectData = handleConnectData;
  }, [handleConnectData]);

  useEffect(() => {
    window.__onSerialDeviceRemoved = () => {
      setPort(null);
      setPortInfo(null);
      handleConnectData({ type: "isOpenPort", data: { message: false } });
    };
    return () => delete window.__onSerialDeviceRemoved;
  }, []);

  /** 🔌 串口逻辑保持不变 */
  useEffect(() => {
    if (!portData) return;
    const encoder = new TextEncoder();
    const buffer = encoder.encode(portData);
    if (writerRef.current) writerRef.current.write(buffer).catch(console.error);
  }, [portData]);

  // const handleScanAndConnect = async () => {
  //   try {
  //     const filters = [{ usbVendorId: 0x1A86 }];
  //     const newPort = await navigator.serial.requestPort({ filters });
  //     await newPort.open({ baudRate: 115200 });
  //     const info = newPort.getInfo ? newPort.getInfo() : {};
  //     setPort(newPort);
  //     setPortInfo(info);
  //     window.__serialPort = newPort;
  //     window.__serialPortInfo = info;
  //     handleConnectData({ type: "isOpenPort", data: { message: true } });
  //     const writer = newPort.writable.getWriter();
  //     writerRef.current = writer;
  //     window.__serialWriter = writer;
  //     const jsonData = {
  //       command: "select_mode",
  //       params: { mode: getShowCodeDb() ? "file" : "scratch" },
  //     };
  //     const str = JSON.stringify(jsonData) + "\n";
  //     const encoder = new TextEncoder();
  //     await writer.write(encoder.encode(str));
  //     listenToPortData(newPort);
  //   } catch (err) {
  //     console.error("连接失败:", err);
  //   }
  // };


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

  async function sendSerialCommand(command, delay = 50) {
    console.log('111111111111111111111111111111111111111')
    const encoder = new TextEncoder();
    const buffer = encoder.encode(command);
    
    await window.__serialWriter.write(buffer);
      // return new Promise((resolve, reject) => {
      //   window.__serialWriter.write(buffer, err => {
      //     if (err) return reject(err);
      //     // writer.releaseLock()
      //     setTimeout(resolve, delay);
      //   });
      // });
  }

  const handleScanAndConnect = async () => {
    try {
      // 🚀 请求用户选择端口
      const newPort = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x0D28, usbProductId: 0x0204  },
          { usbVendorId: 0x0D28, usbProductId: 0x0205  },
          { usbVendorId: 0x1A86 },
        ]
      });
      const info = newPort.getInfo ? newPort.getInfo() : {};
      console.log("🔍 识别到设备信息:", info);

      // ✅ 判断是否为 micro:bit（VID: 0x0D28，PID: 0x0204 / 0x0205）
      const isMicrobit =
        info.usbVendorId === 0x0d28 &&
        (info.usbProductId === 0x0204 || info.usbProductId === 0x0205);

      if (isMicrobit) {
        console.log("🟡 检测到 micro:bit，启用双连接 (USB + Serial)");

        /** 1️⃣ 打开串口连接 */
        await newPort.open({ baudRate: 115200 });
        setPort(newPort);
        setPortInfo(info);
        window.__serialPort = newPort;
        window.__serialPortInfo = info;

        /** 2️⃣ 打开 WebUSB 连接 */
       try{
         const usbDevice = await navigator.usb.requestDevice({
          filters: [{ vendorId: 0x0d28 }],
          });
          await usbDevice.open();
          if (usbDevice.configuration === null) {
            await usbDevice.selectConfiguration(1);
          }
          // await usbDevice.claimInterface(0);

          const iface = usbDevice.configuration.interfaces.find(
            i => i.alternates[0].interfaceClass === 0xff
          );
          if (iface) {
            await usbDevice.claimInterface(iface.interfaceNumber);
            window.__microbitUSB = usbDevice;
            console.log("✅ micro:bit WebUSB 接口已连接 (class=0xFF)");
          } else {
            console.warn("⚠️ 未找到可用的 micro:bit WebUSB 接口");
          }
          
          console.log("✅ micro:bit USB 接口已就绪:", usbDevice);
          window.__microbitUSB = usbDevice;
       }catch(e){
        console.log(e)
       }

        

        /** 3️⃣ 建立串口写入器并发送初始化命令 */
        const writer = newPort.writable.getWriter();
        writerRef.current = writer;
        window.__serialWriter = writer;

        // const textEncoder = new TextEncoderStream();
        // const writableStreamClosed = textEncoder.readable.pipeTo(window.__serialPort.writable);
        // const writer = textEncoder.writable.getWriter();
        // writerRef.current = writer;
        // window.__serialWriter = writer;

        handleConnectData({ type: "isOpenPort", data: { message: true } });

        // 发送初始化命令（与原逻辑保持一致）
        // const jsonData = {
        //   command: "select_mode",
        //   params: { mode: getShowCodeDb() ? "file" : "scratch" },
        // };
        // const str = JSON.stringify(jsonData) + "\n";
        // const encoder = new TextEncoder();
        // await writer.write(encoder.encode(str));

        /** 4️⃣ 启动串口监听 */
        listenToPortData(newPort);

        isCheckMicrobit=true
        await new Promise(resolve => setTimeout(resolve, 1000))

        await sendSerialCommand('\x03'); 
        await sendSerialCommand('from microbit import *\r',200);
        await sendSerialCommand('from ICreate import *\r',200);
        await sendSerialCommand('display.show(Image.HEART)\n\r', 200);
        await sendSerialCommand('get_version()\n\r', 200);//用于获取当前版本号

        console.log("✅ micro:bit 串口与 USB 已同时连接");
        return;
      }

      if(window.__bluetoothDevice){
        handleBluetoothDisconnect()
      }

      // 🧩 普通设备逻辑（原样保留）
      await newPort.open({ baudRate: 115200 });
      
      window.__serialPort = newPort;
      window.__serialPortInfo = info;

      listenToPortData(newPort);

      if (getCurrent() === 'ICRobot') {
        icRobotConnectedRef.current = false;

        // 🚨 启动 3 秒握手超时
        icRobotHandshakeTimerRef.current = setTimeout(() => {
          console.warn("⏱ ICRobot 3 秒未收到 [0]，自动断开");
          // alert()
          showToast(
            formatMessage({
                id: "gui.connect.serialCatchfailedDevice",
                default: 'Serial port connection failed',
                description: "gui.connect.serialCatchfailedDevice"
              })
          )
          handleDisconnect();
        }, 3000);
      }

      const writer = newPort.writable.getWriter();
      writerRef.current = writer;
      window.__serialWriter = writer;

      const jsonData = {
        command: "select_mode",
        params: { mode: getShowCodeDb() ? "file" : "scratch" },
      };
      const str = JSON.stringify(jsonData) + "\n";
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(str));

      icRobotConnectedRef.current = false;
      // setPort(newPort);
      // setPortInfo(info);
      // handleConnectData({ type: "isOpenPort", data: { message: true } });
      window.__serialListeners = [];
      window.__addSerialListener = function (fn) {
        window.__serialListeners.push(fn);
      };
      window.__removeSerialListener = function (fn) {
        window.__serialListeners = window.__serialListeners.filter(f => f !== fn);
      };
      
    } catch (err) {
      console.error("连接失败:", err);
    }
  };



  // function isVersionString(str) {
  //   if (!str) return null;

  //   const match = str.match(/['"]?(\d+(?:\.\d+){2,})['"]?/);
  //   return match ? match[1] : null; 
  // }
  function isVersionString(output) {
      if (!output) return null;

      // 匹配 Python REPL 输出风格：
      // get_version()
      // '1.0.0'
      // >>>
      const match = output.match(/^get_version\(\)\s*\r?\n['"](\d+\.\d+\.\d+)['"]\s*\r?\n>>>$/m);

      return match ? match[1] : null;
  }

  /**
   * 
   * @param {*版本号1} v1 
   * @param {*版本号2} v2 
   * @returns 1:v1>v2;0:v1==v2;-1:v1<v2
   * 
   */
  function compareVersion(v1, v2) {
    if (!v1 || !v2) return 0;
  
    const a = v1.split('.').map(Number);
    const b = v2.split('.').map(Number);
  
    const len = Math.max(a.length, b.length);
  
    for (let i = 0; i < len; i++) {
      const num1 = a[i] || 0;
      const num2 = b[i] || 0;
  
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
  
    return 0;
  }
  
  function parseVersion(num) {
      const str = String(num).padStart(3, '0'); // 防止出现 12 这种情况
      return `${str[0]}.${str[1]}.${str[2]}`;
  }
  const listenToPortData = async (serialPort) => {
    if (!serialPort.readable || serialPort.readable.locked) return;
    const reader = serialPort.readable.getReader();
    readerRef.current = reader;
    window.__serialReader = reader;
    let bufferData = "";
    let currentResponse = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          // bufferData +=value.toString()
          bufferData += new TextDecoder().decode(value);
          // console.log('----',bufferData)
          if(getCurrent()=='Microbit'){

             while (bufferData.includes(">>>")) {
              // 按提示符拆分
              const parts = bufferData.split(">>>");

              // 前面部分（去掉第一个提示符之前的可能空数据）
              const fullResponse = parts.shift().trim();
              bufferData = parts.join(">>>"); // 剩余数据保留（可能是下一次命令）

              if (fullResponse) {
                // 拼上结尾的 >>> 还原完整一块
                const completeMessage = fullResponse + "\n>>>";

                console.log(completeMessage)
                console.log('版本号：',isVersionString(completeMessage))
               if(isCheckMicrobit){
                  if(completeMessage.includes("NameError: name 'get_version' isn't defined")){
                    isCheckMicrobit=false
                    alert(formatMessage({
                      id: 'gui.connect.versionLow',
                      default: 'The current device firmware version is too low,to ensure stable and proper operation, please flash the firmware first.',
                      description: 'gui.connect.versionLow'
                    }))
                  }
                  if(isVersionString(completeMessage)){
                    isCheckMicrobit=false
                    setVersion(['microbit',isVersionString(completeMessage)])
                    try{
                      const res = await getLatestMicrobitVersionWithFallback()
                      console.log(res)
                      
                      let result=compareVersion(isVersionString(completeMessage),res)
                      console.log('abcd:',result)
                      if(result==-1){
                        alert(formatMessage({
                          id: 'gui.connect.versionLow',
                          default: 'The current device firmware version is too low,to ensure stable and proper operation, please flash the firmware first.',
                          description: 'gui.connect.versionLow'
                        }))
                      }
                    }catch(e){
                      console.log(e)
                    }
                  }
               }
                // 如果当前设备是 Microbit，就触发你的逻辑
                handleConnectData({
                  type: "MicroSerialData",
                  data: { message: completeMessage },
                })

                // 清空当前响应缓存
                currentResponse = "";
              }
            }
            
            // // 拆分成多行
            // const lines = bufferData.split(/\r?\n/);

            // // 保留最后一行未完整的片段
            // bufferData = lines.pop();

            // for (const line of lines) {
            //   const trimmed = line.trim();

            //   // 跳过空行、命令行、提示符
            //   if (
            //     trimmed === "" ||
            //     trimmed.startsWith(">>>") ||
            //     trimmed.includes("pin0.read_") // 跳过命令回显
            //   ) continue;

            //   // 打印或处理结果（这里只有 '0'）
            //   // console.log("Result:", trimmed);
            //   handleConnectData({ type: "MicroSerialData", data: { message: trimmed } });
            // }
          }else if(getCurrent()=='ICRobot'){
            // // 启动 ICRobot 握手超时检测（只启动一次）
            // if (!icRobotConnectedRef.current && !icRobotHandshakeTimerRef.current) {
            //   icRobotHandshakeTimerRef.current = setTimeout(() => {
            //     console.warn("⏱ ICRobot 握手超时，3 秒内未收到 [0]，断开串口");
            //     handleDisconnect();
            //   }, 3000);
            // }
            if (bufferData.endsWith("\r\n")) {
              const message = bufferData.trim();
              bufferData = "";

              // console.log(message)
              if (
                !icRobotConnectedRef.current &&
                message.includes('[0]')
              ) {
                icRobotConnectedRef.current = true;

                // ✅ 成功握手，清除超时定时器
                if (icRobotHandshakeTimerRef.current) {
                  clearTimeout(icRobotHandshakeTimerRef.current);
                  icRobotHandshakeTimerRef.current = null;
                }
                timeSpace=Date.now()

                setPort(serialPort);
                setPortInfo(serialPort.getInfo?.() || {});
                if(heartTime){
                  clearInterval(heartTime)
                }
                
                heartTime=setInterval(async ()=>{
                  if(Date.now()-getLastTime()>5000){
                    // console.log('发送了心跳')
                    await safeSerialWrite(
                      window.__serialWriter,
                      JSON.stringify({ data: '1' })
                    );
                    
                  }

                  if(Date.now()-timeSpace>5000){
                    console.log('qqqqqqqq')
                    handleDisconnect()
                  }
                  
                },2000)
                
                handleConnectData({
                  type: "isOpenPort",
                  data: { message: true },
                });

                console.log("✅ ICRobot 串口连接确认成功（收到 [0]）");
              }
              
              timeSpace=Date.now()
              try {
                let parsed;

                // 判断是否是特殊格式 {[…]}
                if (/^\{\[.*\]\}$/.test(message)) {
                  const match = message.match(/\[(.*?)\]/);
                  if (match) {
                    parsed = match[1].split(',').map(n => Number(n.trim()));
                  }
                } else {
                  // 如果是 JSON 就解析，否则丢异常走 catch
                  parsed = JSON.parse(message);
                }

                if(!getVersion().icrobot && parsed[30]){
                  setVersion(['icrobot',parseVersion(parsed[30])])
                }
                // const parsed = JSON.parse(message);
                handleConnectData({ type: "serialData", data: { message: parsed } });
              } catch {
                handleConnectData({ type: "serialData", data: { message } });
              }
            }
          }
          
        }
      }
    } catch (err) {
      console.error("读取串口错误:", err);
    } finally {
      try {
        reader.releaseLock();
      } catch {}
      readerRef.current = null;
      window.__serialReader = null;
    }
  };

  const handleDisconnect = async () => {
    setVersion(['microbit',''])
    setVersion(['icrobot',''])
    if(heartTime){
      clearInterval(heartTime)
    }
    
    if (icRobotHandshakeTimerRef.current) {
      clearTimeout(icRobotHandshakeTimerRef.current);
      icRobotHandshakeTimerRef.current = null;
    }

    icRobotConnectedRef.current = false;
    const jsonData = {
        command: "select_mode",
        params: { mode:"file"},
    };
    const str = JSON.stringify(jsonData) + "\n";
    const encoder = new TextEncoder();
    await window.__serialWriter.write(encoder.encode(str));
    try {
      if (readerRef.current) await readerRef.current.cancel();
      if (writerRef.current) {
        try {
          await writerRef.current.releaseLock();
        } catch {}
      }
      if (window.__serialPort) {
        if (window.__serialPort.readable || window.__serialPort.writable) await window.__serialPort.close();
        handleConnectData({ type: "isOpenPort", data: { message: false } });
        setPort(null);
        setPortInfo(null);
        window.__serialPort = null;
      }

       // ✅ 新增：断开 WebUSB
      if (window.__microbitUSB) {
        try {
          await window.__microbitUSB.close();
          console.log("✅ micro:bit WebUSB 已断开");
        } catch (err) {
          console.warn("断开 WebUSB 失败:", err);
        } finally {
          window.__microbitUSB = null;
        }
      }
    } catch (err) {
      console.error("断开失败:", err);
    }
  };

  /** 🔵 蓝牙连接 —— 把 sensorState 与相关对象写到 window 全局，保留原有解析逻辑 */

  // 使用全局 sensorState（与原逻辑等价）
  function updateSensorState(index, distance) {
    // 确保全局数组存在
    if (!window.__bluetoothSensorState) window.__bluetoothSensorState = [[], [], [], [], [], [], [], [], []];
    const existingIndex = window.__bluetoothSensorState[index].findIndex(item => item[0] === distance[0]);
    if (existingIndex !== -1) {
      window.__bluetoothSensorState[index][existingIndex] = distance; // 替换已有
    } else {
      window.__bluetoothSensorState[index].push(distance); // 新增
    }
  }

  // 初始 local 临时引用（用于解析逻辑；但真实数据存在 window.__bluetoothSensorState）
  if (!window.__bluetoothSensorState) window.__bluetoothSensorState = [[], [], [], [], [], [], [], [], []];
  let distance = [];


  const writeWithTimeout=(characteristic, buffer, timeout) => {
    // return Promise.race([
    //   characteristic.writeValue(buffer),
    //   new Promise((_, reject) =>
    //     setTimeout(() => reject(new Error('WriteTimeout')), timeout)
    //   )
    // ]);
    return new Promise((resolve, reject) => {
      let finished = false;

      console.log(timeout)
      const timer = setTimeout(() => {
        if (finished) return;
        finished = true;
        reject(new Error('WriteTimeout'));
      }, timeout);

      // ⚠️ 不 await 它
      characteristic.writeValue(buffer)
        .then(() => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          resolve();
        })
        .catch(err => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  const handleBluetoothConnect = async () => {
    if(getCurrent()=='ICBricks'){
         try {
          let device
          if(filterMode=='filter'){
            device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['108f94d5-570b-4a6c-9a47-12f428f362e6'] }],
                optionalServices: ['108f94d5-570b-4a6c-9a47-12f428f362e6', '4e8d78da-f40e-4983-9cc6-9b888aab1800']
            });
          }else{
            device = await navigator.bluetooth.requestDevice({
                acceptAllDevices:true,
                optionalServices: ['108f94d5-570b-4a6c-9a47-12f428f362e6', '4e8d78da-f40e-4983-9cc6-9b888aab1800']
            });
          }
            
            
            // 写入全局 device
            window.__bluetoothDevice = device;

            const server = await device.gatt.connect();
            setBluetoothServer(server);
            window.__bluetoothServer = server;
            try{
              const service = await server.getPrimaryService('108f94d5-570b-4a6c-9a47-12f428f362e6');
              const serviceDown = await server.getPrimaryService('4e8d78da-f40e-4983-9cc6-9b888aab1800');
              const characteristicWrite = await service.getCharacteristic('20bc2441-0aed-48d0-81bd-68f28d02c2a6');
              const characteristicRead = await service.getCharacteristic('407ccc3a-7ed4-42fc-b66f-899d82e1a695');
              const characteristicWriteDown = await serviceDown.getCharacteristic('1551bbe8-2765-11ee-be56-0242ac120002');
              const characteristicReadDown = await serviceDown.getCharacteristic('1551bbe8-2765-11ee-be56-0242ac120002');

              // 同步到组件 state 与全局
              setBluetoothCharacteristicWrite(characteristicWrite);
              setBluetoothCharacteristicRead(characteristicRead);
              setBluetoothCharacteristicWrite2nd(characteristicWriteDown);
              setBluetoothCharacteristicRead2nd(characteristicReadDown);

              window.__bluetoothCharacteristicWrite = characteristicWrite;
              window.__bluetoothCharacteristicRead = characteristicRead;
              window.__bluetoothCharacteristicWrite2nd = characteristicWriteDown;
              window.__bluetoothCharacteristicRead2nd = characteristicReadDown;

              device.addEventListener("gattserverdisconnected", onBluetoothDisconnect);

              // handleConnectData({ type: "isOpenBluetooth", data: { message: true } });

              // 启动监听
              await characteristicRead.startNotifications()
              await characteristicReadDown.startNotifications()
              characteristicRead.addEventListener("characteristicvaluechanged", (event) => {
                  console.log('-------------------------')
                  console.log(event.target.value);
                  distance=[]
                  if(event.target.value.getUint8(1)==41){
                    distance.push(event.target.value.getUint8(0))
                    distance.push(event.target.value.getUint8(1))
                    distance.push(event.target.value.getUint8(2))
                    distance.push(event.target.value.getUint8(3))
                    // sensorState[0].push(distance)
                    updateSensorState(0, distance)
                  }else if(event.target.value.getUint8(1)==104){
                    distance.push(event.target.value.getUint8(0))
                    distance.push(event.target.value.getUint8(1))
                    distance.push(event.target.value.getUint8(2))
                    distance.push(event.target.value.getUint8(3))
                    distance.push(event.target.value.getUint8(5))
                    // sensorState[1].push(distance)
                    updateSensorState(1, distance)
                  }else if(event.target.value.getUint8(0)==127){
                    console.log(event.target.value.getUint8(2))
                    distance.push(event.target.value.getUint8(0))
                    distance.push(event.target.value.getUint8(1))
                    distance.push(event.target.value.getUint8(2))
                    // sensorState[2].push(distance)
                    updateSensorState(2, distance)
                  }else if(event.target.value.getUint8(1)==72){
                    distance.push(event.target.value.getUint8(0))
                    distance.push(event.target.value.getUint8(1))
                    distance.push(event.target.value.getUint8(2))
                    // sensorState[3].push(distance)
                    updateSensorState(3, distance)
                  }else if(event.target.value.getUint8(1)==57){
                    distance.push(event.target.value.getUint8(0))
                    distance.push(event.target.value.getUint8(1))
                    distance.push(event.target.value.getUint8(2))
                    // sensorState[4].push(distance)
                    updateSensorState(4, distance)
                  }else if(event.target.value.getUint8(1)==54){
                    distance.push(event.target.value.getUint8(0))
                    distance.push(event.target.value.getUint8(1))
                    distance.push(event.target.value.getUint8(2))
                    distance.push(event.target.value.getUint8(3))
                    distance.push(event.target.value.getUint8(4))
                    distance.push(event.target.value.getUint8(5))
                    // sensorState[5].push(distance)
                    updateSensorState(5, distance)
                  }else if(event.target.value.getUint8(1)==103){
                    console.log(event.target.value)
                    const result = (event.target.value.getUint8(3) << 8) | event.target.value.getUint8(4);
                    distance.push(event.target.value.getUint8(0))
                    distance.push(event.target.value.getUint8(1))
                    distance.push(result)
                    distance.push(event.target.value.getUint8(5))
                    // sensorState[6].push(distance)
                    updateSensorState(6, distance)
                    console.log('222222222222222222')
                    console.log(distance)
                    
                  }else if(event.target.value.getUint8(1)==64){
                    distance.push(event.target.value.getUint8(0))
                    distance.push(event.target.value.getUint8(1))
                    distance.push(event.target.value.getUint8(2))
                    distance.push(event.target.value.getUint8(3))
                    distance.push(event.target.value.getUint8(4))
                    // sensorState[7].push(distance)
                    updateSensorState(7, distance)
                  }else{
                    distance.push(event.target.value.getUint8(0))
                    distance.push(event.target.value.getUint8(1))
                    distance.push(event.target.value.getUint8(2))
                    distance.push(event.target.value.getUint8(3))
                    distance.push(event.target.value.getUint8(4))
                    distance.push(event.target.value.getUint8(5))
                    for(let i=0;i<window.__bluetoothSensorState.length;i++){
                      for(let j=window.__bluetoothSensorState[i].length-1;j>=0;j--){
                        if(window.__bluetoothSensorState[i][j][0]==event.target.value.getUint8(0)){
                          window.__bluetoothSensorState[i].splice(j,1)
                        }
                      }
                    }
                  }
                  
                  // console.log(distance);
                  console.log(window.__bluetoothSensorState)

                  // 把解析的数据通过全局方法或回调传出（如果有）
                  if (typeof window.__onBluetoothConnectData === "function") {
                    window.__onBluetoothConnectData({ type: "bluetoothData", data: { message: window.__bluetoothSensorState } });
                  }
                  // window.bleAPI.sendDistance(sensorState)
              });

              characteristicReadDown.addEventListener('characteristicvaluechanged', (event)=>{
                  // console.log('有返回');
                  
                  console.log(event.target.value);

                  if(event.target.value.getUint8(0)==8 && event.target.value.getUint8(1)==254){
                      console.log('11111')
                      window.__onBluetoothConnectData({ type: "codeIsRun", data: { message: false } })
                      // bleAPI.sendCodeProsser(false)
                  }else if(event.target.value.getUint8(0)==7 && event.target.value.getUint8(1)==4){
                      console.log('2222')
                      window.__onBluetoothConnectData({ type: "codeIsRun", data: { message: true } })
                      // bleAPI.sendCodeProsser(true)
                  }
                  
              })
              
              // 写入全局 RSSI 初始值（浏览器没有真实 RSSI，这里模拟）
              let simulatedRssi = -50;
              setRssi(Math.round(simulatedRssi));
              window.__bluetoothRssi = Math.round(simulatedRssi);

              const uint8Array = new Uint8Array([5]);
              await characteristicWriteDown.writeValue(uint8Array.buffer)

              // 模拟 RSSI（浏览器 Web Bluetooth 不直接提供 RSSI）
              const interval = setInterval(() => {
                  if (!device.gatt.connected) {
                    clearInterval(interval);
                    return;
                  }
                  simulatedRssi = simulatedRssi + (Math.random() * 10 - 5);
                  simulatedRssi = Math.max(-90, Math.min(-30, simulatedRssi));
                  setRssi(Math.round(simulatedRssi));
                  window.__bluetoothRssi = Math.round(simulatedRssi);
              }, 1500);

              // 确保全局中 sensorState 存在（连接成功后可继续使用）
              if (!window.__bluetoothSensorState) window.__bluetoothSensorState = [[], [], [], [], [], [], [], [], []];

              setBluetoothDevice(device);
              // 通知上层连接已打开
              handleConnectData({ type: "isOpenBluetooth", data: { message: true } });

              console.log("✅ 蓝牙设备已连接:", device.name);
            }catch(err){
               if(String(err).includes('NetworkError')){
                  showToast(formatMessage({
                    id: 'gui.connect.bleCatchRecon',
                    default: 'Bluetooth connection error. Please restart Bluetooth settings and reconnect.',
                    description: 'gui.connect.bleCatchRecon'
                  }))

                  handleBluetoothDisconnect()
                  // deviceRobot=null
                }else{
                  showToast(formatMessage({
                    id: 'gui.connect.bleCatchfailedDevice',
                    default: 'Bluetooth connection error.',
                    description: 'gui.connect.bleCatchfailedDevice'
                  }))
                  handleBluetoothDisconnect()
                }
            }

            
        } catch (err) {
          showToast(formatMessage({
            id: 'gui.connect.bleCatchfailedDevice',
            default: 'Bluetooth connection error.',
            description: 'gui.connect.bleCatchfailedDevice'
          }))
          handleBluetoothDisconnect()
            console.error("蓝牙连接失败:", err);
            
        }
    }else if(getCurrent()=='ICRobot'){
      try{
        if(window.__serialPort){
          handleDisconnect()
        }
         let deviceRobot
        if(filterMode=='filter'){
          deviceRobot = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['0000fff0-0000-1000-8000-00805f9b34fb'] }],
            optionalServices: ['00001800-0000-1000-8000-00805f9b34fb', '0000fff0-0000-1000-8000-00805f9b34fb'],
          }).catch(e=>{
            console.log(e);
            
          })
        }else{
          deviceRobot = await navigator.bluetooth.requestDevice({
            // filters: [{ services: ['0000fff0-0000-1000-8000-00805f9b34fb'] }],
            optionalServices: ['00001800-0000-1000-8000-00805f9b34fb', '0000fff0-0000-1000-8000-00805f9b34fb'],
            acceptAllDevices:true
          }).catch(e=>{
            console.log(e);
            
          })
        }
        

        
        // 写入全局 device
        window.__bluetoothDevice = deviceRobot;
        let serverRobot;
        // serverRobot = await deviceRobot.gatt.connect();
        if (!deviceRobot.gatt.connected) {
          serverRobot = await deviceRobot.gatt.connect();
        }

        
        setBluetoothServer(serverRobot);
        window.__bluetoothServer = serverRobot;
        

        
        //1551BBE8-2765-11EE-BE56-0242AC120002
        //1551bbe8-2765-11ee-be56-0242ac120002
        console.log(serverRobot)
        console.log(serverRobot.connected)
        try{
          console.log(serverRobot.connected)
          let serviceRobot = await serverRobot.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
          console.log('-------------------')

          let characteristicWriteRobot
          let characteristicWriteStopRobot
          try{
            characteristicWriteRobot = await serviceRobot.getCharacteristic('0000fff4-0000-1000-8000-00805f9b34fb');
          }catch(e){
            characteristicWriteRobot = await serviceRobot.getCharacteristic('0000fff1-0000-1000-8000-00805f9b34fb');
          }

          try{
            characteristicWriteStopRobot=await serviceRobot.getCharacteristic('0000fff5-0000-1000-8000-00805f9b34fb');
          }catch(e){
            console.log(e)
          }
          // let characteristicWriteRobot = await serviceRobot.getCharacteristic('0000fff1-0000-1000-8000-00805f9b34fb');
          let characteristicReadRobot = await serviceRobot.getCharacteristic('0000fff2-0000-1000-8000-00805f9b34fb');
          let characteristicReadSensorRobot=await serviceRobot.getCharacteristic('0000fff3-0000-1000-8000-00805f9b34fb');


          // 同步到组件 state 与全局
          setBluetoothCharacteristicWrite(characteristicWriteRobot);
          setBluetoothCharacteristicWrite2nd(characteristicWriteStopRobot)
          setBluetoothCharacteristicRead(characteristicReadRobot);
          setBluetoothCharacteristicRead2nd(characteristicReadSensorRobot);

          window.__bluetoothCharacteristicWrite = characteristicWriteRobot;
          window.__bluetoothCharacteristicWrite2nd=characteristicWriteStopRobot
          window.__bluetoothCharacteristicRead = characteristicReadRobot;
          window.__bluetoothCharacteristicRead2nd = characteristicReadSensorRobot;

          deviceRobot.addEventListener('gattserverdisconnected', onBluetoothDisconnect);
          await characteristicReadRobot.startNotifications()
          await characteristicReadSensorRobot.startNotifications()

          characteristicReadRobot.addEventListener('characteristicvaluechanged',globalEventListener)
          
          characteristicReadSensorRobot.addEventListener('characteristicvaluechanged',(event)=>{
            let value = event.target.value;
            let sensor = new Uint8Array(value.buffer);

            // 把字节数组转成字符串
            let jsonStr = new TextDecoder("utf-8").decode(sensor);
            // console.log(" 收到 JSON 字符串:", jsonStr);

            let sensorArray = [];
            try {
              // 解析 JSON
              sensorArray = JSON.parse(jsonStr);
              // console.log("解析后的数组:", sensorArray);
            } catch (e) {
              console.error("JSON 解析失败:", e);
            }
            // console.log(sensorArray)
            // window.bleAPI.sendRobotSenor({
            //   type:'senor',
            //   data:sensorArray
            // })
            if(!getVersion().icrobot && JSON.parse(sensorArray)[30]){
              setVersion(['icrobot',parseVersion(JSON.parse(sensorArray)[30])])
            }
            handleConnectData({
              type:'robotSensor',
              data:sensorArray
            })
          })

          
          // console.log(window.bleAPI.getCurrentMode())
          // 转成 Uint8Array
          let raw;
          if(!getShowCodeDb()){
            raw = new Uint8Array([0xcc,0x01]);
          }else{
            raw = new Uint8Array([0xcc,0x02]);
          }

          // 计算 CRC16
          let crc = crc16(raw);

          // 新建数组，长度 = 原始数据 + 2
          let packet = new Uint8Array(raw.length + 2);
          packet.set(raw, 0);
          packet[raw.length] = (crc >> 8) & 0xFF;  // 高字节
          packet[raw.length + 1] = crc & 0xFF;     // 低字节
          console.log(packet)

          // await characteristicWriteRobot.writeValue(packet.buffer)
          await writeWithTimeout(characteristicWriteRobot, packet.buffer, 3000);

          setBluetoothDevice(deviceRobot);
          handleConnectData({ type: "isOpenBluetooth", data: { message: true } });
          console.log(deviceRobot.name)

        }catch(err){
          console.log(err)

          if (String(err).includes('WriteTimeout')) {
            showToast(formatMessage({
              id: 'gui.connect.bleCatchfailedDevice',
              default: 'Bluetooth connection error.',
              description: 'gui.connect.bleCatchfailedDevice'
            }));

            handleBluetoothDisconnect();
          }

          if(String(err).includes('NetworkError')){
            showToast(formatMessage({
              id: 'gui.connect.bleCatchRecon',
              default: 'Bluetooth connection error. Please restart Bluetooth settings and reconnect.',
              description: 'gui.connect.bleCatchRecon'
            }))

            handleBluetoothDisconnect()
            // deviceRobot=null
          }

          if(String(err).includes('NotFoundError')){
            showToast(formatMessage({
              id: 'gui.connect.bleCatchfailedDevice',
              default: 'Bluetooth connection error.',
              description: 'gui.connect.bleCatchfailedDevice'
            }))

            handleBluetoothDisconnect()
            // deviceRobot=null
          }
          // await new Promise(resolve => setTimeout(resolve, 1000))
          // handleBluetoothDisconnect()
        }
      }catch(e){
        showToast(formatMessage({
          id: 'gui.connect.bleCatchfailedDevice',
          default: 'Bluetooth connection error.',
          description: 'gui.connect.bleCatchfailedDevice'
        }))
        handleBluetoothDisconnect()
      }
       
    }
   
  };

  let responseQueue = []; // 等待响应的队列
  window.__responseQueue=responseQueue
  // 全局监听器
  function globalEventListener(event) {
    const value = event.target.value;
    const arr = new Uint8Array(value.buffer);
    // console.log("收到数据:", arr);

    const state1 = arr[0]; // 第一个字节（硬件返回）

    // 新增：无论是否队列匹配，都把 state 发出去
    // if (window.bleAPI && typeof window.bleAPI.sendRobotSenor === "function") {
    //   // console.log('发送了')
    //   window.bleAPI.sendRobotSenor({
    //     type: "state",
    //     data: state1
    //   });

    // }
    handleConnectData({
       type: "robotState",
        data: state1
    })

    // 如果队列里有等待的 promise，取出处理
    if (window.__responseQueue.length > 0) {
      const { resolve, reject } = window.__responseQueue.shift();
      const state = arr[0]; // 第一个字节
      console.log(state)

      if (state === 0x00) {  // 48 十进制
        resolve(true);
      } else {
        reject(new Error(`收到错误状态码: ${state}`));
      }
    } else {
      // console.warn("⚠️ 收到未匹配的响应:", arr);
    }
  }

  function crc16(arr) {
    // let crc = 0xFFFF; // 初始值
    // for (let i = 0; i < arr.length; i++) {
    //   crc ^= (arr[i] << 8);
    //   for (let j = 0; j < 8; j++) {
    //     if (crc & 0x8000) {
    //       crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
    //     } else {
    //       crc = (crc << 1) & 0xFFFF;
    //     }
    //   }
    // }
    // return crc;
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

  function stringToBinary(str) {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(str);
    return uint8Array;
  }

  const handleBluetoothDisconnect = async () => {
    setVersion(['icrobot',''])
    try {
      console.log(window.__bluetoothDevice?.gatt.connected)
      if (window.__bluetoothDevice?.gatt.connected) window.__bluetoothDevice.gatt.disconnect();
      setBluetoothDevice(null);
      setBluetoothServer(null);
      setBluetoothCharacteristicRead(null);
      setBluetoothCharacteristicWrite(null);
      setBluetoothCharacteristicRead2nd(null);
      setBluetoothCharacteristicWrite2nd(null);
      setRssi(null);

      // ✅ 清理全局
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
    } catch (err) {
      console.error("断开蓝牙失败:", err);
    }
  };

  const onBluetoothDisconnect = (event) => {

    console.log('*****')
    const device = event.target;
    device.removeEventListener(
      "gattserverdisconnected",
      onBluetoothDisconnect
    );
    // 全局清理并通知
    window.__onBluetoothDisconnected();
    
    setBluetoothDevice(null);
    setBluetoothServer(null);
    setBluetoothCharacteristicRead(null);
    setBluetoothCharacteristicWrite(null);
    setBluetoothCharacteristicRead2nd(null);
    setBluetoothCharacteristicWrite2nd(null);
    setRssi(null);

    
    
  };

  /**
   * wifi连接
   */
  const handleConnectWifi=()=>{
    handleConnectData({
      type: "wifiIp",
      data: { message: '192.168.4.1' },
    });
  }

  /**
   * sta模式
   */

  const [ssid, setSsid] = useState(""); // 用于存储热点名称
  const [password, setPassword] = useState(""); // 用于存储密码
  const [qrCodeValue, setQrCodeValue] = useState(""); // 用于存储生成的二维码内容

  let ipTimer
  const handleGenerateQRCode = () => {
    if (ssid && password) {
      // 格式化 Wi-Fi 连接字符串：WIFI:T:<encryption>;S:<SSID>;P:<password>;;
      const wifiString = `WIFI:T:WPA;S:${ssid};P:${password};;`;
      setQrCodeValue(wifiString); // 更新二维码内容

      ipTimer = setInterval(()=>{
        startScan()
      },5000)
    } else {
      alert("请输入有效的热点名称和密码！");
    }
  };

  //扫描设备ip
  const [esp32Ip, setEsp32Ip] = useState(null);
  const [scanning, setScanning] = useState(false);

  const baseIp = "192.168.137."; // 假设你的热点 IP 段
  const socketPort = 8082; // ESP32 运行 WebSocket 的端口
  const TimeOut = 500; // 超时时间（毫秒）

  let isScanning = false;

  const checkIp = (ip) => {
    return new Promise((resolve) => {
      const socket = new WebSocket(`ws://${ip}:${socketPort}`);

      socket.onopen = () => {
        console.log(`找到 ESP32: ${ip}`);
        socket.close();
        resolve(ip);
      };

      socket.onerror = () => {
        resolve(null);
      };

      socket.onclose = () => {
        resolve(null);
      };
    });
  };

  // 开始扫描网络
  const startScan = async () => {
    setScanning(true);
    let foundIp = null;

    for (let i = 2; i < 255; i++) {
      const ip = `${baseIp}${i}`;
      const result = await checkIp(ip);

      if (result) {
        foundIp = result;
        clearInterval(ipTimer)
        break; // 找到后跳出循环
      }

      if (isScanning) {
        await new Promise((res) => setTimeout(res, 50)); // 节流
      }
    }

    setScanning(false);
    if (foundIp) {
      setEsp32Ip(foundIp);
    } else {
      setEsp32Ip(null);
    }
  };



  let filter=formatMessage({
              id: 'gui.connect.filter',
              default: 'Filter Devices',
              description: 'gui.connect.filter'
            })
  let noFilter=formatMessage({
              id: 'gui.connect.noFilter',
              default: 'Show All Devices',
              description: 'gui.connect.noFilter'
            })


  const deviceType = getCurrent(); 

  useEffect(() => {
    if (isTabDisabled(activeTab)) {
      const fallbackTab =
        deviceType === 'ICBricks' ? 'bluetooth' : 'serial';
      setActiveTab(fallbackTab);
    }
  }, [deviceType, activeTab]);
  /**
   * 用于判断选择的那个设备来显示不同的连接方式
   * @param {连接方式} key 
   * @returns 
   */
  const isTabDisabled = (key) => {
    if (deviceType === 'ICBricks') {
      return key === 'serial';
    }
    if (deviceType === 'Microbit') {
      return key === 'bluetooth';
    }
    return false; // ICRobot：都可用
  };
  return (
    <div className={styles.overlay}>
      <div className={styles.connectContainer}>
        <div className={styles.headerRow}>
          <button className={styles.closeButton} onClick={onRequestClose}>
            ✕
          </button>
        </div>

        <div className={styles.tabBar}>
          {/* {["serial", "bluetooth", "wifi", "qr"].map((key) => (
            <div
              key={key}
              className={`${styles.tab} ${
                activeTab === key ? styles.active : ""
              }`}
              onClick={() => setActiveTab(key)}
            >
              {key === "serial"
                ? formatMessage({
                      id: 'gui.connect.serialName',
                      default: 'serial',
                      description: 'gui.connect.serialName'
                  })
                : key === "bluetooth"
                ? formatMessage({
                      id: 'gui.connect.bleName',
                      default: 'Bluetooth',
                      description: 'gui.connect.bleName'
                  })
                : key === "wifi"
                ? "WiFi"
                : formatMessage({
                      id: 'gui.connect.qrName',
                      default: 'qrCode',
                      description: 'gui.connect.qrName'
                  })
                }
            </div>
          ))} */}
          {/* {["serial", "bluetooth"].map((key) => (
            <div
              key={key}
              className={`${styles.tab} ${
                activeTab === key ? styles.active : ""
              }`}
              onClick={() => setActiveTab(key)}
            >
              {
                {
                  serial: formatMessage({
                    id: 'gui.connect.serialName',
                    default: 'Serial',
                    description: 'gui.connect.serialName'
                  }),
                  bluetooth: formatMessage({
                    id: 'gui.connect.bleName',
                    default: 'Bluetooth',
                    description: 'gui.connect.bleName'
                  }),
                  sta: formatMessage({
                    id: 'gui.connect.staName',
                    default: 'STA',
                    description: 'gui.connect.staName'
                  })
                }[key]
              }
            </div>
          ))} */}

          {["serial", "bluetooth"].map((key) => {
            const disabled = isTabDisabled(key);

            return (
              <div
                key={key}
                className={`${styles.tab}
                  ${activeTab === key ? styles.active : ""}
                  ${disabled ? styles.disabledTab : ""}
                `}
                onClick={() => {
                  if (disabled) return;
                  setActiveTab(key);
                }}
              >
                {{
                  serial: formatMessage({
                    id: 'gui.connect.serialName',
                    default: 'Serial',
                    description: 'gui.connect.serialName'
                  }),
                  bluetooth: formatMessage({
                    id: 'gui.connect.bleName',
                    default: 'Bluetooth',
                    description: 'gui.connect.bleName'
                  })
                }[key]}
              </div>
            );
          })}
        </div>

        <div className={styles.content}>
          {/* 串口 */}
          {activeTab === "serial" && (
            <div className={styles.serialPanel}>
              <div className={styles.serialCard}>
                <div className={styles.serialStatus}>
                  <div
                    className={`${styles.statusDot} ${
                      port ? styles.connected : styles.disconnected
                    }`}
                  ></div>
                  <span className={styles.deviceText}>
                    {portInfo
                      ? `device | VID: ${portInfo.usbVendorId || "unknown"} | PID: ${
                          portInfo.usbProductId || "unknown"
                        }`
                      : formatMessage({
                                id: 'gui.connect.noDevice',
                                default: 'no device',
                                description: 'gui.connect.noDevice'
                            })}
                  </span>
                </div>

                <div className={styles.serialButtons}>
                  <button
                    className={`${styles.serialBtn} ${styles.scanBtn}`}
                    onClick={handleScanAndConnect}
                    disabled={!!port}
                  >
                    {port ? formatMessage({
                                id: 'gui.connect.shouquan',
                                default: 'Authorized',
                                description: 'gui.connect.shouquan'
                            }) : formatMessage({
                                    id: 'gui.connect.scan',
                                    default: 'scan device',
                                    description: 'gui.connect.scan'
                                }) }
                  </button>

                  <button
                    className={`${styles.serialBtn} ${styles.disconnectBtn}`}
                    onClick={handleDisconnect}
                    disabled={!port}
                  >
                     <FormattedMessage
                        defaultMessage="disconnect"
                        description="disconnect"
                        id="gui.connect.disconnect"
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🔵 蓝牙 */}
          {activeTab === "bluetooth" && (
            <div className={styles.serialPanel}>
              <div className={`${styles.serialCard} ${styles.bluetoothCard}`}>
                <div className={styles.serialStatus}>
                  <div
                    className={`${styles.statusDot} ${
                      bluetoothDevice ? styles.connectedBluetooth : styles.disconnected
                    }`}
                  ></div>
                  <span className={styles.deviceText}>
                    {bluetoothDevice
                      ? `device: ${bluetoothDevice.name || "unknown"}`
                      : formatMessage({
                                id: 'gui.connect.noDevice',
                                default: 'no device',
                                description: 'gui.connect.noDevice'
                            })}
                  </span>
                </div>

                <div className={styles.filterSelectWrapper}>
                  <select
                    className={styles.filterSelect}
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                  >
                    <option value="filter">
                      {filter}
                    </option>

                    <option value="no-filter">
                      {noFilter}
                    </option>
                  </select>
                </div>

                <div className={styles.serialButtons}>
                  <button
                    className={`${styles.serialBtn} ${styles.scanBtnBluetooth}`}
                    onClick={handleBluetoothConnect}
                    disabled={!!bluetoothDevice}
                  >
                    {bluetoothDevice ? formatMessage({
                                id: 'gui.connect.shouquan',
                                default: 'Authorized',
                                description: 'gui.connect.shouquan'
                            }) : formatMessage({
                              id: 'gui.connect.scan',
                              default: 'scan device',
                              description: 'gui.connect.scan'
                          })}
                  </button>

                  <button
                    className={`${styles.serialBtn} ${styles.disconnectBtn}`}
                    onClick={handleBluetoothDisconnect}
                    disabled={!bluetoothDevice}
                  >
                    <FormattedMessage
                        defaultMessage="disconnect"
                        description="disconnect"
                        id="gui.connect.disconnect"
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* {activeTab === "sta" && (
            <div className={styles.qrPanel}>
              <h2>生成 Wi-Fi 连接二维码</h2>


              <div className={styles.qrInputWrapper}>
                <label htmlFor="ssid">热点名称 (SSID):</label>
                <input
                  id="ssid"
                  type="text"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="请输入热点名称"
                />
              </div>


              <div className={styles.qrInputWrapper}>
                <label htmlFor="password">密码:</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                />
              </div>


              <div className={styles.qrBtnWrapper}>
                <button
                  className={styles.generateBtn}
                  onClick={handleGenerateQRCode}
                  disabled={!(ssid && password)}
                >
                  生成二维码
                </button>
                <button
                  className={styles.clearBtn}
                  onClick={() => {
                    setSsid("");
                    setPassword("");
                    setQrCodeValue("");
                  }}
                >
                  清除
                </button>
              </div>

              {qrCodeValue && (
                <div className={styles.qrCodeWrapper}>
                  <QRCodeSVG value={qrCodeValue} size={256} />
                </div>
              )}
            </div>
          )} */}

        </div>
      </div>
    </div>
  );
};

export default ConnectTabs;



