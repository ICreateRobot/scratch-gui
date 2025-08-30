let isMaster=false;
let distance=[]
let isBricks=false;
let isRobot=false;
let isLoad=false

let deleteCater=[]

let robotIp=''

let currentExtension=''

let loadExtensions=[]

let allLoaded=[]

let deletedCategoriesID = ['robotwifi', 'robotcat'];

let hiddenBlocksTypes = ['robotsensors_asrStart','robotsensors_asrStop','robotsensors_asrResult','robotevent_when','robotimg_isCat','robotimg_catNum','robotimg_catPlace','robotimg_isOpenModel','brickstwomotor_speedmoveplace','brickssensors_colorSensor','brickssensors_colorRgb','brickssensors_colorLight','brickssensors_touch'];

let showCode=false

let isDown=false

let electronVisable=false

const codeArray=[
        `time.sleep(0.5)
icrobot.display.show_image([0x0,0x0,0x0,0x10,0x7E,0x91,0x81,0x81,0xC1,0x82,0x84,0x84,0x84,0x84,0x82,0xC1,0x81,0x81,0x91,0x7E,0x10,0x0,0x0,0x0],0)
time.sleep(0.5)
icrobot.rgb_sensor.line_tracking(2)`,
        `time.sleep(0.5)
icrobot.display.show_image([0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0xC,0x90,0xEF,0xEF,0x90,0xC,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0],0)
while True:
    if (icrobot.asr.vol()) > 65:
        icrobot.motor.move_forward(50,duration=1,distance=-1)
        time.sleep(1)
    time.sleep_ms(50)`,
        `icrobot.camera.open(0)
icrobot.ai.set_model(icrobot.ai.apriltag_recognition)
while True:
    if icrobot.ai.apriltag_isrecognized():
        if icrobot.ai.get_apriltag_information() == None:
            continue
        num = icrobot.ai.get_apriltag_information()
        icrobot.display.show_text(str(num))
        if num == 0:
            icrobot.motor.turn_left(50,duration= -1,distance= 90)
        elif num == 1:
            icrobot.motor.move_backward(50,duration= -1,distance= 10)
        elif num == 2:
            icrobot.motor.move_forward(50,duration=-1,distance=10)
        elif num == 3:
            icrobot.speaker.play_music_until_done('/flash/bicycle.wav')
        elif num == 4:
            icrobot.speaker.play_music_until_done('/flash/police.wav')
        elif num == 5:
            icrobot.speaker.play_music_until_done('/flash/car.wav')
        elif num == 6:
            icrobot.speaker.play_music_until_done('/flash/ambulance.wav')
        elif num == 7:
            icrobot.speaker.play_music_until_done('/flash/train.wav')
        elif num == 8:
            icrobot.speaker.play_music_until_done('/flash/cat.wav')
        elif num == 9:
            icrobot.motor.turn_right(50,duration= -1,distance= 90)    
    time.sleep(0.5)
`,
        `R_Rocker = {"x": 0, "y": 0, "key": 0}
L_Rocker = {"x": 0, "y": 0, "key": 0}
Xkey = Ykey = Akey = Bkey = 0
UPkey = DOkey = Lkey = Rkey = 0
Lshoulder = Rshoulder = 0
Ltrigger = Rtrigger = 0
icrobot.display.show_image([0x0,0x0,0x0,0x0,0x7C,0x82,0x91,0xB9,0x91,0x83,0x85,0x85,0x85,0x85,0x83,0xA9,0x91,0xA9,0x82,0x7C,0x0,0x0,0x0,0x0],0)
def get_all_bluetooth_data():
    global Xkey, Ykey, Akey, Bkey, UPkey, DOkey, Lkey, Rkey
    global Lshoulder, Rshoulder, Ltrigger, Rtrigger
    global R_Rocker, L_Rocker
    if ble.flag:
        # 假设接收到的数据（字节数组）
        temporary = ble.BLE_MESSAGE
        
        if temporary and temporary[0] == 0xff:
            # 解析数据
            R_Rocker["x"] = temporary[1] if temporary[1] <= 127 else temporary[1] - 256
            R_Rocker["y"] = temporary[2] if temporary[2] <= 127 else temporary[2] - 256

            L_Rocker["x"] = temporary[3] if temporary[3] <= 127 else temporary[3] - 256
            L_Rocker["y"] = temporary[4] if temporary[4] <= 127 else temporary[4] - 256

            Rtrigger = ((temporary[5] >> 0) & 1)
            Rshoulder = ((temporary[5] >> 1) & 1)

            Ltrigger = ((temporary[5] >> 2) & 1)
            Lshoulder = ((temporary[5] >> 3) & 1)

            R_Rocker["key"] = ((temporary[5] >> 4) & 1)
            L_Rocker["key"] = ((temporary[5] >> 5) & 1)

            Ykey = ((temporary[6] >> 0) & 1)
            Xkey = ((temporary[6] >> 1) & 1)
            Bkey = ((temporary[6] >> 2) & 1)
            Akey = ((temporary[6] >> 3) & 1)

            Rkey = ((temporary[6] >> 4) & 1)
            Lkey = ((temporary[6] >> 5) & 1)
            DOkey = ((temporary[6] >> 6) & 1)
            UPkey = ((temporary[6] >> 7) & 1)
                         
while True:
    get_all_bluetooth_data()
    # 控制前后运动（通过右摇杆 Y 轴）
    l_speed = 0  # 左轮速度
    r_speed = 0  # 右轮速度
    lx = L_Rocker["x"]
    ly = L_Rocker["y"]
    if Ltrigger == 1 or Rtrigger == 1:
        icrobot.gun.fire(1,1) 
    if Xkey == 1:
        icrobot.gripper.open(2)
    if Ykey == 1:
        icrobot.gripper.close(2)
    if R_Rocker["key"]==1 or L_Rocker["key"]==1:
        icrobot.speaker.play_music_until_done("/flash/car.wav")

    if abs(lx) > 20 or abs(ly) > 20:
        l_speed = ly + lx
        r_speed = ly - lx
        l_speed = max(-100, min(100, l_speed))
        r_speed = max(-100, min(100, r_speed))
    # 调用 uart.send_move() 控制小车
    icrobot.motor.drive(l_speed,r_speed)
    time.sleep_ms(100)`,
        `time.sleep(0.5)
icrobot.display.show_image([0x0,0x0,0x0,0x0,0x0,0x0,0x38,0x47,0x91,0x8A,0x92,0x82,0x82,0x92,0x8A,0x91,0x47,0x38,0x0,0x0,0x0,0x0,0x0,0x0],0)
icrobot.camera.open(0)
icrobot.ai.set_model(icrobot.ai.apriltag_recognition)
icrobot.gripper.open_until_done(2)
icrobot.motor.move_forward(50,duration=-1,distance=0.7*10)
icrobot.motor.turn_right(50,duration=-1,distance=90)
icrobot.motor.move_forward(50,duration=-1,distance=2.1*10)
while True:
    if icrobot.ai.apriltag_isrecognized():
        if icrobot.ai.get_apriltag_information() == None:
            continue
        if icrobot.ai.get_apriltag_information() ==1:
            num = icrobot.ai.get_apriltag_information()
            icrobot.gripper.close_until_done(2)
            icrobot.motor.turn_left(50,duration=-1,distance=90)
            icrobot.motor.move_forward(50,duration=-1,distance=1.4*10)
            icrobot.motor.turn_left(50,duration=-1,distance=90)
            icrobot.motor.move_forward(50,duration=-1,distance=2.1*10)
            icrobot.motor.turn_right(50,duration=-1,distance=90)
            icrobot.motor.move_backward(50,duration=-1,distance=0.7*10)
            icrobot.gripper.open_until_done(2)
            break
    time.sleep(0.3)`
    ];

