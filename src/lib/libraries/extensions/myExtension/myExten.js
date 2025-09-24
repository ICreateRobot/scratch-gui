
import {FormattedMessage} from 'react-intl';
import React from 'react';
//robot teachable
import robotteachableImage from '../robotteachable/teachable_center.png';
import robotImgImage from '../robotimg/img_center.png';
import robotapriltagImage from '../robotapriltag/apriltag_center.png';
import robotcolordeteImage from '../robotcolordete/colordete_center.png';
import robotqrImage from '../robotqr/qr_center.png';
import robotgoodImage from '../robotgood/good_center.png';
import robotfaceImage from '../robotface/face_center.png';
import robotcolorplaceImage from '../robotcolorplace/colorplace_center.png';
import robotcolorxyImage from '../robotcolorxy/colorxy_center.png';
import robotcatImage from '../robotcat/cat_center.png';
import robottrafficImage from '../robottraffic/traffic_center.png';


//bricks motor
import bricksMotorImage from '../bricksmotor/motor-center.png';
import bricksMotorInsetImage from '../bricksmotor/motor-bottom.svg';

//bricks two motor
import bricksTwoMotorImage from '../brickstwomotor/two-motor-center.png';
import bricksTwoMotorInsetImage from '../brickstwomotor/two-motor.svg';

//bricks light
import bricksLightImage from '../brickslight/light_center.png';
import bricksLightInsetImage from '../brickslight/light_bottom.svg';

//bricks sensors
import bricksSensorsImage from '../brickssensors/sensors_center.png';
import bricksSensorsInsetImage from '../brickssensors/sensors_bottom.svg';

//bricks event
import bricksEventImage from '../bricksevent/event_center.png'
import bricksEventInsetImage from '../bricksevent/event_bottom.svg'


//robot move
import robotmoveImage from '../robotmove/move_center.png'
import robotmoveInsetImage from '../robotmove/move_bottom.svg'

//robot sensors
import robotsensorsImage from '../robotsensors/sensors_center.png'
import robotsensorsInsetImage from '../robotsensors/sensors_bottom.svg'

//robot event
import roboteventImage from '../robotevent/event_center.png'
import roboteventInsetImage from '../robotevent/event_bottom.svg'

//robot wifi
import robotwifiImage from '../robotwifi/wifi_center.png'
import robotwifiInsetImage from '../robotwifi/wifi_bottom.svg'

//robot emote
import robotemoteImage from '../robotemote/emote_center.png'
import robotemoteInsetImage from '../robotemote/emote_bottom.svg'

//robot show
import robotshowImage from '../robotshow/show_center.png'
import robotshowInsetImage from '../robotshow/show_bottom.svg'

//robot sound
import robotsoundImage from '../robotsound/sound_center.png'
import robotsoundInsetImage from '../robotsound/sound_bottom.svg'

//robot actuator
import robotactuatorImage from '../robotactuator/actuator_center.png'
import robotactuatorInsetImage from '../robotactuator/actuator_bottom.svg'

//robot ble
import robotbleImage from '../robotble/ble_center.png'
import robotbleInsetImage from '../robotble/ble_bottom.svg'

//deepseek
import deepseekImage from '../deepseek/deep_center.png'
import deepseekInsetImage from '../deepseek/deep_bottom.svg'

//艾克瑞特 microbite
import ICmicrobitIconURL from '../ICreate_Microbit/microbit.png';
import ICmicrobitInsetIconURL from '../ICreate_Microbit/microbit-small.svg';
import ICmicrobitConnectionIconURL from '../ICreate_Microbit/microbit-illustration.svg';
import ICmicrobitConnectionSmallIconURL from '../ICreate_Microbit/microbit-small.svg';

const robotTeachableExtension = {
    name: (
        <FormattedMessage
            defaultMessage="机器学习"
            description="Name for the 'robotteachable' extension"
            id="gui.extension.robotteachable.name"
        />
    ),
    extensionId: 'robotteachable',
    iconURL: robotteachableImage,
    description: (
        <FormattedMessage
            defaultMessage="机器学习."
            description="Description for the 'robotteachable' extension"
            id="gui.extension.robotteachable.description"
        />
    ),
    tags: ['main'],
    featured: true
};

const robotImgExtension = {
    name: (
        <FormattedMessage
            defaultMessage="摄像头"
            description="Name for the 'robotimg' extension"
            id="gui.extension.robotimg.name"
        />
    ),
    extensionId: 'robotimg',
    iconURL: robotImgImage,
    description: (
        <FormattedMessage
            defaultMessage="摄像头."
            description="Description for the 'robotimg' extension"
            id="gui.extension.robotimg.description"
        />
    ),
    tags: ['main'],
    featured: true
};

