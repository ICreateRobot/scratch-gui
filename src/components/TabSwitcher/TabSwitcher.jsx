// import React, { useState, useEffect, useRef} from 'react';

// // 串口监视器内容
// const SerialMonitor = ({ serialData }) => {
//     const scrollRef = useRef(null);
  
//     // 每次数据变化后自动滚动到底部
//     useEffect(() => {
//       if (scrollRef.current) {
//         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
//       }
//     }, [serialData]);
  
//       // 💡 统一格式处理：把字符串转为数组
//     const displayData = Array.isArray(serialData)
//     ? serialData
//     : typeof serialData === 'string'
//     ? serialData.split('\n') // 按行切割
//     : [];
//     return (
//       <div style={{}}>
//         {/* <h4>串口监视器</h4> */}
//         <div
//           ref={scrollRef}
//           style={{
//             backgroundColor: '#000',
//             color: '#0f0',
//             height:'115px',
//             overflowY: 'auto',
//             fontFamily: 'monospace',
//             borderRadius: '5px',
//           }}
//         >
//           {displayData && displayData.length > 0 ? (
//             displayData.map((line, index) => (
//               <div key={index}>{line}</div>
//             ))
//           ) : (
//             <div style={{ color: '#666' }}>暂无串口数据</div>
//           )}
//         </div>
//       </div>
//     );
//   };

// // 程序下载界面
// const ProgramDownload = () => {
//   return (
//     <div style={{ padding: '10px' }}>
//       <div style={{ marginBottom: '10px' }}>
//         <label>程序名称：</label>
//         <input type="text" defaultValue="baoweijiayuan" />
//       </div>
//       <div style={{ marginBottom: '10px' }}>
//         <label>程序存储位置：</label>
//         <select>
//           <option value="P1">P1</option>
//           <option value="P2">P2</option>
//           <option value="P3">P3</option>
//         </select>
//       </div>
//       <button style={{ marginRight: '10px' }}>下载程序</button>
//       <button>下载并运行</button>
//     </div>
//   );
// };

// // 主组件：切换 Tabs
// const TabSwitcher = ({ serialData }) => {
//   const [activeTab, setActiveTab] = useState('download');

//   return (
//     <div style={{ width: '100%', height:'40vh',background: '#98F5FF', padding: '1px', borderRadius: '8px' }}>
//       {/* Tabs */}
//       <div style={{ display: 'flex', marginBottom: '1px' }}>
//         <div
//           onClick={() => setActiveTab('download')}
//           style={{
//             padding: '10px 20px',
//             backgroundColor: activeTab === 'download' ? '#00F5FF' : '#AEEEEE',
//             cursor: 'pointer',
//             borderTopLeftRadius: '8px',  
//             borderTopRightRadius: '8px',
//             fontWeight: 'bold',
//           }}
//         >
//           程序下载
//         </div>
//         <div
//           onClick={() => setActiveTab('monitor')}
//           style={{
//             padding: '10px 20px',
//             backgroundColor: activeTab === 'monitor' ? '#00F5FF' : '#AEEEEE',
//             cursor: 'pointer',
//             borderTopLeftRadius: '8px',
//             borderTopRightRadius: '8px',
//             fontWeight: 'bold',
//           }}
//         >
//           串口监视器
//         </div>
//       </div>

//       {/* Tab 内容区域 */}
//       <div style={{ backgroundColor: '#eee', padding: '20px', borderRadius: '0 0 8px 8px' }}>
//         {activeTab === 'download' ? <ProgramDownload /> : <SerialMonitor serialData={serialData} />}
//       </div>
//     </div>
//   );
// };

// export default TabSwitcher;



import {FormattedMessage} from 'react-intl';


import React, { useState, useRef, useEffect, useCallback  } from 'react';
import bot1 from './1.svg'
import bot2 from './2.svg'
import bot3 from './3.svg'
import bot4 from './4.svg'
import bot5 from './5.svg'
import down from './down.svg'
import downRun from './downRun.svg'

import lineSenor from './lineSenor.svg'


import bn1 from './button1.svg'
import bn2 from './button2.svg'
import bn3 from './button3.svg'
import bn4 from './button4.svg'
import bn5 from './button5.svg'


import bricksPlace from './bricksPlace.svg'

import microbitPlace from './microbit.svg'


// import mainCon from './conn_main_con.svg'
import connMotor from './conn_motor.svg'
import connSound from './conn_sound.svg'
import connTilt from './conn_tilt.svg'
import consoleDistance from './console_distance.svg'
import consoleEncoder from './console_encoder.svg'
import consoleGesture from './console_gesture.svg'
import consoleMotor from './console_motor.svg'
import consoleLed from './conn_led.svg'