function setIsMaster(a){
    isMaster=a
}
function getIsMaster(){
    return isMaster
}

function setDistance(a){
    distance=a
}
function getDistance(){
    return distance
}

function setIsBricks(a){
    isBricks=a
}
function getIsBricks(){
    return isBricks
}

function setIsRobot(a){
    isRobot=a
}
function getIsRobot(){
    return isRobot
}


function setIsLoad(a){
    isLoad=a
}

function getIsLoad(){
    return isLoad
}

function setRobotIp(a){
    robotIp=a
}

function getRobotIp(){
    return robotIp
}

function setDelete(a){
    deleteCater=[]
    for(let i=0;i<a.length;i++){
        console.log(a[i])
        deleteCater.push(a[i])
    }
}

function getDelete(){
    return deleteCater
}

function setCurrent(a){
    currentExtension=a
}

function getCurrent(){
    return currentExtension
}

function addLoadExtension(a){
    loadExtensions.push(a)

    loadExtensions = [...new Set(loadExtensions)];
}
function delLoadExtension(a){
    const index = loadExtensions.indexOf(a); // 查找元素的索引

    if (index > -1) {
        loadExtensions.splice(index, 1); // 从索引处删除一个元素
    }
}

function getLoadExtension(){
    return loadExtensions
}

function setAllLoaded(a){
    allLoaded.push(a)

    allLoaded = [...new Set(allLoaded)];
}

function getAllLoaded(){
    return allLoaded
}

function getDeletedCate(){
    return deletedCategoriesID
}

function setDeletedCate(a){
    deletedCategoriesID.push(a)
}

function delCategro(index,len){
    deletedCategoriesID.splice(index,len)
}


function getHiddenBlocks(){
    return hiddenBlocksTypes
}

function setHiddenBlocks(a){
    hiddenBlocksTypes.push(a)
}

function delHiddenBlocks(index,len){
    hiddenBlocksTypes.splice(index,len)
}

function getShowCodeDb(){
    return showCode
}

function setShowCodeDb(a){
    showCode=a
}

function setLongIsDown(a){
    isDown=a
}

function getLongIsDown(){
    return isDown
}

function setElectron(a){
    electronVisable=a
}

function getElectron(){
    return electronVisable
}
export {
    setIsMaster,
    getIsMaster,
    setDistance,
    getDistance,
    setIsBricks,
    getIsBricks,
    setIsRobot,
    getIsRobot,
    setIsLoad,
    getIsLoad,
    setRobotIp,
    getRobotIp,
    setDelete,
    getDelete,
    setCurrent,
    getCurrent,
    addLoadExtension,
    delLoadExtension,
    getLoadExtension,
    setAllLoaded,
    getAllLoaded,
    getDeletedCate,
    setDeletedCate,
    delCategro,
    getHiddenBlocks,
    setHiddenBlocks,
    delHiddenBlocks,
    getShowCodeDb,
    setShowCodeDb,
    setLongIsDown,
    getLongIsDown,
    setElectron,
    getElectron,
    codeArray
}