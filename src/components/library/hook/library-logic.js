// library-logic-handler.js
import { 
    getIsMaster, setIsMaster, addLoadExtension, delLoadExtension,
    getLoadExtension, getAllLoaded, setAllLoaded, setIsLoad 
} from 'scratch-gui/src/components/utils/utils.js';
import { setContent } from '../../../../../../utils/updataExtension.js';
import axios from 'axios';
import {APP_NAME} from '../../../lib/brand.js';

// 全局变量（原来在组件里的）
export const HIDDEN_EXTENSIONS = [
    'bricksmotor','brickstwomotor','brickslight','brickssensors','bricksevent',
    'robotmove','robotsensors','robotevent','robotwifi','robotemote','robotshow',
    'robotsound','robotactuator','robotble','MicrobitIcreate','MicrobiteIcreateP',
    'robotextend'
];

let preKey = null;
let preSpeed = null;

let debounceTimer = null;
const keyPressTimestamps = {}; // 用于存储每个按键的上一次按下时间
const QUICK_PRESS_THRESHOLD = 500; // 定义快速按下的时间阈值（毫秒）
let allKeyPress=Date.now()
let allKeyUp=Date.now()
const pressedKeys = new Set();  // 用于记录当前按下的键
const keyState = {
    W: false, // W键是否按下
    A: false, // A键是否按下
    S: false, // S键是否按下
    D: false,  // D键是否按下
    R: false,  // R键是否按下
    B: false,
    C: false,
    E: false,
    F: false,
    G: false,
    H: false,
    I: false,
    J: false,
    K: false,
    L: false,
    M: false,
    N: false,
    O: false,
    P: false,
    Q: false,
    T: false,
    U: false,
    V: false,
    X: false,
    Y: false,
    Z: false,
};