import codeModule from '../../../../../utils/global.js'

import runStop from './run_stop.svg'

import { setLongIsDown,getLongIsDown } from 'scratch-gui/src/components/utils/utils.js';

// 串口监视器
// 串口监视器组件
const SerialMonitor = ({ serialData }) => {
  const scrollRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [baudRate, setBaudRate] = useState('115200');
  const [appendNewline, setAppendNewline] = useState(true);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [serialData]);

  const handleSend = () => {
    if (inputValue.trim()) {
      // 这里可以添加发送数据的逻辑
      console.log('发送数据:', inputValue);
      setInputValue('');
    }
  };

  const handleClear = () => {
    // 这里可以添加清除数据的逻辑
    console.log('清除数据');
  };

  const displayData = Array.isArray(serialData)
    ? serialData
    : typeof serialData === 'string'
    ? serialData.split('\n')
    : [];

  return (
    <div style={{ padding: '10px' }}>
      {/* 输入控制行 */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '10px',
        alignItems: 'center'
      }}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Input"
          style={{
            flex: 1,
            border: '1px solid #00ced1',
            borderRadius: '4px',
            padding: '6px 12px',
            backgroundColor: '#f0ffff',
            width:'20%'
          }}
        />
        <button 
          onClick={handleSend}
          style={{
            padding: '6px 12px',
            backgroundColor: '#00ced1',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
             <FormattedMessage
                defaultMessage="发送"
                description="Button in menu bar under settings to open desktop app settings"
                id="sendMonitior"
            />
          </button>
        <button 
          onClick={handleClear}
          style={{
            padding: '6px 12px',
            backgroundColor: '#ff6666',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            <FormattedMessage
                defaultMessage="清除"
                description="Button in menu bar under settings to open desktop app settings"
                id="clearMonitior"
            />
          </button>
        <select 
          value={baudRate}
          onChange={(e) => setBaudRate(e.target.value)}
          style={{
            border: '1px solid #00ced1',
            borderRadius: '4px',
            padding: '6px',
            backgroundColor: '#f0ffff'
          }}>
          <option value="9600">9600</option>
          <option value="115200">115200</option>
          <option value="230400">230400</option>
          <option value="460800">460800</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input 
            type="checkbox" 
            id="enterCheck" 
            checked={appendNewline}
            onChange={(e) => setAppendNewline(e.target.checked)}
            style={{ marginRight: '4px' }}/>
          <label htmlFor="enterCheck" style={{ fontSize: '14px' }}>
            <FormattedMessage
                defaultMessage="回车"
                description="Button in menu bar under settings to open desktop app settings"
                id="gui.enter"
            />
          </label>
        </div>
      </div>

      {/* 数据展示区域 */}
      <div
        ref={scrollRef}
        style={{
          backgroundColor: '#e0f8e8', // 浅绿色背景
          color: '#000',
          height: '16vh',
          overflowY: 'auto',
          fontFamily: 'monospace',
          borderRadius: '5px',
          padding: '8px',
          border: '1px solid #00ced1'
        }}
      >
        {displayData.length > 0 ? (
          displayData.map((line, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              alignItems: 'center',
              margin: '4px 0',
              flexWrap: 'wrap',         // ✅ 允许内容换行
              wordBreak: 'break-all'    // ✅ 长文本断字换行
            }}>
              <span style={{ 
                color: '#800080', // 紫色箭头
                marginRight: '8px'
              }}>{line.startsWith('>>') ? '>>' : '<<'}</span>
              {line}
            </div>
          ))
        ) : (
          <div style={{ color: '#666' }}>暂无串口数据</div>
        )}
      </div>
    </div>
  );
};
// 程序下载页面（包含机器人图和切换）
const ProgramDownload = ({onSendData,extension }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDown, setIsDown] = useState(getLongIsDown());
  useEffect(() => {
    // console.log('下载界面初始化了一次')
    // console.log(isDown)
    // console.log(getLongIsDown())
    // setIsDown(getLongIsDown())
      const channelBleIsDown = new BroadcastChannel('ble-download')

      const handleMessage = (event) => {
        if(event.data){
          // console.log('收到了下载返回')
          setLongIsDown(true)
          setIsDown(true)
          // console.log(isDown)
          // console.log(getLongIsDown())
          
        }
      };

      channelBleIsDown.addEventListener('message', handleMessage);

      return () => {
        // 清理监听器，防止重复注册
        channelBleIsDown.removeEventListener('message', handleMessage);
        channelBleIsDown.close();
      };
    }, []);
  if(extension=='2'){
    const images = [
        bot1, // 替换成你的图片路径
        bot2,
        bot3,
        bot4,
        bot5,
      ];
      

      const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      };

      const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      };
      const postDataToParent = () =>{
        onSendData(currentIndex)
      }

      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative',width:'100%',height:'100%' }}>
          {/* 左箭头 */}
          <div
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '50px',
              fontSize: '36px',
              color: '#00CED1',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            &#8592;
          </div>

          {/* 中间机器人图 */}
          <img
            src={images[currentIndex]}
            alt="机器人图"
            draggable={false}
            style={{
              width: '170px',
              height: '150px',
              objectFit: 'contain',
              position:'absolute',
              left:'135px'
            }}
          />

          {/* 右箭头 */}
          <div
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '80px',
              fontSize: '36px',
              color: '#00CED1',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            &#8594;
          </div>

          {/* 下载 & 运行按钮 */}
          <div
            style={{
              position: 'absolute',
              right: '0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor:'#c9ffef',
              height:'100%',
              width:'70px'
            }}
          >
            <button
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                // backgroundColor: '#B0E0E6',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                background:'transparent'
              }}
              onClick={postDataToParent}
            >
              <img draggable={false} src={down}></img>
            </button>
            {/* <button
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                // backgroundColor: '#00F5FF',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                background:'transparent'
              }}
            >
              <img src={downRun}></img>
            </button> */}
          </div>
        </div>
      );
  }else if(extension == '1'){


      

      const postDataToParent = () =>{
        // console.log(isDown)
        if(isDown){
          setLongIsDown(false)
          setIsDown(false)
          onSendData(-2)

        }else{
          // setIsDown(!isDown)
          onSendData(-1)
        }
        
      }


     

     return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative',width:'100%',height:'100%'
      }}>
        <img draggable={false} style={{height:'150px',position:'relative',top:'10px',right:'30px'}} src={bricksPlace}></img>

         {/* 下载 & 运行按钮 */}
          <div
            style={{
              position: 'absolute',
              right: '0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor:'#c9ffef',
              height:'100%',
              width:'70px'
            }}
          >
            {/* <button
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                // backgroundColor: '#B0E0E6',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                background:'transparent'
              }}
              
            >
              <img src={down}></img>
            </button> */}
            <button
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                // backgroundColor: '#00F5FF',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                background:'transparent'
              }}
              onClick={postDataToParent}
            >
              {isDown && <img draggable={false} src={runStop}></img>}
              {!isDown && <img draggable={false} src={downRun}></img>}

              {/* <img src={downRun}></img> */}
            </button>
          </div>
      </div>
    );
  }else if(extension == '3'){
     const postDataToParent = async() =>{
        let import_code='from microbit import *\nfrom ICreate import *\n';
        const result = await window.EditorPreload.downloadCode(import_code+codeModule.getCode());
        console.log(result)
      }
     return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative',width:'100%',height:'100%'
      }}>
        <img draggable={false} style={{height:'150px',position:'relative',top:'8px',right:'30px'}} src={microbitPlace}></img>

         {/* 下载 & 运行按钮 */}
          <div
            style={{
              position: 'absolute',
              right: '0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor:'#c9ffef',
              height:'100%',
              width:'70px'
            }}
          >
            {/* <button
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                // backgroundColor: '#B0E0E6',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                background:'transparent'
              }}
              
            >
              <img src={down}></img>
            </button> */}
            <button
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                // backgroundColor: '#00F5FF',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                background:'transparent'
              }}
              onClick={postDataToParent}
            >
              <img draggable={false} src={down}></img>
            </button>
          </div>
      </div>
    );
  }
  
};