const robotApriltagExtension = {
    name: (
        <FormattedMessage
            defaultMessage="apriltag识别"
            description="Name for the 'robotapriltag' extension"
            id="gui.extension.robotapriltag.name"
        />
    ),
    extensionId: 'robotapriltag',
    iconURL: robotapriltagImage,
    description: (
        <FormattedMessage
            defaultMessage="apriltag识别."
            description="Description for the 'robotapriltag' extension"
            id="gui.extension.robotapriltag.description"
        />
    ),
    tags: ['main'],
    featured: true
};

const robotColordeteExtension = {
    name: (
        <FormattedMessage
            defaultMessage="颜色识别"
            description="Name for the 'robotcolordete' extension"
            id="gui.extension.robotcolordete.name"
        />
    ),
    extensionId: 'robotcolordete',
    iconURL: robotcolordeteImage,
    description: (
        <FormattedMessage
            defaultMessage="颜色识别."
            description="Description for the 'robotcolordete' extension"
            id="gui.extension.robotcolordete.description"
        />
    ),
    tags: ['main'],
    featured: true
};

const robotQrExtension = {
    name: (
        <FormattedMessage
            defaultMessage="二维码识别"
            description="Name for the 'robotqr' extension"
            id="gui.extension.robotqr.name"
        />
    ),
    extensionId: 'robotqr',
    iconURL: robotqrImage,
    description: (
        <FormattedMessage
            defaultMessage="二维码识别."
            description="Description for the 'robotqr' extension"
            id="gui.extension.robotqr.description"
        />
    ),
    tags: ['main'],
    featured: true
};

const robotGoodExtension = {
    name: (
        <FormattedMessage
            defaultMessage="物体识别"
            description="Name for the 'robotgood' extension"
            id="gui.extension.robotgood.name"
        />
    ),
    extensionId: 'robotgood',
    iconURL: robotgoodImage,
    description: (
        <FormattedMessage
            defaultMessage="物体识别."
            description="Description for the 'robotgood' extension"
            id="gui.extension.robotgood.description"
        />
    ),
    tags: ['main'],
    featured: true
};

const robotFaceExtension = {
    name: (
        <FormattedMessage
            defaultMessage="人脸识别"
            description="Name for the 'robotface' extension"
            id="gui.extension.robotface.name"
        />
    ),
    extensionId: 'robotface',
    iconURL: robotfaceImage,
    description: (
        <FormattedMessage
            defaultMessage="人脸识别."
            description="Description for the 'robotface' extension"
            id="gui.extension.robotface.description"
        />
    ),
    tags: ['main'],
    featured: true
};

const robotColorplaceExtension = {
    name: (
        <FormattedMessage
            defaultMessage="颜色位置追踪"
            description="Name for the 'robotcolorplace' extension"
            id="gui.extension.robotcolorplace.name"
        />
    ),
    extensionId: 'robotcolorplace',
    iconURL: robotcolorplaceImage,
    description: (
        <FormattedMessage
            defaultMessage="颜色位置追踪."
            description="Description for the 'robotcolorplace' extension"
            id="gui.extension.robotcolorplace.description"
        />
    ),
    tags: ['main'],
    featured: true
};

const robotColorxyExtension = {
    name: (
        <FormattedMessage
            defaultMessage="颜色坐标追踪"
            description="Name for the 'robotcolorxy' extension"
            id="gui.extension.robotcolorxy.name"
        />
    ),
    extensionId: 'robotcolorxy',
    iconURL: robotcolorxyImage,
    description: (
        <FormattedMessage
            defaultMessage="颜色坐标追踪."
            description="Description for the 'robotcolorxy' extension"
            id="gui.extension.robotcolorxy.description"
        />
    ),
    tags: ['main'],
    featured: true
};

const robotCatExtension = {
    name: (
        <FormattedMessage
            defaultMessage="猫脸识别"
            description="Name for the 'robotcat' extension"
            id="gui.extension.robotcat.name"
        />
    ),
    extensionId: 'robotcat',
    iconURL: robotcatImage,
    description: (
        <FormattedMessage
            defaultMessage="猫脸识别."
            description="Description for the 'robotcat' extension"
            id="gui.extension.robotcat.description"
        />
    ),
    tags: ['main'],
    featured: true
};

const robotTrafficExtension = {
    name: (
        <FormattedMessage
            defaultMessage="路标识别"
            description="Name for the 'robottraffic' extension"
            id="gui.extension.robottraffic.name"
        />
    ),
    extensionId: 'robottraffic',
    iconURL: robottrafficImage,
    description: (
        <FormattedMessage
            defaultMessage="路标识别."
            description="Description for the 'robottraffic' extension"
            id="gui.extension.robottraffic.description"
        />
    ),
    tags: ['main'],
    featured: true
};


