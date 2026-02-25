// import store from '../redux/store';
import {openMasterModal,closeMasterModal,openConnectModal,closeConnectModal,openFirmwareModal,closeFirmwareModal} from '../reducers/modals';
import {setCurrent, getCurrent } from '../components/utils/utils.js';
import codeModule from '../../../../utils/global.js';
// lib/DesktopAPI.js

let dispatchRef = null; // 用于保存 Redux dispatch 引用
const DesktopAPI = {
    registerDispatch: (dispatch) => {
        dispatchRef = dispatch;
        console.log('[DesktopAPI] dispatch registered');
    },
    onClickConnect: () => {
        console.log(dispatchRef)
        if(getCurrent()==''){
             if (dispatchRef) {
                dispatchRef(openMasterModal());
            } else {
                console.warn('[DesktopAPI] dispatch 未注册');
            }
        }else{
            dispatchRef(openConnectModal())
        }
        
    },
    onClickFirmware: () => {
        console.log('[DesktopAPI] firmware')
        if(getCurrent()==''){
             if (dispatchRef) {
                dispatchRef(openMasterModal());
            } else {
                console.warn('[DesktopAPI] dispatch 未注册');
            }
        }else{
            if (dispatchRef) {
                dispatchRef(openFirmwareModal());
            } else {
                console.warn('[DesktopAPI] dispatch 未注册');
            }
        }
       
    },
    onClickDesktopSettings: () => console.log('[DesktopAPI] desktop settings'),
    clickSerialConnect: () => console.log('[DesktopAPI] serial connect'),
    download: () => console.log('[DesktopAPI] download'),
    SerialDownload: () => console.log('[DesktopAPI] serial download'),
    saveCode: (args) => {
        let filename='project.py'
        if(args.device=='ICBricks'){
            filename='project.lua'
        }else{
            filename='project.py'
        }
        const blob = new Blob([args.code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
      
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
      
        URL.revokeObjectURL(url);
    },
    loadCode: async() =>{
        const [handle] = await window.showOpenFilePicker({
            types: [{
              description: 'Code File',
              accept: {
                'text/plain': ['.py', '.lua']
              }
            }]
          });
        
          const file = await handle.getFile();
          const content = await file.text();

        //   console.log(content)
        codeModule.setCode(content)
    },
    cancelload: () => console.log('[DesktopAPI] cancel load'),
    clickBleConnect: () => console.log('[DesktopAPI] ble connect'),
    clickDownloadCode: () => console.log('[DesktopAPI] download code'),
    clickEspSend: () => console.log('[DesktopAPI] esp send'),
    clickSendWifi: () => console.log('[DesktopAPI] send wifi'),
    onClickNewWindow: () => window.open('/', '_blank'),
    onClickPackager: () => console.log('[DesktopAPI] packager'),
    showOpenFilePicker: () => console.log('[DesktopAPI] open file picker'),
    showSaveFilePicker: () => console.log('[DesktopAPI] save file picker'),
    onClickMaster: () => {
        if (dispatchRef) {
            dispatchRef(openMasterModal());
        } else {
            console.warn('[DesktopAPI] dispatch 未注册');
        }
    },
    onRequestCloseMasterModal: () => {
        console.log('调用了onRequestCloseMasterModal')
        dispatchRef(closeMasterModal())
    },
    onRequestCloseFirmwareModal:()=>{
        dispatchRef(closeFirmwareModal())
    },
    onRequestCloseConnectModal: () => dispatchRef(closeConnectModal()),
    
};

export default DesktopAPI;