// ================== 核心逻辑工厂 ==================
export function createLibraryLogic(componentInstance) {
    const self = componentInstance

    // 通道
    const oneExtension = new BroadcastChannel('oneExtension');
    const channelLoadExtension = new BroadcastChannel('loadExtension');
    const channelClose = new BroadcastChannel('closePage');
    const channelLoad = new BroadcastChannel('isLoading');
    const channelMasterClose = new BroadcastChannel('master_close')
    channelMasterClose.addEventListener('message',(event)=>{
        if(!event.data[1]){
            delLoadExtension('robotimg')
            delLoadExtension('robotapriltag')
            delLoadExtension('robotcat')
            delLoadExtension('robotcolordete')
            delLoadExtension('robotcolorplace')
            delLoadExtension('robotcolorxy')
            delLoadExtension('robotface')
            // delLoadExtension('robotgood')
            delLoadExtension('robotqr')
            delLoadExtension('robottraffic')
        }
        
    })

    channelClose.addEventListener('message',(event)=>{
        handleClose()
    })

    // 关闭
    function handleClose() {
        self.props.onRequestClose();
    }

    function sort(key){
    
        const currentTime = Date.now(); // 获取当前时间戳

        // 检查按键是否是快速按下
        if (keyPressTimestamps[key] && (currentTime - keyPressTimestamps[key] < QUICK_PRESS_THRESHOLD)) {
            // console.log(`${key} 被快速按下，忽略发送`);
            return; // 快速按下，忽略本次操作
        }

        // console.log(currentTime - allKeyPress)
        if (allKeyPress && (currentTime - allKeyPress < 300)) {
            // console.log(`按键被快速按下，忽略发送`);
            allKeyPress=currentTime
            return; // 快速按下，忽略本次操作
        }

        allKeyPress=currentTime

        

        // 更新按键的上一次按下时间
        


        // for (let Key in keyPressTimestamps) {
        //     if (keyPressTimestamps.hasOwnProperty(Key)) {  // 确保是对象自身的属性，而不是继承的属性
        //     //   console.log(key, keyPressTimestamps[key]);
        //         if(Key!=key && currentTime - keyPressTimestamps[Key] <700){
        //             return
        //         }
        //     }
        //   }

        keyPressTimestamps[key] = currentTime;


        switch (key) {
            case 'w':
            case 'W':
                keyState.W = true;
                this.sendMove('w',1)
                break;
            case 'a':
            case 'A':
                keyState.A = true;
                this.sendMove('a',1)
                break;
            case 's':
            case 'S':
                keyState.S = true;
                this.sendMove('s',1)
                break;
            case 'd':
            case 'D':
                keyState.D = true;
                this.sendMove('d',1)
                break;
            case 'r':
            case 'R':
                keyState.R = true;
                this.sendMove('r',1)
                break;
            case 'b':
            case 'B':
                keyState.B = true;
                this.sendMove('b',1)
                break;
            case 'c':
            case 'C':
                keyState.C = true;
                this.sendMove('c',1)
                break;
            case 'e':
            case 'E':
                keyState.E = true;
                this.sendMove('e',1)
                break;
            case 'f':
            case 'F':
                keyState.F = true;
                this.sendMove('f',1)
                break;
            case 'g':
            case 'G':
                keyState.G = true;
                this.sendMove('g',1)
                break;
            case 'h':
            case 'H':
                keyState.H = true;
                this.sendMove('h',1)
                break;
            case 'i':
            case 'I':
                keyState.I = true;
                this.sendMove('i',1)
                break;
            case 'j':
            case 'J':
                keyState.J = true;
                this.sendMove('j',1)
                break;
            case 'k':
            case 'K':
                keyState.K = true;
                this.sendMove('k',1)
                break;
            case 'l':
            case 'L':
                keyState.L = true;
                this.sendMove('l',1)
                break;
            case 'm':
            case 'M':
                keyState.M = true;
                this.sendMove('m',1)
                break;
            case 'n':
            case 'N':
                keyState.N = true;
                this.sendMove('n',1)
                break;
            case 'o':
            case 'O':
                keyState.O = true;
                this.sendMove('o',1)
                break;
            case 'p':
            case 'P':
                keyState.P = true;
                this.sendMove('p',1)
                break;

            case 'q':
            case 'Q':
                keyState.Q = true;
                this.sendMove('q',1)
                break;
            case 't':
            case 'T':
                keyState.T = true;
                this.sendMove('t',1)
                break;
            case 'u':
            case 'U':
                keyState.U = true;
                this.sendMove('u',1)
                break;
            case 'v':
            case 'V':
                keyState.V = true;
                this.sendMove('v',1)
                break;
            case 'x':
            case 'X':
                keyState.X = true;
                this.sendMove('x',1)
                break;
            case 'y':
            case 'Y':
                keyState.Y = true;
                this.sendMove('y',1)
                break;
            case 'z':
            case 'Z':
                keyState.Z = true;
                this.sendMove('z',1)
                break;
            default:
                // 其他按键不处理
                break;
        }
    
    }

    // 选择扩展
    function handleSelect(filteredData, id) {
        if (getAllLoaded().includes(filteredData[id].extensionId)) {
            channelLoadExtension.postMessage({
                op: 'restore',
                id: filteredData[id].extensionId
            });
            addLoadExtension(filteredData[id].extensionId);
            handleClose();
        } else {
            if (filteredData[id].extensionId) {
                addLoadExtension(filteredData[id].extensionId);
                setAllLoaded(filteredData[id].extensionId);
            }
            oneExtension.postMessage(id);
            handleClose();
            self.props.onItemSelected(filteredData[id]);
            setIsMaster(false);
        }
    }

    // 发送移动命令
    async function sendMove(dir, speed) {
        if (dir === preKey && speed === preSpeed) return;
        preKey = dir;
        preSpeed = speed;

        fetch(`http://192.168.4.1:8080/move?move=${dir}&speed=${speed}`, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json;' }
        }).catch(console.error);
    }

    // 选择文件
    function handleTest() {
        let input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        input.click();
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = async function (event) {
                const fileContent = await event.target.result;
                setContent(fileContent);
            };
            reader.readAsText(file);
        });
    }

    // 在线更新
    function handleOnline() {
        const fileUrl = 'http://8.130.129.159:9000/test/index.js';
        fetch(fileUrl, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        })
            .then(res => res.text())
            .then(data => setContent(data))
            .catch(console.error);
    }

    // 初始化定时器逻辑（原来在 componentDidMount 里）
    function initExtensionLoader(getFilteredData, getHiddenData) {
        setTimeout(() => {
            fetch('http://localhost:3000/get-extension')
                .then(response => {
                    if (response.ok) return response.text();
                    throw new Error('请求失败，状态码：' + response.status);
                })
                .then(extension => {
                    if (extension == 1 && getIsMaster()) {
                        self.props.onItemSelected(getHiddenData()[0]);
                        self.props.onItemSelected(getHiddenData()[1]);
                        self.props.onItemSelected(getHiddenData()[2]);
                        self.props.onItemSelected(getHiddenData()[3]);
                        oneExtension.postMessage(3);
                        handleClose();
                        setIsMaster(false);
                        channelLoad.postMessage(false);
                        fetch('http://localhost:3000/set-extension', {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain' },
                            body: 0
                        });
                    } else if (extension == 2 && getIsMaster()) {
                        self.props.onItemSelected(getHiddenData()[5]);
                        self.props.onItemSelected(getHiddenData()[10]);
                        self.props.onItemSelected(getHiddenData()[11]);
                        self.props.onItemSelected(getHiddenData()[12]);
                        self.props.onItemSelected(getHiddenData()[6]);
                        self.props.onItemSelected(getHiddenData()[16]);
                        self.props.onItemSelected(getFilteredData()[1]);
                        self.props.onItemSelected(getFilteredData()[2]);
                        self.props.onItemSelected(getFilteredData()[3]);
                        self.props.onItemSelected(getFilteredData()[4]);
                        self.props.onItemSelected(getFilteredData()[6]);
                        self.props.onItemSelected(getFilteredData()[7]);
                        self.props.onItemSelected(getFilteredData()[8]);
                        self.props.onItemSelected(getFilteredData()[9]);
                        self.props.onItemSelected(getFilteredData()[10]);

                        for (let i = 0; i < 10; i++) {
                            console.log(self.props)
                            console.log(self.props.data)
                            if (getAllLoaded().includes(self.props.data[i + 1].extensionId)) {
                                if (self.props.data[i + 1].extensionId === 'robotgood') continue;
                                channelLoadExtension.postMessage({
                                    op: 'restore',
                                    id: self.props.data[i + 1].extensionId
                                });
                                addLoadExtension(self.props.data[i + 1].extensionId);
                                handleClose();
                            } else {
                                if (self.props.data[i + 1].extensionId === 'robotgood') continue;
                                addLoadExtension(self.props.data[i + 1].extensionId);
                                setAllLoaded(self.props.data[i + 1].extensionId);
                            }
                        }
                        oneExtension.postMessage(8);
                        handleClose();
                        setIsMaster(false);
                        channelLoad.postMessage(false);
                        fetch('http://localhost:3000/set-extension', {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain' },
                            body: 0
                        });
                    } else if (extension == 3 && getIsMaster()) {
                        self.props.onItemSelected(getHiddenData()[14]);
                        self.props.onItemSelected(getHiddenData()[15]);
                        oneExtension.postMessage(15);
                        handleClose();
                        setIsMaster(false);
                        channelLoad.postMessage(false);
                        fetch('http://localhost:3000/set-extension', {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain' },
                            body: 0
                        });
                    }
                })
                .catch(console.error);
        }, 500);
    }

    function getHiddenData() {
        const filteredData = self.props.data.filter(item => 
            item === '---' ||  // 保留分隔符
            (typeof item === 'object' && 
            HIDDEN_EXTENSIONS.includes(item.extensionId))
        );
    

        // When filtering, favorites are just listed first, not in a separate section.
        const favoriteItems = [];
        const nonFavoriteItems = [];
        for (const dataItem of filteredData) {
            if (dataItem === '---') {
                // ignore
            } else if (self.state.initialFavorites.includes(dataItem[self.props.persistableKey])) {
                favoriteItems.push(dataItem);
            } else {
                nonFavoriteItems.push(dataItem);
            }
        }

        let filteredItems = favoriteItems.concat(nonFavoriteItems);

        if (self.state.selectedTag !== 'all') {
            filteredItems = filteredItems.filter(dataItem => (
                dataItem.tags &&
                dataItem.tags.map(i => i.toLowerCase()).includes(self.state.selectedTag)
            ));
        }

        if (self.state.filterQuery) {
            filteredItems = filteredItems.filter(dataItem => {
                const search = [...dataItem.tags];
                if (dataItem.name) {
                    // Use the name if it is a string, else use formatMessage to get the translated name
                    if (typeof dataItem.name === 'string') {
                        search.push(dataItem.name);
                    } else {
                        search.push(self.props.intl.formatMessage(dataItem.name.props, {
                            APP_NAME
                        }));
                    }
                }
                if (dataItem.description) {
                    search.push(dataItem.description);
                }
                return search
                    .join('\n')
                    .toLowerCase()
                    .includes(self.state.filterQuery.toLowerCase());
            });
        }

        return filteredItems;
    }
    //覆盖上面同名方法，用于过滤某些指定扩展
    function getFilteredData () {

        console.log(self.props.data)

            // 添加过滤条件排除指定扩展
            const filteredData = self.props.data.filter(item => 
                item === '---' ||  // 保留分隔符
                (typeof item === 'object' && 
                !HIDDEN_EXTENSIONS.includes(item.extensionId))
            );
        
        // When no filtering, favorites get their own section
        if (self.state.selectedTag === 'all' && !self.state.filterQuery) {
            const favoriteItems = filteredData
                .filter(dataItem => (
                    self.state.initialFavorites.includes(dataItem[self.props.persistableKey])
                ))
                .map(dataItem => ({
                    ...dataItem,
                    key: `favorite-${dataItem[self.props.persistableKey]}`
                }));

            if (favoriteItems.length) {
                favoriteItems.push('---');
            }

            return [
                ...favoriteItems,
                ...filteredData
            ];
        }

        // When filtering, favorites are just listed first, not in a separate section.
        const favoriteItems = [];
        const nonFavoriteItems = [];
        for (const dataItem of filteredData) {
            if (dataItem === '---') {
                // ignore
            } else if (self.state.initialFavorites.includes(dataItem[self.props.persistableKey])) {
                favoriteItems.push(dataItem);
            } else {
                nonFavoriteItems.push(dataItem);
            }
        }

        let filteredItems = favoriteItems.concat(nonFavoriteItems);

        if (self.state.selectedTag !== 'all') {
            filteredItems = filteredItems.filter(dataItem => (
                dataItem.tags &&
                dataItem.tags.map(i => i.toLowerCase()).includes(self.state.selectedTag)
            ));
        }

        if (self.state.filterQuery) {
            filteredItems = filteredItems.filter(dataItem => {
                const search = [...dataItem.tags];
                if (dataItem.name) {
                    // Use the name if it is a string, else use formatMessage to get the translated name
                    if (typeof dataItem.name === 'string') {
                        search.push(dataItem.name);
                    } else {
                        search.push(self.props.intl.formatMessage(dataItem.name.props, {
                            APP_NAME
                        }));
                    }
                }
                if (dataItem.description) {
                    search.push(dataItem.description);
                }
                return search
                    .join('\n')
                    .toLowerCase()
                    .includes(self.state.filterQuery.toLowerCase());
            });
        }

        return filteredItems;
    }

    return {
        oneExtension,
        channelLoadExtension,
        channelClose,
        channelLoad,
        handleClose,
        handleSelect,
        sendMove,
        handleTest,
        handleOnline,
        initExtensionLoader,
        channelMasterClose,
        sort,
        getHiddenData,
        getFilteredData
    };
}
