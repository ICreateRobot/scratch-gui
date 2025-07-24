import React, { useState, useEffect, useRef } from 'react';
import styles from './TrainPage.css'; // 这里要确保你的样式文件引入正确


let block_msg_class='类别'

const TrainPage = ({ isTrain }) => {
  if (!isTrain) return null; 

  const channelTrain=new BroadcastChannel('channelTrain')
  function back(){
    channelTrain.postMessage(false)
  }
 
  
  let videoStream;
 
  const channelVideo = new BroadcastChannel('channelVideo')
  channelVideo.addEventListener('message',async (event)=>{
    if(typeof event.data=='string'){
      if(event.data=='close'){
        if(videoStream){
          videoStream.getTracks().forEach(track => track.stop());
        }
        
      }else{
        let video=iframeDocument.getElementById(event.data)
        videoStream=await navigator.mediaDevices.getUserMedia({video:true})
        video.srcObject = videoStream
      }
    }else{
      console.log(event.data)
    }
   
    
    
  })

  const currentURL = window.location.href;

  // 获取前一级路径
  const oneLevelUp = currentURL.substring(0, currentURL.lastIndexOf('/'));
  // 获取前两级路径
  const twoLevelsUp = oneLevelUp.substring(0, oneLevelUp.lastIndexOf('/'));
  const modelPath =twoLevelsUp+'/static/aiModel/ai_choice.html';  // 你的模型路径
  console.log(modelPath)
  console.log(window.location.href)

  const modelSelectRef = useRef(null);
  const projectManagementRef = useRef(null)
  const topBarTiltRef = useRef(null)


  const iframeRef = useRef(null);
  let iframeDocument



  useEffect(() => {
    // console.log(window)
    // 在 iframe 加载完成后，获取内部 DOM 元素
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.onload = () => {
        if (iframeRef.current) {
          iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
          
        }
      };
    }
  }, []);


  // var openFileName = GetQueryString("name")+'';
  // var p = window.parent;
  // var currentPage = "ai_choice";

  // if(modelSelectRef.current){
  //   modelSelectRef.current.style.display = 'flex';
  // }
  


  // function GetQueryString(name) {
  //     var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
  //     var r = window.location.search.substr(1).match(reg); //获取url中"?"符后的字符串并正则匹配
  //     var context = "";
  //     if (r != null)
  //         context = decodeURIComponent(r[2]);
  //     reg = null;
  //     r = null;
  //     return context == null || context == "" || context == "undefined" ? "" : context;
  // }



  // // 显示项目管理界面
  // function showProjectManagement(type) {
  //     currentPage = type;
  //     // if(currentPage=='posture'){//姿态
  //     //     p.refreshDirMP('.icPMP');
  //     // }else if(currentPage=='gesture'){//手势
  //     //     p.refreshDirMP('.icGMP');
  //     // }else if(currentPage=='image'){//图像
  //     //     p.refreshDirMP('.icIMP');
  //     // }else if(currentPage=='sound'){//声音
  //     //       // alert("敬请期待")
  //     //       // return
  //     //     p.refreshDirMP('.icSMP');
  //     // }else{
  //     //     alert("敬请期待")
  //     //     return
  //     // }
  //     setTimeout(() => {//增加一段延时，项目加载一会
  //         if(modelSelectRef.current){
  //           modelSelectRef.current.style.display = 'none';
  //         }
  //         if(projectManagementRef.current){
  //           projectManagementRef.current.style.display = 'flex';
  //         }
  //         // $('#topBar_tilt').text(window.parent.block_msg_project_title);//'项 目 管 理'

  //         if(topBarTiltRef.current){
  //           projectManagementRef.current.innerText='项目管理'
  //         }
  //     }, 200);

  // }

  // // 显示模型选择界面
  // function showmodelSelection() {
  //     currentPage = "ai_choice";
  //     if(modelSelectRef.current){
  //       modelSelectRef.current.style.display = 'flex';
  //     }
  //     if(projectManagementRef.current){
  //       projectManagementRef.current.style.display = 'none';
  //     }
  //     // $('#topBar_tilt').text(window.parent.block_msg_project_title);//'项 目 管 理'

  //     if(topBarTiltRef.current){
  //       projectManagementRef.current.innerText='训练模型'
  //     }
  // }

  // // /*新建项目*/
  // // $('#newProject').click(function() {
  // //     goLearn(-1);
  // // });

  // // /*上传项目*/
  // // $('#uploadingProject').click(function() {
  // //     alert("敬请期待")
  // // });



  // /*跳转学习界面*/
  // function goLearn(num){
  //     if(currentPage=='posture'){//姿态
  //         p.page="learn_posture";
  //         location.replace("learn.html?name="+openFileName+"&opennum="+num+"&MType=P");
  //     }else if(currentPage=='gesture'){//手势
  //         p.page="learn_gesture";
  //         location.replace("learn_g.html?name="+openFileName+"&opennum="+num+"&MType=G");
  //     }else if(currentPage=='image'){//图像
  //         p.page="learn_image";
  //         location.replace("learn_i.html?name="+openFileName+"&opennum="+num+"&MType=I");
  //     }else if(currentPage=='sound'){//声音
  //         p.page="learn_sound";
  //         location.replace("learn_s.html?name="+openFileName+"&opennum="+num+"&MType=S");
  //     }
  // }


  // // 获取卡片容器
  // const cardContainer = document.getElementById('projectContainer');
  // /*创建项目卡片*/
  // function addCardToUI(projectName, projectDescription,num) {
  //     // 创建卡片的外部div
  //     const cardDiv = document.createElement('div');
  //     cardDiv.classList.add('card');

  //     // 创建图像元素
  //     const img = document.createElement('img');
  //     img.src = "../../img/AI/pg_"+currentPage+".svg"; // 设置图像路径
  //     //img.alt = "项目图标";

  //     // 创建标题div（项目名称）
  //     const titleDiv = document.createElement('div');
  //     titleDiv.classList.add('card_title');
  //     titleDiv.textContent = projectName; // 设置项目名称

  //     // 创建描述div（项目说明）
  //     const descDiv = document.createElement('div');
  //     descDiv.classList.add('card_description');
  //     descDiv.textContent = window.parent.block_msg_instructions + projectDescription; // "说明："

  //     // 创建底部div
  //     const bottomDiv = document.createElement('div');
  //     bottomDiv.classList.add('card_bottom');

  //     // 创建编辑按钮
  //     const editButton = document.createElement('button');
  //     editButton.classList.add('edit_button');
  //     editButton.textContent = window.parent.block_msg_editor;//"编 辑"
  //     // 添加点击事件监听器
  //     editButton.addEventListener('click', function() {
  //         goLearn(num)
  //     });

  //     // 将按钮添加到底部div
  //     bottomDiv.appendChild(editButton);

  //     // 创建删除按钮
  //     const delDiv = document.createElement('div');
  //     delDiv.classList.add('card_del');
  //     delDiv.textContent = "×";
  //     // 添加点击事件监听器
  //     delDiv.addEventListener('click', function() {
  //         p.delProject(num);
  //         cardContainer.removeChild(this.parentElement);
  //     });

  //     // 将所有元素添加到卡片div中
  //     cardDiv.appendChild(img);
  //     cardDiv.appendChild(titleDiv);
  //     cardDiv.appendChild(descDiv);
  //     cardDiv.appendChild(bottomDiv);
  //     cardDiv.appendChild(delDiv);

  //     // 将卡片添加到容器中
  //     cardContainer.appendChild(cardDiv);
  // }


  
  return (
    // <div className={styles.total}>
    //   <div id="back" onClick={back} className={styles.topBar_back}></div>
    //   <div id="topBar_tilt" ref={topBarTiltRef} className={styles.topBar_tilt}>训 练 模 型</div>


    //   <div id="modelSelection" ref={modelSelectRef} className={styles.mainBody_modelClass}>
    //       <div className={styles.modelClass}>
    //           <img src={modelClassImage} alt="图像识别" className={styles.imgClass}></img>
    //           <div id='recognize1' className={styles.modelClass_title}>图 像 识 别</div>
    //       </div>

    //       <div className={styles.modelClass}>
    //           <img src={modelClassGesture} alt="手势识别" className={styles.imgClass}></img>
    //           <div id='recognize2' className={styles.modelClass_title}>手 势 识 别</div>
    //       </div>
    //       <div className={styles.modelClass}>
    //           <img src={modelClassPsture} alt="姿态识别" className={styles.imgClass}></img>
    //           <div id='recognize3' className={styles.modelClass_title}>姿 态 识 别</div>
    //       </div>
    //       <div className={styles.modelClass}>
    //         <img src={modelClassSound} alt="语音识别" className={styles.imgClass}></img>
    //         <div id='recognize4' className={styles.modelClass_title}>语 音 识 别</div>
    //       </div>
    //   </div>


    //   <div id="projectManagement" ref={projectManagementRef} className={styles.projectManagement}>
    //       <div className={styles.project_add}>
    //           <div id='newProject' className={styles.button}>新建项目</div>
    //           <div  id='uploadingProject' className={styles.button}>上传项目</div>
    //       </div>
    //       <div id="projectContainer">
              
    //       </div>
    //   </div>
    // </div>
    <div>
      <iframe
        id='myIframe'
        ref={iframeRef}
        src={modelPath}
        width="100%"
        height="600px"
        className={styles.total}
        allow="camera *; microphone *"
        sandbox="allow-scripts allow-same-origin allow-popups allow-modals allow-downloads"
      />
    </div>
    
  );
};

export default TrainPage;