import { getAdd ,getBlock} from '../../../../../utils/isAddMaster.js';
import { getIsRobot ,getRobotIp} from 'scratch-gui/src/components/utils/utils.js';
// ================== 核心逻辑 ==================
export function createControlsLogic(componentInstance) {
    const self = componentInstance

    function handleGreenFlagClick (e) {
        e.preventDefault();
        e.persist(); // 保留事件对象
        console.log('小绿旗')
        // fetch(`http://localhost:3000/get-ble`,{
        //     method: 'GET'
        // })
        // .then(response => {
        //     if (response.ok) {
        //     return response.text();
        //     } else {
        //     throw new Error('请求失败，状态码：' + response.status);
        //     }
        // })
        // .then(isble => {
        //     console.log('蓝牙是否连接', isble);
        //     console.log(getAdd())
            if(window.__bluetoothDevice && getAdd() && getBlock()){
                // alert('请先连接蓝牙')
                if (e.shiftKey || e.altKey || e.type === 'contextmenu') {
                    if (e.shiftKey) {
                        self.props.vm.setTurboMode(!self.props.turbo);
                    }
                    if (e.altKey || e.type === 'contextmenu') {
                        if (self.props.framerate === 30) {
                            self.props.vm.setFramerate(60);
                        } else {
                            self.props.vm.setFramerate(30);
                        }
                    }
                } else {
                    if (!self.props.isStarted) {
                        self.props.vm.start();
                    }
                    self.props.vm.greenFlag();
                }
            }else{
                if(getIsRobot()){
                   
                }
                // tw: implement alt+click and right click to toggle FPS
                if (e.shiftKey || e.altKey || e.type === 'contextmenu') {
                    if (e.shiftKey) {
                        self.props.vm.setTurboMode(!self.props.turbo);
                    }
                    if (e.altKey || e.type === 'contextmenu') {
                        if (self.props.framerate === 30) {
                            self.props.vm.setFramerate(60);
                        } else {
                            self.props.vm.setFramerate(30);
                        }
                    }
                } else {
                    if (!self.props.isStarted) {
                        self.props.vm.start();
                    }
                    self.props.vm.greenFlag();
                }
            }
        // })
        // .catch(error => {
        //     console.error('发生错误：', error);
        // });
        
        
    }

    function handleStopAllClick (e) {
        e.preventDefault();
        self.props.vm.stopAll();
        console.log('停止')
        self.stopAll.postMessage(true)
        if(getIsRobot()){

            if(self.whatSendFun=='net'){
                const Socket = new WebSocket(`ws://${self.ip}:8084`);
                    
                Socket.addEventListener('open', async (event) => {
                    console.log('连接成功');
                    Socket.send('stop')
                    await new Promise(resolve => setTimeout(resolve, 100));
                    Socket.close()
    
                        
                });
            }else{
                self.channelPort.postMessage(JSON.stringify({
                                "command": "select_mode",
                                "params": 
                                    {
                                        "mode": `stop`,
                                    }
                            }))
            }
        }
    }

    
    return {
       handleGreenFlagClick,
       handleStopAllClick
    };
}
