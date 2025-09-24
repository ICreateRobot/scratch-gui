import codeModule from '../../../../../utils/global.js';
import { setIsCode,getIsCode } from '../../../../../utils/whatModule.js';

import { setBlock } from '../../../../../utils/isAddMaster.js';

import {setLan,getLan} from '../../../../../utils/lanMode.js'
import { getIsRobot ,getDelete,setDelete,getCurrent, getDeletedCate,setDeletedCate,delCategro,getHiddenBlocks,setHiddenBlocks,delHiddenBlocks,getShowCodeDb,getAllLoaded,getLoadExtension} from 'scratch-gui/src/components/utils/utils.js';
import {injectExtensionBlockTheme, injectExtensionCategoryTheme} from '../../lib/themes/blockHelpers';
import makeToolboxXML from '../../lib/make-toolbox-xml';
// ================== 核心逻辑 ==================
export function createBlocksLogic(componentInstance) {
    const self = componentInstance

    let downEnableCategories=['control','operators','variables','myBlocks','robot','bricks','Microbit']
    let isChangeMode=false
    // let mode=!getShowCodeDb()
    const channelMode=new BroadcastChannel('mode')

    channelMode.addEventListener('message',(event)=>{
        if((self.mode==event.data) && (self.currentDevice==getCurrent())) return
        if(self.mode!=event.data){
            isChangeMode=true
        }else{
            isChangeMode=false
        }
        console.log('改变了模式')
        self.mode=event.data
        self.currentDevice=getCurrent()
        if(getCurrent()=='ICRobot'){

            if(!self.mode){
                // let index = this.deletedCategoriesID.indexOf('robotwifi');
                // if (index !== -1) {
                //     this.deletedCategoriesID.splice(index, 1);
                // }
                

                //恢复
                let toMoveCategory=['robotwifi','robotcat']
                for (let i = getDeletedCate().length - 1; i >= 0; i--) {
                    if (toMoveCategory.includes( getDeletedCate()[i])) {
                        delCategro(i,1)
                    }
                }
                let toMove=['robotsensors_asrStart','robotsensors_asrStop','robotsensors_asrResult','robotevent_when','robotimg_isCat','robotimg_catNum','robotimg_catPlace','robotimg_isOpenModel']
                for (let i = getHiddenBlocks().length - 1; i >= 0; i--) {
                    if (toMove.includes( getHiddenBlocks()[i])) {
                        delHiddenBlocks(i,1)
                    }
                }


                //隐藏
                // this.hiddenBlocksTypes.push('robotcolordete_readColor')
                setHiddenBlocks('robotface_symFace')
                setHiddenBlocks('robotface_isSymFace')
                setHiddenBlocks('robotface_faceName')
                setHiddenBlocks('robotface_symFacePlace')
                // this.hiddenBlocksTypes.push('robotgood_isGood')
                // this.hiddenBlocksTypes.push('robotgood_goodPlace')
                setHiddenBlocks('robotimg_isTraffic')
                setHiddenBlocks('robotimg_trafficPlace')
                setHiddenBlocks('robotsensors_cstartsound')
                setHiddenBlocks('robotimg_cstartComputerCamera')
                setHiddenBlocks('robotimg_cstopComputerCamera')
                
                // this.hiddenBlocksTypes.push('robotimg_cstartCamera')
                setHiddenBlocks('robotqr_getQrPlace')
                setHiddenBlocks('robotqr_getQrWh')
                setHiddenBlocks('robotevent_whenPressed')
                setHiddenBlocks('robotimg_csetCamera')
                setHiddenBlocks('robotface_getFaceWh')
                // this.hiddenBlocksTypes.push('robotimg_getGoodWh')
                setHiddenBlocks('robotcolorxy_getColorWh')
                // this.hiddenBlocksTypes.push('robotimg_whatPlaceColor')
                setHiddenBlocks('robotimg_cstartNetCamera')
                setHiddenBlocks('robotimg_isOpenCamera')
                setHiddenBlocks('robotsound_playLocalMusic')
                setHiddenBlocks('robotimg_howStartCamera')
                // setHiddenBlocks('robotsound_selectSound')
                
                
                setDeletedCate('robotcolordete');
                setDeletedCate('robotcolorplace');
                setDeletedCate('robotgood');
                setDeletedCate('robottraffic');
                // this.hiddenBlocksTypes.push('robotimg_isApril')
                // this.hiddenBlocksTypes.push('robotimg_getAprilContent')
                // this.hiddenBlocksTypes.push('robotimg_getAprilPlace')
                // this.hiddenBlocksTypes.push('robotimg_getAprilWh')
            }else{
                setDeletedCate('robotwifi')
                setDeletedCate('robotcat')
                // this.deletedCategoriesID.push('robotevent')
                setHiddenBlocks('robotsensors_asrStart')
                setHiddenBlocks('robotsensors_asrStop')
                setHiddenBlocks('robotsensors_asrResult')
                setHiddenBlocks('robotevent_when')

                setHiddenBlocks('robotimg_isCat')
                setHiddenBlocks('robotimg_catNum')
                setHiddenBlocks('robotimg_catPlace')
                setHiddenBlocks('robotimg_isOpenModel')

                let toMove=['robotface_symFace','robotface_isSymFace','robotface_faceName','robotface_symFacePlace','robotimg_isTraffic','robotimg_trafficPlace','robotsensors_cstartsound','robotimg_cstartComputerCamera','robotimg_cstopComputerCamera','robotqr_getQrPlace','robotqr_getQrWh','robotevent_whenPressed','robotimg_csetCamera','robotface_getFaceWh','robotcolorxy_getColorWh','robotimg_cstartNetCamera','robotimg_isOpenCamera','robotsound_playLocalMusic','robotimg_howStartCamera']
                for (let i = getHiddenBlocks().length - 1; i >= 0; i--) {
                    if (toMove.includes( getHiddenBlocks()[i])) {
                        delHiddenBlocks(i, 1);
                    }
                }

                let toMoveCategory=['robotcolordete','robotcolorplace','robotgood','robottraffic']
                for (let i = getDeletedCate().length - 1; i >= 0; i--) {
                    if (toMoveCategory.includes(getDeletedCate()[i])) {
                        delCategro(i, 1);
                    }
                }
                // this.hiddenBlocksTypes=[]
            }
        }else if(getCurrent()=='ICBricks'){
            if(!self.mode){

                let toMove=['brickstwomotor_speedmoveplace','brickssensors_colorSensor','brickssensors_colorRgb','brickssensors_colorLight','brickssensors_touch']
                for (let i = getHiddenBlocks().length - 1; i >= 0; i--) {
                    if (toMove.includes( getHiddenBlocks()[i])) {
                        delHiddenBlocks(i,1)
                    }
                }

            }else{
                
                setHiddenBlocks('brickstwomotor_speedmoveplace')
                setHiddenBlocks('brickssensors_colorSensor')
                setHiddenBlocks('brickssensors_colorRgb')
                setHiddenBlocks('brickssensors_colorLight')
                setHiddenBlocks('brickssensors_touch')

                // this.hiddenBlocksTypes=[]
            }
        }
        
        const toolboxDom = self.ScratchBlocks.Xml.textToDom(getToolboxXML())
        // console.log(toolboxDom)

        if(isChangeMode){
            if(!self.mode){
                // const children = toolboxDom.children;
                // for (let i = 0; i < children.length; i++) {
                //     console.log(children[i]);
                //     if(children[i].id){

                //     }
                // }


                const children = toolboxDom.children;
                

                for (let i = 0; i < children.length; i++) {
                    const id = children[i].id;

                    if(getDeletedCate().includes(id)) continue
                    if(id){
                        const match = downEnableCategories.some(cat =>
                            id === cat || id.startsWith(cat)
                        );

                        if (match) {
                            // ✅ id 与数组中的某个值相等或以其开头
                            // console.log('匹配：', id);
                            // 这里写你的操作...
                        } else {
                            // ❌ 不匹配
                            // console.log('不匹配：', id);
                            setDeletedCate(id);

                            // 这里写另一些操作...
                        }
                        if(id=='robotteachable'){
                            setDeletedCate(id);
                        }
                    }
                    
                }
            }else{


                const deleted = getDeletedCate();
                console.log(deleted)
                for (let i = deleted.length - 1; i >= 0; i--) {
                    const id = deleted[i];
                    if(!getLoadExtension().includes(id)) continue
                    console.log(id)
                    if(typeof id =='string'){
                        const match = downEnableCategories.some(cat =>
                            id === cat || id.startsWith(cat)
                        );
                        if (!match) {
                            console.log('不匹配', id);
                            
                            delCategro(i, 1);  // 安全地删除
                           
                        }
                        if(id=='robotteachable'){
                            delCategro(i, 1);
                            
                        }
                    }
                    
                }

            }
        }
        

        // 1. 获取当前 workspace 的完整 XML DOM
        const fullDom = self.ScratchBlocks.Xml.workspaceToDom(self.workspace);

        console.log(fullDom)
        // 2. 提取 <variables> 节点
        const variablesTags = fullDom.getElementsByTagName('variables');
        let variablesXml = '';

        if (variablesTags.length > 0) {
            // 3. 转为字符串
            const wrapper = document.createElement('xml');
            wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
            wrapper.appendChild(variablesTags[0].cloneNode(true));
            variablesXml = wrapper.outerHTML;
        }

        // 4. 传给函数
        self.onWorkspaceUpdate({ xml: variablesXml });
        // this.onWorkspaceUpdate(dataXML)
        // this.workspace.clear()
        // window.location.reload()
        if(!self.mode){
            // 创建初始块，不可删除
            const block = self.workspace.newBlock('event_when');
            console.log(block)
            block.initSvg();
            block.render();
            block.moveBy(200, 100);

            block.setDeletable(false);
            // block.setMovable(false);
        }

    })

    const channelLoadExtension = new BroadcastChannel('loadExtension')
    channelLoadExtension.addEventListener('message',async (event)=>{
        console.log(event.data)

        if(event.data.op=='remove'){
            await removeCategoryFromToolbox([
                event.data.id
            ]);
            self.onWorkspaceUpdate(self.dataXML)
            self.workspace.clear()
        }else{
            await restoreCategoriesToToolbox([
                event.data.id
            ]);
            self.onWorkspaceUpdate(self.dataXML)
            self.workspace.clear()
        }
            
    })

    const channel = new BroadcastChannel('extensionSecondly');
    channel.addEventListener('message', async (event) => {
        // console.log('恢复工具箱')
        if(event.data=='1'){
            console.log('11111111111111111111')
            await restoreCategoriesToToolbox([
                'bricksmotor',
                'brickslight',
                'brickssensors',
                'brickstwomotor'
            ]);
            self.onWorkspaceUpdate(self.dataXML)
            self.workspace.clear()
        }else if(event.data=='2'){
            console.log(getDeletedCate())
            if(self.mode){
                console.log('22222222222222')
                await restoreCategoriesToToolbox([
                        'robotmove',
                        'robotemote',
                        'robotshow',
                        'robotsound',
                        'robotactuator',
                        'robotsensors',
                        'robotimg',
                        'robotble',
                        // 'robotteachable',
                        'robotapriltag',
                        'robotcolordete',
                        'robotcolorplace',
                        'robotcolorxy',
                        'robotface',
                        'robotgood',
                        'robotqr',
                        'robottraffic',
                        'robotextend'
                ]);
                self.onWorkspaceUpdate(self.dataXML)
                self.workspace.clear()
            }else{
                console.log('33333333333333333')
                await restoreCategoriesToToolbox([
                        'robotmove',
                        'robotemote',
                        'robotshow',
                        'robotsound',
                        'robotactuator',
                        'robotsensors',
                        'robotimg',
                        'robotble',
                        // 'robotteachable',
                            'robotapriltag',
                        'robotcat',
                        'robotcolorxy',
                        'robotface',
                        'robotqr',
                        'robotextend'
                ]);
                self.onWorkspaceUpdate(self.dataXML)
                self.workspace.clear()
            }
            
        }else if(event.data=='3'){
                await restoreCategoriesToToolbox([
                'MicrobitIcreate',
                'MicrobiteIcreateP'

            ]);
            self.onWorkspaceUpdate(self.dataXML)
            self.workspace.clear()
            
        }

        if(!self.mode){
            // 创建初始块，不可删除
            const block = self.workspace.newBlock('event_when');
            console.log(block)
            block.initSvg();
            block.render();
            block.moveBy(200, 100);
    
            block.setDeletable(false);
            // block.setMovable(false);
        }
    })

    const oneExtension=new BroadcastChannel('oneExtension')
    
    oneExtension.addEventListener('message',async (event)=>{

        // console.log('+++++++++++++++')
        // console.log(this.deletedCategories)
        // console.log(this.deletedCategoriesID)
        // console.log(dataXML)
        if(!self.mode){
            // 创建初始块，不可删除
            const block = self.workspace.newBlock('event_when');
            console.log(block)
            block.initSvg();
            block.render();
            block.moveBy(200, 100);
    
            block.setDeletable(false);
            // block.setMovable(false);
        }
        if(event.data==1){
            console.log('4444444444444')
            await restoreCategoriesToToolbox([
                    'robotimg',
            ]);
        }
    })

    const channelMasterClose = new BroadcastChannel('master_close');
    channelMasterClose.addEventListener('message',async (event)=>{
        console.log(event.data)
        let close=event.data

        if(self.preClose[0] && !close[0]){
            await removeCategoryFromToolbox([
                'bricksmotor',
                'brickslight',
                'brickssensors',
                'brickstwomotor'
            ]);
            self.onWorkspaceUpdate(self.dataXML)
            self.workspace.clear()
        }else if(self.preClose[1] && !close[1]){


            await removeCategoryFromToolbox([
                'robotmove',
                'robotemote',
                'robotshow',
                'robotsound',
                'robotactuator',
                'robotsensors',
                'robotimg',
                'robotble',
                // 'robotteachable',
                'robotapriltag',
                'robotcat',
                'robotcolordete',
                'robotcolorplace',
                'robotcolorxy',
                'robotface',
                'robotgood',
                'robotqr',
                'robottraffic',
                'robotextend'
                
            ]);
            console.log(getDeletedCate())
            self.onWorkspaceUpdate(self.dataXML)
            self.workspace.clear()
        }else if(self.preClose[2] && !close[2]){


            await removeCategoryFromToolbox([
                'MicrobitIcreate',
                'MicrobiteIcreateP'
                
            ]);
            self.onWorkspaceUpdate(self.dataXML)
            self.workspace.clear()
        }
        self.preClose[0]=close[0]
        self.preClose[1]=close[1]
        self.preClose[2]=close[2]
    })


    function unindentCode(code) {
        // 将代码按行分割
        let lines = code.split('\n');
        
        // 使用map遍历每一行，先取消四个空格缩进，再检查并取消恰好两个空格的缩进
        const unindentedLines = lines.map(line => {
            // 记录原始行
            let originalLine = line;
            
            // 尝试取消四个空格的缩进
            let newLine = line.replace(/^\s{4}/, '');
            
            // 如果四个空格缩进已经被取消，检查是否有恰好两个空格的缩进
            if (newLine !== originalLine) {
            // 只有在四个空格缩进被取消后，才检查恰好两个空格的缩进
            newLine = newLine.replace(/^\s{2}(?! )/, '');
            }
            
            return newLine;
        });
    
    // 将处理后的行重新组合成一个字符串
    return unindentedLines.join('\n');
    }

    function indentPythonFunctions(code) {
        const lines = code.split('\n');
        let result = [];
        let inFunction = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
        
            if (line.trim().startsWith('def ')) {
            // 函数定义行
            inFunction = true;
            result.push(line); // 原样添加
            continue;
            }
        
            // 空行代表函数体结束
            if (line.trim() === '') {
            inFunction = false;
            result.push(line);
            continue;
            }
        
            // 缩进函数体（不在 def 行且处于函数中）
            if (inFunction) {
            result.push('    ' + line);
            } else {
            result.push(line);
            }
        }
        
        return result.join('\n');
    }
    






    function arraysAreEqual(arr1, arr2) {
        // 如果数组长度不同，直接返回 false
        if (arr1.length !== arr2.length) {
            return false;
        }

        // 比较每个元素
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }

        // 如果所有检查都通过，返回 true
        return true;
    }
    function findSecondTopParent(block) {
        let parentBlock = block.getParent();
        let secondTopParent = null;
        
        if (!parentBlock) {
            return false; // No parent block found
        }
        if(parentBlock.type == 'control_forever'){
            return true
        }
        
        while (parentBlock.getParent()) {
            secondTopParent = parentBlock;
            parentBlock = parentBlock.getParent();
            if(parentBlock.type == 'control_forever'){
            return true
            }
        }
        
        return false;
    }

    function workspaceToCode (event) {
        
        // console.log('--------------------')
        console.log(event.type)
        // console.log(this.workspace.blockDB_)
        if(event.type=='endDrag' || event.type=='change'){
            //绿旗能不能执行
            setBlock(false)
            let eventWhenBlocks = [];
            let code;
            // console.log(typeof this.workspace.blockDB_)
            console.log(self.workspace.blockDB_)

            for(let child in self.workspace.blockDB_){
                // console.log(this.workspace.blockDB_[child].type)
                if(self.workspace.blockDB_[child].type.startsWith('bricks')){
                    setBlock(true)
                }

                if (self.workspace.blockDB_[child].type === 'event_when' && !self.mode) {
                    self.workspace.blockDB_[child].setDeletable(false);
                }

                // 查找 event_when 块
                if (self.workspace.blockDB_[child].type === 'event_when') {
                    eventWhenBlocks.push(self.workspace.blockDB_[child]);
                }

                
                // console.log(this.findSecondTopParent(this.workspace.blockDB_[child]))
                // if(this.findSecondTopParent(this.workspace.blockDB_[child])){
                //     if(this.workspace.blockDB_[child].type.startsWith('robotimg') && this.findSecondTopParent(this.workspace.blockDB_[child]).type=='control_forever'){
                //         this.workspace.blockDB_[child].dispose()
                //     }
                // }

                // if(this.workspace.blockDB_[child].type.startsWith('robotimg_c') && this.findSecondTopParent(this.workspace.blockDB_[child])){
                //     this.workspace.blockDB_[child].dispose()
                // }


                
            }


            if(!self.mode){
                console.log('+++++++++++++',eventWhenBlocks)
                // 超过一个时，删除多余的小绿旗块
                if (eventWhenBlocks.length > 1) {
                    for (let i = 1; i < eventWhenBlocks.length; i++) {
                        eventWhenBlocks[i].dispose();
                    }
                }

                if (eventWhenBlocks.length === 0) {
                    // 创建初始块，不可删除
                    const block = self.workspace.newBlock('event_when');
                    console.log(block)
                    block.initSvg();
                    block.render();
                    block.moveBy(200, 100);

                    block.setDeletable(false);
                }
            }else{
                console.log('---------------------')
                if (eventWhenBlocks.length > 0) {
                    for (let i = 0; i < eventWhenBlocks.length; i++) {
                        eventWhenBlocks[i].dispose();
                    }
                }
            }
            

            try {
                const generatorName = getLan();
                console.log('language',generatorName)
                // alert(this.ScratchBlocks.Python.workspaceToCode())
                code = self.ScratchBlocks[generatorName].workspaceToCode(self.workspace);
                console.log(code)
                // setCode(code)
                // console.log(code)
                // console.log(this.unindentCode(code))
                
                codeModule.setCode(indentPythonFunctions(unindentCode(code)))
                // console.log(code)
                
                // alert(getCode())
            } catch (e) {
                code = e.message;
                // console.log(code)
            }

            // const generatorName = 'Lua';
            // code = this.ScratchBlocks[generatorName].workspaceToCode(this.workspace);
            
            // codeModule.setCode(code)
            // console.log(code)
            
            // // alert(getCode())
            return code;
        }
        return ''
        
    }

    async function removeCategoryFromToolbox(categoriesToRemove) {
        console.log('执行了移除函数')
        const runtime =self.props.vm.runtime
        // console.log(runtime)
        try {
            const toolboxXML = getToolboxXML();
            const toolboxDom = self.ScratchBlocks.Xml.textToDom(toolboxXML);

            const categories = toolboxDom.getElementsByTagName('category');
            
            // Collect categories to remove
            for (let category of categories) {
                if (categoriesToRemove.includes(category.getAttribute('id'))) {
                    setDeletedCate(category);
                    setDeletedCate(category.getAttribute('id'))
                }
            }

            // setDelete(this.deletedCategoriesID)
            // Remove all matched categories
            // this.deletedCategories.forEach(category => {
            //     toolboxDom.removeChild(category);
            // });

            // const toolboxXMLUpdate = this.getToolboxXML();
            // const toolboxDomUpdate = this.ScratchBlocks.Xml.textToDom(toolboxXMLUpdate);

            
            // const updatedToolboxXML = this.ScratchBlocks.Xml.domToText(toolboxDomUpdate);
            // // console.log(updatedToolboxXML)
            // this.props.updateToolboxState(updatedToolboxXML);


            // console.log(this.getToolboxXML())

        } catch (error) {
            console.error('Error removing categories from toolbox', error);
        }
    }

    async function restoreCategoriesToToolbox(categoriesToRestore) {
        console.log('执行了恢复函数')
        try {
            
    
            // this.deletedCategoriesID = this.deletedCategoriesID.filter(item => !categoriesToRestore.includes(item));
            // this.deletedCategories = this.deletedCategories.filter(item => !categoriesToRestore.includes(item.id));

            // console.log('head:'+this.deletedCategoriesID)
            for (let i = getDeletedCate().length - 1; i >= 0; i--) {
                if (categoriesToRestore.includes(getDeletedCate()[i])) {
                    // console.log('删除了'+this.deletedCategoriesID[i])
                    delCategro(i, 1);
                }
                // setDelete(this.deletedCategoriesID)
            }
            // console.log(categoriesToRestore)
            // console.log(this.deletedCategoriesID)
            

            // for (let i = this.deletedCategories.length - 1; i >= 0; i--) {
            //     if (categoriesToRestore.includes(this.deletedCategories[i].id)) {
            //         this.deletedCategories.splice(i, 1);
            //     }
            // }

            // console.log(this.deletedCategoriesID)

            // // 获取当前工具箱的 XML
            // const toolboxXML = this.getToolboxXML();
            // // console.log(toolboxXML)
            // const toolboxDom = this.ScratchBlocks.Xml.textToDom(toolboxXML);


            // 遍历传入的类别 ID 列表
            // categoriesToRestore.forEach(categoryId => {
            //     // 根据 ID 查找已删除的类别
            //     const categoryToRestore = this.deletedCategories.find(category => category.getAttribute('id') === categoryId);
    
            //     if (categoryToRestore) {
            //         // 恢复该类别
            //         toolboxDom.appendChild(categoryToRestore);
            //         console.log(`Category ${categoryId} restored to toolbox.`);
            //     } else {
            //         console.error(`Category with id ${categoryId} not found in deleted categories.`);
            //     }
            // });
    
            // // 将修改后的 DOM 转回 XML，并更新工具箱
            // const updatedToolboxXML = this.ScratchBlocks.Xml.domToText(toolboxDom);
            // this.props.updateToolboxState(updatedToolboxXML);
    
        } catch (error) {
            console.error('Error restoring categories to toolbox', error);
        }
    }

    function getToolboxXML () {
        // Use try/catch because this requires digging pretty deep into the VM
        // Code inside intentionally ignores several error situations (no stage, etc.)
        // Because they would get caught by this try/catch
        try {
            let {editingTarget: target, runtime} = self.props.vm;
            const stage = runtime.getTargetForStage();
            if (!target) target = stage; // If no editingTarget, use the stage

            const stageCostumes = stage.getCostumes();
            const targetCostumes = target.getCostumes();
            const targetSounds = target.getSounds();
            let dynamicBlocksXML = injectExtensionCategoryTheme(
                self.props.vm.runtime.getBlocksXML(target),
                self.props.theme
            );
            try{
                console.log(getDeletedCate())
                dynamicBlocksXML = dynamicBlocksXML.filter(category => {
                    // console.log(category.id)
                    return !getDeletedCate().includes(category.id); // 保留未删除的类别
                });

                // 过滤掉需要隐藏的块类型
                dynamicBlocksXML = dynamicBlocksXML.map(category => {
                    // 解析 category.xml 为 DOM 对象
                    const parser = new DOMParser();
                    const categoryDom = parser.parseFromString(category.xml, 'application/xml');
                    
                    // 获取所有的 block 元素
                    const blocks = categoryDom.getElementsByTagName('block');
                    
                    
                        // 倒序遍历并删除匹配的 block
                    for (let i = blocks.length - 1; i >= 0; i--) {
                        const block = blocks[i];
                        if (getHiddenBlocks().includes(block.getAttribute('type'))) {
                            // console.log(block.getAttribute('type') + ' 已被删除');
                            block.remove();
                        }
                    }


                    
                    
                    // 将修改后的 DOM 转回 XML 字符串
                    category.xml = new XMLSerializer().serializeToString(categoryDom.documentElement);

                    return category;
                });

                // console.log(this.deletedCategoriesID)
                // console.log(this.hiddenBlocksTypes)
            }catch(e){
                console.log(e)
            }

            // dynamicBlocksXML = processDynamicBlocksXML(dynamicBlocksXML);

            return makeToolboxXML(false, target.isStage, target.id, dynamicBlocksXML,
                targetCostumes[targetCostumes.length - 1].name,
                stageCostumes[stageCostumes.length - 1].name,
                targetSounds.length > 0 ? targetSounds[targetSounds.length - 1].name : '',
                self.props.theme.getBlockColors()
            );
        } catch {
            return null;
        }
    }

    
    return {
       channelMode,
       channelLoadExtension,
       channel,
       oneExtension,
       channelMasterClose,
       unindentCode,
       indentPythonFunctions,
       arraysAreEqual,
       findSecondTopParent,
       workspaceToCode,
       removeCategoryFromToolbox,
       restoreCategoriesToToolbox,
       getToolboxXML,
    };
}