// 控制台内部结构
// const ControlPanelLayout = () => {
//   const [innerTab, setInnerTab] = useState(0);
//    const [dynamicImage, setDynamicImage] = useState(bn1);
//   const tabIcons = ['🔌', '🎮', '📷']; // 可替换为图像


//   // 接收 BroadcastChannel 数据
//   useEffect(() => {
//     const reciveChannel = new BroadcastChannel('reciveChannel');
//     reciveChannel.addEventListener('message', (event) => {
//     //  console.log(event.data)
//       if(event.data[0]==1 && event.data[1]==1){
//         setDynamicImage(bn1); // 动态设置图片 URL
//       }else if(event.data[0]==0 && event.data[1]==1){
//         setDynamicImage(bn2);
//       }else if(event.data[0]==1 && event.data[1]==0){
//         setDynamicImage(bn3);
//       }else if(event.data[0]==0 && event.data[1]==0){
//         setDynamicImage(bn5);
//       }
        
      
//     });

//     // 清理事件监听
//     return () => reciveChannel.close();
//   }, []);
//   const renderTabContent = () => {
//     if (innerTab === 0) {
//       // 接口模块图
//       return (
//         <div style={{ display: 'flex', justifyContent: 'space-around' }}>
//          <img src={lineSenor}></img>
//         </div>
//       );
//     } else if(innerTab === 1) {
//       return (
//         <div style={{
//           height: '100px',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           color: '#777'
//         }}>
//           {dynamicImage && (
//             <img
//               src={dynamicImage}
//               alt="动态图像"
//               style={{ maxHeight: '60px', marginTop: '8px' }}
//             />
//           )}
//         </div>
//       );
//     }
//   };