const bricksMotorExtension = {
    name: (
        <FormattedMessage
            defaultMessage="电机"
            description="Name for the 'motor' extension"
            id="gui.extension.bricksmotor.name"
        />
    ),
    extensionId: 'bricksmotor',
    iconURL: bricksMotorImage, 
    insetIconURL: bricksMotorInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="电机."
            description="Description for the 'bricksmotor' extension"
            id="gui.extension.bricksmotor.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const bricksTwoMotorExtension = {
    name: (
        <FormattedMessage
            defaultMessage="运动"
            description="Name for the 'brickstwomotor' extension"
            id="gui.extension.brickstwomotor.name"
        />
    ),
    extensionId: 'brickstwomotor',
    iconURL: bricksTwoMotorImage, 
    insetIconURL: bricksTwoMotorInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="运动."
            description="Description for the 'brickstwomotor' extension"
            id="gui.extension.brickstwomotor.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const bricksLightExtension = {
    name: (
        <FormattedMessage
            defaultMessage="声光"
            description="Name for the 'brickslight' extension"
            id="gui.extension.brickslight.name"
        />
    ),
    extensionId: 'brickslight',
    iconURL: bricksLightImage, 
    insetIconURL: bricksLightInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="声光."
            description="Description for the 'brickslight' extension"
            id="gui.extension.brickslight.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const bricksSensorsExtension = {
    name: (
        <FormattedMessage
            defaultMessage="传感器"
            description="Name for the 'brickssensors' extension"
            id="gui.extension.brickssensors.name"
        />
    ),
    extensionId: 'brickssensors',
    iconURL: bricksSensorsImage, 
    insetIconURL: bricksSensorsInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="传感器."
            description="Description for the 'brickssensors' extension"
            id="gui.extension.brickssensors.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const bricksEventExtension = {
    name: (
        <FormattedMessage
            defaultMessage="事件"
            description="Name for the 'bricksevent' extension"
            id="gui.extension.bricksevent.name"
        />
    ),
    extensionId: 'bricksevent',
    iconURL: bricksEventImage, 
    insetIconURL: bricksEventInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="事件."
            description="Description for the 'bricksevent' extension"
            id="gui.extension.bricksevent.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const robotMoveExtension = {
    name: (
        <FormattedMessage
            defaultMessage="运动"
            description="Name for the 'robotmove' extension"
            id="gui.extension.robotmove.name"
        />
    ),
    extensionId: 'robotmove',
    iconURL: robotmoveImage, 
    insetIconURL: robotmoveInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="运动."
            description="Description for the 'robotmove' extension"
            id="gui.extension.robotmove.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const robotSensorsExtension = {
    name: (
        <FormattedMessage
            defaultMessage="传感器"
            description="Name for the 'robotsensors' extension"
            id="gui.extension.robotsensors.name"
        />
    ),
    extensionId: 'robotsensors',
    iconURL: robotsensorsImage, 
    insetIconURL: robotsensorsInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="传感器."
            description="Description for the 'robotsensors' extension"
            id="gui.extension.robotsensors.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const robotEventExtension = {
    name: (
        <FormattedMessage
            defaultMessage="事件"
            description="Name for the 'robotevent' extension"
            id="gui.extension.robotevent.name"
        />
    ),
    extensionId: 'robotevent',
    iconURL: roboteventImage, 
    insetIconURL: roboteventInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="事件."
            description="Description for the 'robotevent' extension"
            id="gui.extension.robotevent.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const robotWifiExtension = {
    name: (
        <FormattedMessage
            defaultMessage="wifi"
            description="Name for the 'robotwifi' extension"
            id="gui.extension.robotwifi.name"
        />
    ),
    extensionId: 'robotwifi',
    iconURL: robotwifiImage, 
    insetIconURL: robotwifiInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="wifi."
            description="Description for the 'robotwifi' extension"
            id="gui.extension.robotwifi.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const robotEmoteExtension = {
    name: (
        <FormattedMessage
            defaultMessage="emote"
            description="Name for the 'robotemote' extension"
            id="gui.extension.robotemote.name"
        />
    ),
    extensionId: 'robotemote',
    iconURL: robotemoteImage, 
    insetIconURL: robotemoteInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="emote."
            description="Description for the 'robotemote' extension"
            id="gui.extension.robotemote.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const robotShowExtension = {
    name: (
        <FormattedMessage
            defaultMessage="show"
            description="Name for the 'robotshow' extension"
            id="gui.extension.robotshow.name"
        />
    ),
    extensionId: 'robotshow',
    iconURL: robotshowImage, 
    insetIconURL: robotshowInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="show."
            description="Description for the 'robotshow' extension"
            id="gui.extension.robotshow.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const robotSoundExtension = {
    name: (
        <FormattedMessage
            defaultMessage="sound"
            description="Name for the 'robotsound' extension"
            id="gui.extension.robotsound.name"
        />
    ),
    extensionId: 'robotsound',
    iconURL: robotsoundImage, 
    insetIconURL: robotsoundInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="sound."
            description="Description for the 'robotsound' extension"
            id="gui.extension.robotsound.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const robotActuatorExtension = {
    name: (
        <FormattedMessage
            defaultMessage="actuator"
            description="Name for the 'robotactuator' extension"
            id="gui.extension.robotactuator.name"
        />
    ),
    extensionId: 'robotactuator',
    iconURL: robotactuatorImage, 
    insetIconURL: robotactuatorInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="actuator."
            description="Description for the 'robotactuator' extension"
            id="gui.extension.robotactuator.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const robotBleExtension = {
    name: (
        <FormattedMessage
            defaultMessage="ble"
            description="Name for the 'robotble' extension"
            id="gui.extension.robotble.name"
        />
    ),
    extensionId: 'robotble',
    iconURL: robotbleImage, 
    insetIconURL: robotbleInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="ble."
            description="Description for the 'robotble' extension"
            id="gui.extension.robotble.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const deepseekExtension = {
    name: (
        <FormattedMessage
            defaultMessage="deepseek"
            description="Name for the 'deepseek' extension"
            id="gui.extension.deepseek.name"
        />
    ),
    extensionId: 'deepseek',
    iconURL: deepseekImage, 
    insetIconURL: deepseekInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="deepseek."
            description="Description for the 'deepseek' extension"
            id="gui.extension.deepseek.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};

const microbitExtension = {
    name: 'Micro:bit',
    extensionId: 'MicrobitIcreate',
    collaborator: 'ICreatRobot',
    iconURL: ICmicrobitIconURL,
    insetIconURL: ICmicrobitInsetIconURL,
    description: (
        <FormattedMessage
            defaultMessage="I create world!"
            description="Description for the 'micro:bit' extension"
            id="gui.extension.MicrobitIcreate.name"
        />
    ),
    tags: ['scratch'],
    featured: true,
    disabled: false,
    bluetoothRequired: false,
    internetConnectionRequired: false,
    launchPeripheralConnectionFlow: false,
    useAutoScan: false,
    connectionIconURL: ICmicrobitConnectionIconURL,
    connectionSmallIconURL: ICmicrobitConnectionSmallIconURL,
    connectingMessage: (
        <FormattedMessage
            defaultMessage="Connecting"
            description=""
            id="gui.extension.MicrobitIcreate.description"
        />
    )
};

const microbitPeripheralExtension = {
    name: 'Micro:bit-外设',
    extensionId: 'MicrobiteIcreateP',
    collaborator: 'ICreatRobot',
    iconURL: ICmicrobitIconURL,
    insetIconURL: ICmicrobitInsetIconURL,
    description: (
        <FormattedMessage
            defaultMessage="I create world!"
            description="Description for the 'micro:bit' extension"
            id="gui.extension.MicrobiteIcreateP.name"
        />
    ),
    tags: ['scratch'],
    featured: true,
    disabled: false,
    bluetoothRequired: false,
    internetConnectionRequired: false,
    launchPeripheralConnectionFlow: false,
    useAutoScan: true,
    connectionIconURL: ICmicrobitConnectionIconURL,
    connectionSmallIconURL: ICmicrobitConnectionSmallIconURL,
    connectingMessage: (
        <FormattedMessage
            defaultMessage="Connecting"
            description=""
            id="gui.extension.MicrobiteIcreateP.description"
        />
    )
};

const robotExtendExtension = {
    name: (
        <FormattedMessage
            defaultMessage="External Microbit"
            description="Name for the 'robotextend' extension"
            id="gui.extension.robotextend.name"
        />
    ),
    extensionId: 'robotextend',
    iconURL: robotactuatorImage, 
    insetIconURL: robotactuatorInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="External Microbit."
            description="Description for the 'robotextend' extension"
            id="gui.extension.robotextend.description"
        />
    ),
    tags: ['scratch'],
    featured: true
};



export {
    robotTeachableExtension,
    robotImgExtension,
    robotApriltagExtension,
    robotColordeteExtension,
    robotQrExtension,
    robotGoodExtension,
    robotFaceExtension,
    robotColorplaceExtension,
    robotColorxyExtension,
    robotCatExtension,
    robotTrafficExtension,

    bricksMotorExtension,
    bricksTwoMotorExtension,
    bricksLightExtension,
    bricksSensorsExtension,
    bricksEventExtension,
    robotMoveExtension,
    robotSensorsExtension,
    robotEventExtension,
    robotWifiExtension,
    robotEmoteExtension,
    robotShowExtension,
    robotSoundExtension,
    robotActuatorExtension,
    robotBleExtension,
    deepseekExtension,
    microbitExtension,
    microbitPeripheralExtension,
    robotExtendExtension
};