//   return (
//     <div style={{ display: 'flex', padding: '10px', gap: '10px' }}>
//       {/* 左边：子标签 + 内容 */}
//       <div style={{
//         width: '200px',
//         backgroundColor: '#f0ffff',
//         border: '1px solid #00ced1',
//         borderRadius: '8px',
//         padding: '5px'
//       }}>
//         {/* 子标签按钮 */}
//         <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px' }}>
//           {tabIcons.map((icon, idx) => (
//             <div
//               key={idx}
//               onClick={() => setInnerTab(idx)}
//               style={{
//                 padding: '6px',
//                 cursor: 'pointer',
//                 backgroundColor: innerTab === idx ? '#00ced1' : 'transparent',
//                 borderRadius: '4px',
//                 fontSize: '20px'
//               }}
//             >
//               {icon}
//             </div>
//           ))}
//         </div>

//         <hr style={{ margin: 0, border: 'none', borderTop: '1px solid #ccc' }} />
//         {/* 当前子标签内容 */}
//         <div>{renderTabContent()}</div>
//       </div>

//       {/* 右边：模块格子 */}
//       <div style={{
//         display: 'grid',
//         gridTemplateColumns: 'repeat(2, 1fr)',
//         gap: '8px',
//         flexGrow: 1
//       }}>
//         {[1, 2, 3, 4].map((label,num) => (
//           <div key={num} style={{
//             width: '70px',
//             height: '70px',
//             backgroundColor: num <= 2 ? '#f5f5f5' : '#eaeaea',
//             borderRadius: '8px',
//             border: '1px solid #ccc',
//             display: 'flex',
//             justifyContent: 'center',
//             alignItems: 'center'
//           }}>
//              {/* 顶部标识条 */}
//             <div style={{
//               width: '100%',
//               backgroundColor: ['#FFA07A', '#90EE90', '#87CEFA', '#DDA0DD'][num],
//               textAlign: 'center',
//               // padding: '4px 0',
//               fontWeight: 'bold'
//             }}>
//               {label}
//             </div>

//             {/* 图片展示区域 */}
//             <div style={{
//               flex: 1,
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               padding: '10px'
//             }}>
//               <img
//                 src=''
//                 alt={label}
//                 style={{ maxWidth: '80%', maxHeight: '60px', objectFit: 'contain' }}
//               />
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };


// 节流函数实现
const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return function() {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  }
};

const ControlPanelLayout = ({extension}) => {

  const [innerTab, setInnerTab] = useState(0);
  const [dynamicImage, setDynamicImage] = useState(bn1);
  const [isLoading, setIsLoading] = useState(false);
  const lastUpdateTime = useRef(0);
  const throttleInterval = 200; // 200ms节流间隔
  const tabIcons = [lineSenor, bn1];

  const [realtimeValues, setRealtimeValues] = useState([0, 0, 0, 0, 0]);


  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => setIsLoading(false), 50);
    return () => clearTimeout(timeout);
  }, [innerTab]);
  
  // 使用useRef保存动态图片状态
  const dynamicImageRef = useRef(dynamicImage);
  dynamicImageRef.current = dynamicImage;

  // 处理BroadcastChannel消息的优化函数
  const handleMessage = useCallback(throttle((event) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < throttleInterval) return;
    
    lastUpdateTime.current = now;
    
    const data = event.data;
    // console.log(data)
    setRealtimeValues(data.slice(9))
    let newImage = dynamicImageRef.current;
    
    if (data[0] === 1 && data[1] === 1) {
      newImage = bn1;
    } else if (data[0] === 0 && data[1] === 1) {
      newImage = bn2;
    } else if (data[0] === 1 && data[1] === 0) {
      newImage = bn3;
    } else if (data[0] === 0 && data[1] === 0) {
      newImage = bn5;
    }
    
    // 只有图片真正改变时才更新状态
    if (newImage !== dynamicImageRef.current) {
      setIsLoading(true);
      setDynamicImage(newImage);
      
      // 短暂显示加载状态
      setTimeout(() => setIsLoading(false), 50);
    }
  }, throttleInterval), []);

  // 接收BroadcastChannel数据
  useEffect(() => {
    const reciveChannel = new BroadcastChannel('reciveChannel');
    reciveChannel.addEventListener('message', handleMessage);

    // 清理事件监听
    return () => {
      reciveChannel.removeEventListener('message', handleMessage);
      reciveChannel.close();
    };
  }, [handleMessage]);

  // this.channelSerialData=new BroadcastChannel('serial-data')

  const handleMessagePort = useCallback(throttle((event) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < throttleInterval) return;
    
    lastUpdateTime.current = now;
    
    const data = event.data;
    // console.log(data)
    setRealtimeValues(data.slice(9))
    let newImage = dynamicImageRef.current;
    
    if (data[0] === 1 && data[1] === 1) {
      newImage = bn1;
    } else if (data[0] === 0 && data[1] === 1) {
      newImage = bn2;
    } else if (data[0] === 1 && data[1] === 0) {
      newImage = bn3;
    } else if (data[0] === 0 && data[1] === 0) {
      newImage = bn5;
    }
    
    // 只有图片真正改变时才更新状态
    if (newImage !== dynamicImageRef.current) {
      setIsLoading(true);
      setDynamicImage(newImage);
      
      // 短暂显示加载状态
      setTimeout(() => setIsLoading(false), 50);
    }
  }, throttleInterval), []);

  // 接收BroadcastChannel数据
  useEffect(() => {
    const channelSerialData=new BroadcastChannel('serial-data')
    channelSerialData.addEventListener('message', handleMessagePort);

    // 清理事件监听
    return () => {
      channelSerialData.removeEventListener('message', handleMessagePort);
      channelSerialData.close();
    };
  }, [handleMessagePort]);

  // 处理接收数据的优化函数
  const handleMessageBle = useCallback(
    throttle((senor) => {
      // console.log('进入监听函数')
      const now = Date.now();
      if (now - lastUpdateTime.current < throttleInterval) return;

      lastUpdateTime.current = now;

      const data = JSON.parse(senor); // 直接是回调传过来的数据
      // console.log(data);

      // 更新实时数值
      setRealtimeValues(data.slice(9));

      // 根据前两个字节判断要显示的图片
      let newImage = dynamicImageRef.current;
      if (data[0] === 1 && data[1] === 1) {
        newImage = bn1;
      } else if (data[0] === 0 && data[1] === 1) {
        newImage = bn2;
      } else if (data[0] === 1 && data[1] === 0) {
        newImage = bn3;
      } else if (data[0] === 0 && data[1] === 0) {
        newImage = bn5;
      }

      // 只有图片真正改变时才更新状态
      if (newImage !== dynamicImageRef.current) {
        setIsLoading(true);
        setDynamicImage(newImage);

        // 短暂显示加载状态
        setTimeout(() => setIsLoading(false), 50);
      }
    }, throttleInterval),
    []
  );
  // 接收数据
  useEffect(() => {
    // 注册监听
    window.EditorPreload.sendSenorData(handleMessageBle);

    // 这里不用 removeListener，因为 sendSenorData 应该是一次性注册
    // 如果 preload 那边支持取消监听，可以在 return 里加上取消逻辑
    return () => {
      // 比如：window.EditorPreload.removeSenorData(handleMessage)
    };
  }, [handleMessageBle]);

  // window.EditorPreload.sendSenorData((senor) => {
  //     // console.log("📩 收到返回值:", senor);
  //     this.changeElector((JSON.parse(window.EditorPreload.getRobotData())[4]/4)*100)
  //     this.lastReciveTime=Date.now()
  // })

  useEffect(() => {

    // console.log('控制台初始化一次')
    const getBricksPort = new BroadcastChannel('get-bricks-port')
    getBricksPort.postMessage('getPortState')
    // 清理事件监听
    return () => {
      
      getBricksPort.close();
    };
  }, []);
  



   const [portContent, setPortContent] = useState([
      { port: '1', content: '', img: null },
      { port: '2', content: '', img: null },
      { port: '3', content: '', img: null },
      { port: '4', content: '', img: null },
      { port: '5', content: '', img: null },
      { port: '6', content: '', img: null },
      { port: '7', content: '', img: null },
      { port: '8', content: '', img: null },
    ]);

    const imageMap = {
      54: consoleEncoder,
      0: connSound,
      104: connTilt,
      41: consoleDistance,
      103: consoleMotor,
      57:consoleGesture,
      64:consoleLed,
      72:connSound
    };
    let portMap={
      7:1,
      0:2,
      6:3,
      1:4,
      5:5,
      2:6,
      4:7,
      3:8
    }
   useEffect(() => {
    const channel = new BroadcastChannel('distance_channel');

    const handleMessage = (event) => {
      console.log(event.data)
      let portIsTrue = [false, false, false, false, false, false, false, false];
      setPortContent((prevContent) => {
        const newContent = [...prevContent];

        for (let i = 0; i < event.data.length; i++) {
          for(let j=0;j<event.data[i].length;j++){
            if (event.data[i][j].length > 0) {
              const portIndex = portMap[event.data[i][j][0]];
              if (portIndex !== undefined) {
                portIsTrue[portIndex - 1] = true;
                const targetIndex = portIndex - 1;
                const image = imageMap[event.data[i][j][1]];
                if (targetIndex >= 0 && targetIndex < newContent.length) {
                  if(i==0){
                    newContent[targetIndex] = {
                      ...newContent[targetIndex],
                      img: image,
                      content:event.data[i][j][2]
                    };
                  }else if(i==1){
                    if(event.data[i][j][4]==0){
                      newContent[targetIndex] = {
                        ...newContent[targetIndex],
                        img: image,
                        content:`${event.data[i][j][2]} ${event.data[i][j][3]}`
                      };
                    }else if(event.data[i][j][4]==64 && event.data[i][j][3]!=0){
                      newContent[targetIndex] = {
                        ...newContent[targetIndex],
                        img: image,
                        content:`${event.data[i][j][2]} -${event.data[i][j][3]}`
                      };
                    }else if(event.data[i][j][4]==192 && event.data[i][j][3]!=0 &&event.data[i][j][2]!=0){
                      newContent[targetIndex] = {
                        ...newContent[targetIndex],
                        img: image,
                        content:`-${event.data[i][j][2]} -${event.data[i][j][3]}`
                      };
                    }else if(event.data[i][j][4]==192 && event.data[i][j][3]==0 &&event.data[i][j][2]!=0){
                      newContent[targetIndex] = {
                        ...newContent[targetIndex],
                        img: image,
                        content:`-${event.data[i][j][2]} ${event.data[i][j][3]}`
                      };
                    }else if(event.data[i][j][4]==128 &&event.data[i][j][2]!=0){
                      newContent[targetIndex] = {
                        ...newContent[targetIndex],
                        img: image,
                        content:`-${event.data[i][j][2]} ${event.data[i][j][3]}`
                      };
                    }else if(event.data[i][j][3]==0 &&event.data[i][j][2]==0){
                      newContent[targetIndex] = {
                        ...newContent[targetIndex],
                        img: image,
                        content:`${event.data[i][j][2]} ${event.data[i][j][3]}`
                      };
                    }
                  }else if(i==2){

                  }else if(i==3){
                    newContent[targetIndex] = {
                      ...newContent[targetIndex],
                      img: image,
                      content:event.data[i][j][2]
                    };
                  }else if(i==4){
                    newContent[targetIndex] = {
                      ...newContent[targetIndex],
                      img: image,
                      content:event.data[i][j][2]
                    };
                  }else if(i==5){
                    newContent[targetIndex] = {
                      ...newContent[targetIndex],
                      img: image,
                      content:event.data[i][j][3]
                    };
                  }else if(i==6){
                    if(event.data[i][j][3]==0){
                      newContent[targetIndex] = {
                        ...newContent[targetIndex],
                        img: image,
                        content:event.data[i][j][2]
                      };
                    }else if(event.data[i][j][3]==1){
                      newContent[targetIndex] = {
                        ...newContent[targetIndex],
                        img: image,
                        content:`-${event.data[i][j][2]}`
                      };
                    }
                    
                  }else if(i==7){
                    newContent[targetIndex] = {
                        ...newContent[targetIndex],
                        img: image,
                        content:``
                      };
                  }
                  
                }
              }
            }
          }
          
        }

        portIsTrue.forEach((used, index) => {
          if (!used) {
            newContent[index].content = '';
            newContent[index].img = null;
          }
        });

        return newContent;
      });
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      // 清理监听器，防止重复注册
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);



  if(extension== '2'){
    

    // 加载动画组件
    const Spinner = () => (
      <div style={{
        width: '24px',
        height: '24px',
        border: '3px solid rgba(0, 206, 209, 0.3)',
        borderRadius: '50%',
        borderTopColor: '#00ced1',
        animation: 'spin 0.8s linear infinite',
        // 内联keyframes动画
        '@keyframes spin': {
          to: { transform: 'rotate(360deg)' }
        }
      }}></div>
    );

    // 优化后的标签内容渲染
    const renderTabContent =() => {
      if (innerTab === 0) {
        // return (
        //   <div style={{ display: 'flex', justifyContent: 'space-around' ,flexDirection: 'column'}}>
        //     <img draggable={false} src={lineSenor} alt="Line Sensor" style={{ maxWidth: '100%',height:'60px' }} />

        //     <br/>
        //     {/* 实时数据展示部分 */}
        //     <div style={{ display: 'flex', gap: '10px' ,position:'relative',left:'145px'}}>
        //       {realtimeValues.map((value, index) => (
        //         <div key={index} style={{
        //           minWidth: '20px',
        //           padding: '4px 7px',
        //           backgroundColor: '#e0ffff',
        //           border: '1px solid #00ced1',
        //           borderRadius: '6px',
        //           // textAlign: 'center',
        //           fontSize: '15px',
        //           fontWeight: 'bold',
        //           color: '#333'
        //         }}>
        //           {value}
        //         </div>
        //       ))}
        //     </div>
        //   </div>
        // );

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* 图片部分 */}
            <img
              draggable={false}
              src={lineSenor}
              alt="Line Sensor"
              style={{ maxWidth: '100%', height: '60px' }}
            />

            <br />

            {/* 实时数据展示部分 */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
            }}>
              {realtimeValues.map((value, index) => (
                <div key={index} style={{
                  width: '36px', // ✅ 固定宽度，保证对齐
                  textAlign: 'center',
                  padding: '4px 0',
                  backgroundColor: '#e0ffff',
                  border: '1px solid #00ced1',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  {value}
                </div>
              ))}
            </div>
          </div>
        );
      } else if (innerTab === 1) {
        return (
          <div style={{
            height: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#777',
            position: 'relative'
          }}>
            {/* {isLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(240, 255, 255, 0.8)',
                zIndex: 10
              }}>
                <Spinner />
              </div>
            )} */}
            
            <img
              src={dynamicImage}
              alt="动态图像"
              draggable={false}
              style={{ 
                maxHeight: '60px', 
                marginTop: '8px',
                // transition: 'opacity 0.3s ease',
                // opacity: isLoading ? 0.5 : 1
              }}
            />
          </div>
        );
      }
      return null;
    }

    // 网格项组件
    const GridItem = React.memo(({ label, num }) => {
      const colors = ['#FFA07A', '#90EE90', '#87CEFA', '#DDA0DD'];
      
      return (
        <div style={{
          width: '70px',
          height: '70px',
          backgroundColor: num <= 2 ? '#f5f5f5' : '#eaeaea',
          borderRadius: '8px',
          border: '1px solid #ccc',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease'
        }}>
          {/* 顶部标识条 */}
          <div style={{
            width: '100%',
            backgroundColor: colors[num],
            textAlign: 'center',
            fontWeight: 'bold',
            padding: '2px 0',
            fontSize: '12px',
            color: '#333'
          }}>
            {label}
          </div>

          {/* 图片展示区域 */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#f0f0f0',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: '#555'
            }}>
              {label}
            </div>
          </div>
        </div>
      );
    });

    return (
      <div style={{ 
        display: 'flex', 
        // padding: '10px', 
        gap: '10px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f8f8f8',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        height:'100%'
        // margin: '20px auto'
      }}>
        {/* 左边：子标签 + 内容 */}
        <div style={{
          width: '100%',
          backgroundColor: '#f0ffff',
          border: '1px solid #00ced1',
          borderRadius: '8px',
          padding: '10px',
          boxShadow: '0 2px 6px rgba(0,206,209,0.2)'
        }}>
          {/* 子标签按钮 */}
          <div style={{ 
            display: 'flex', 
            // justifyContent: 'space-around', 
            //  justifyContent: 'center',  // 原来是 space-around，改成 center
              gap: '15px',                // 加上 gap 控制图标间距
            marginBottom: '10px',
            padding: '5px',
            backgroundColor: '#e0f8f8',
            borderRadius: '6px'
          }}>
            {tabIcons.map((icon, idx) => (
              <div
                key={idx}
                onClick={() => {
                  // setIsLoading(true);
                  setInnerTab(idx);
                  // setTimeout(() => setIsLoading(false), 50);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: innerTab === idx ? '#00ced1' : 'transparent',
                  borderRadius: '6px',
                  fontSize: '20px',
                  transition: 'all 0.3s ease',
                  color: innerTab === idx ? '#fff' : '#555',
                  boxShadow: innerTab === idx ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                  ':hover': {
                    backgroundColor: innerTab === idx ? '#00ced1' : '#e0f8f8',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {<img draggable={false} src={icon} style={{height:'25px',width:'25px'}}></img> ||icon }
              </div>
            ))}
          </div>

          <hr style={{ 
            margin: '10px 0', 
            border: 'none', 
            borderTop: '1px solid #b0e0e6' 
          }} />
          
          {/* 当前子标签内容 */}
          <div style={{ minHeight: '100px' }}>
            {renderTabContent()}
          </div>
        </div>

        {/* 右边：模块格子 */}
        {/* <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          flexGrow: 1,
          alignContent: 'start'
        }}>
          {[1, 2, 3, 4].map((label, num) => (
            <GridItem key={num} label={label} num={num} />
          ))}
        </div> */}
      </div>
    );
  }else if(extension == '1'){
  

    const GridItem = React.memo(({ label, num }) => {
      const colors = ['#FFA07A', '#90EE90', '#87CEFA', '#DDA0DD'];
      
      return (
        <div style={{
          position:'relative',
          left:'20px',
          top:'20px',
          width: '70px',
          height: '70px',
          backgroundColor: num <= 2 ? '#f5f5f5' : '#eaeaea',
          borderRadius: '8px',
          border: '1px solid #ccc',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease'
        }}>
          {/* 顶部标识条 */}
          <div style={{
            width: '100%',
            backgroundColor: label.img ? '#4fce9d' : '#7a8480',
            textAlign: 'center',
            fontWeight: 'bold',
            padding: '2px 0',
            fontSize: '12px',
            color: '#333'
          }}>
            {label.port}:{label.content}
          </div>

          {/* 图片展示区域 */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#f0f0f0',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: '#555'
            }}>
              <img draggable={false} src={label.img}></img>
            </div>
          </div>
        </div>
      );
    });
    return (
       <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          flexGrow: 1,
          alignContent: 'start'
        }}>
          {portContent.map((label, num) => (
            <GridItem key={num} label={label} num={num} />
          ))}
        </div>
    );
  }else if(extension == '3'){
    return (
      <div>
        {/* 占位 */}
      </div>
    )
  }
};


// 主组件
const TabSwitcher = ({ serialData ,onSendData,extension  }) => {
  const [activeTab, setActiveTab] = useState('download');

  return (
    <div
      style={{
        width: '100%',
        // background: '#98F5FF',
        borderRadius: '8px',
        overflow: 'hidden',
        maxHeight: '40vh',           // 设置最大高度
        overflowY: 'auto',           // 超出时出现滚动条
        boxSizing: 'border-box',     // 让 padding 不额外撑高度
        paddingTop:'10px',
        height:'40vh'
      }}
    >
      {/* Tabs */}
      <div style={{ display: 'flex' }}>
        {[
          { key: 'download', label: '下载' },
          { key: 'control', label: '控制台' },
          { key: 'monitor', label: '串口监视器' },
        ].map(({ key, label }) => (
          <div
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === key ? '#32b7a6' : '#AEEEEE',
              cursor: 'pointer',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              fontWeight: 'bold',
              marginRight: '2px',
            }}
          >
            {/* {label} */}
            <FormattedMessage
                defaultMessage={label}
                description="Button in menu bar under settings to open desktop app settings"
                id={key}
            />
          </div>
        ))}
      </div>

      {/* 内容区域 */}
      <div
        style={{
          backgroundColor: '#fff',
          // padding: '20px',
          borderRadius: '0 0 8px 8px',
          border: '1px solid #17a934', 
          height: '26vh',
        }}
      >
        {activeTab === 'download' && <ProgramDownload  onSendData ={onSendData } extension={extension}/>}
        {activeTab === 'control' && <ControlPanelLayout extension={extension} />}
        {activeTab === 'monitor' && <SerialMonitor serialData={serialData} extension={extension} />}
      </div>
    </div>
  );
};

export default TabSwitcher;
