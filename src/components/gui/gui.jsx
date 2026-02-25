import classNames from 'classnames';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import MediaQuery from 'react-responsive';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import tabStyles from 'react-tabs/style/react-tabs.css';
import VM from 'scratch-vm';

import Blocks from '../../containers/blocks.jsx';
import CostumeTab from '../../containers/costume-tab.jsx';
import TargetPane from '../../containers/target-pane.jsx';
import SoundTab from '../../containers/sound-tab.jsx';
import StageWrapper from '../../containers/stage-wrapper.jsx';
import Loader from '../loader/loader.jsx';
import Box from '../box/box.jsx';
import MenuBar from '../menu-bar/menu-bar.jsx';
import CostumeLibrary from '../../containers/costume-library.jsx';
import BackdropLibrary from '../../containers/backdrop-library.jsx';
import Watermark from '../../containers/watermark.jsx';

import Backpack from '../../containers/backpack.jsx';
import BrowserModal from '../browser-modal/browser-modal.jsx';
import TipsLibrary from '../../containers/tips-library.jsx';
import Cards from '../../containers/cards.jsx';
import Alerts from '../../containers/alerts.jsx';
import DragLayer from '../../containers/drag-layer.jsx';
import ConnectionModal from '../../containers/connection-modal.jsx';
import TelemetryModal from '../telemetry-modal/telemetry-modal.jsx';
import TWUsernameModal from '../../containers/tw-username-modal.jsx';
import TWSettingsModal from '../../containers/tw-settings-modal.jsx';
import TWSecurityManager from '../../containers/tw-security-manager.jsx';
import TWCustomExtensionModal from '../../containers/tw-custom-extension-modal.jsx';
import TWRestorePointManager from '../../containers/tw-restore-point-manager.jsx';
import TWFontsModal from '../../containers/tw-fonts-modal.jsx';
import TWUnknownPlatformModal from '../../containers/tw-unknown-platform-modal.jsx';
import TWInvalidProjectModal from '../../containers/tw-invalid-project-modal.jsx';
import CodeMirrorComponent from 'scratch-gui/src/components/CodeMirrorComponent/CodeMirrorComponent.jsx';

import {STAGE_SIZE_MODES, FIXED_WIDTH, UNCONSTRAINED_NON_STAGE_WIDTH} from '../../lib/layout-constants';
import {resolveStageSize} from '../../lib/screen-utils';
import {Theme} from '../../lib/themes';

import {isRendererSupported, isBrowserSupported} from '../../lib/tw-environment-support-prober';

import styles from './gui.css';
import addExtensionIcon from './icon--extensions.svg';
import codeIcon from '!../../lib/tw-recolor/build!./icon--code.svg';
import costumesIcon from '!../../lib/tw-recolor/build!./icon--costumes.svg';
import soundsIcon from '!../../lib/tw-recolor/build!./icon--sounds.svg';

import LoadingOverlay from '../LoadingOverlay/LoadingOverlay.jsx';
import BurnLogs from 'scratch-gui/src/components/Burn-logs/BurnLogs.jsx';
import TrainPage from '../TrainPage/TrainPage.jsx';
import TabSwitcher from 'scratch-gui/src/components/TabSwitcher/TabSwitcher.jsx';
import { useGuiLogic } from '../hooks/gui-logic.js';
import ExampleModal from '../ExampleModal/ExampleModal.jsx'
import MasterModal from '../master-modal/MasterModal.jsx'
import ConnectTabs from 'scratch-gui/src/components/connect-modal/connectModal.jsx';
import FirmwareFlasher from "scratch-gui/src/components/FirmwareFlasher/FirmwareFlasher.jsx"
import importCode from './import.svg'
import importCodeRed from './importRed.svg'
import importCodeBlue from './importBlue.svg'
import importCodePurple from './importPurple.svg'
import codeModule from '../../../../../utils/global.js';

const messages = defineMessages({
    addExtension: {
        id: 'gui.gui.addExtension',
        description: 'Button to add an extension in the target pane',
        defaultMessage: 'Add Extension'
    }
});

const getFullscreenBackgroundColor = () => {
    const params = new URLSearchParams(location.search);
    if (params.has('fullscreen-background')) {
        return params.get('fullscreen-background');
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return '#111';
    }
    return 'white';
};

const fullscreenBackgroundColor = getFullscreenBackgroundColor();

const GUIComponent = props => {
    const {
        accountNavOpen,
        activeTabIndex,
        alertsVisible,
        authorId,
        authorThumbnailUrl,
        authorUsername,
        basePath,
        backdropLibraryVisible,
        backpackHost,
        backpackVisible,
        blocksId,
        blocksTabVisible,
        cardsVisible,
        canChangeLanguage,
        canChangeTheme,
        canCreateNew,
        canEditTitle,
        canManageFiles,
        canRemix,
        canSave,
        canCreateCopy,
        canShare,
        canUseCloud,
        children,
        connectionModalVisible,
        costumeLibraryVisible,
        costumesTabVisible,
        customStageSize,
        enableCommunity,
        intl,
        isCreating,
        isEmbedded,
        isFullScreen,
        isPlayerOnly,
        isRtl,
        isShared,
        isWindowFullScreen,
        isTelemetryEnabled,
        isTotallyNormal,
        loading,
        logo,
        renderLogin,
        onClickAbout,
        onClickAccountNav,
        onCloseAccountNav,
        onClickAddonSettings,
        onClickMaster,
        onClickConnect,
        onClickFirmware,
        onClickDesktopSettings,
        clickSerialConnect,
        download,
        SerialDownload,
        saveCode,
        loadCode,
        cancelload,
        clickBleConnect,
        clickDownloadCode,
        clickEspSend,
        clickSendWifi,
        onClickNewWindow,
        onClickPackager,
        onLogOut,
        onOpenRegistration,
        onToggleLoginOpen,
        onActivateCostumesTab,
        onActivateSoundsTab,
        onActivateTab,
        onClickLogo,
        onExtensionButtonClick,
        onOpenCustomExtensionModal,
        onProjectTelemetryEvent,
        onRequestCloseBackdropLibrary,
        onRequestCloseCostumeLibrary,
        onRequestCloseTelemetryModal,
        onSeeCommunity,
        onShare,
        onShowPrivacyPolicy,
        onStartSelectingFileUpload,
        onTelemetryModalCancel,
        onTelemetryModalOptIn,
        onTelemetryModalOptOut,
        securityManager,
        showComingSoon,
        showOpenFilePicker,
        showSaveFilePicker,
        soundsTabVisible,
        stageSizeMode,
        targetIsStage,
        telemetryModalVisible,
        theme,
        tipsLibraryVisible,
        usernameModalVisible,
        settingsModalVisible,
        customExtensionModalVisible,
        fontsModalVisible,
        unknownPlatformModalVisible,
        invalidProjectModalVisible,
        vm,
        ...componentProps
    } = omit(props, 'dispatch');

    if (children) {
        return <Box {...componentProps}>{children}</Box>;
    }

    let PROPS=props
    const {
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
    } = useGuiLogic({
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
    });

    const tabClassNames = {
        tabs: styles.tabs,
        tab: classNames(tabStyles.reactTabsTab, styles.tab),
        tabList: classNames(tabStyles.reactTabsTabList, styles.tabList),
        tabPanel: classNames(tabStyles.reactTabsTabPanel, styles.tabPanel),
        tabPanelSelected: classNames(tabStyles.reactTabsTabPanelSelected, styles.isSelected),
        tabSelected: classNames(tabStyles.reactTabsTabSelected, styles.isSelected)
    };

    const unconstrainedWidth = (
        UNCONSTRAINED_NON_STAGE_WIDTH +
        FIXED_WIDTH +
        Math.max(0, customStageSize.width - FIXED_WIDTH)
    );


    const getAccent = () => {
        const themeStr = localStorage.getItem('tw:theme');
      
        // 没有主题 → 绿色
        if (!themeStr) return 'green';
      
        try {
          const theme = JSON.parse(themeStr);
          const accent = theme?.accent;
      
          // 只允许这三种
          if (['blue', 'red', 'purple'].includes(accent)) {
            return accent;
          }
      
          // 其它全部兜底绿色
          return 'green';
        } catch {
          return 'green';
        }
      };

      const importCodeMap={
        green:importCode,
        red:importCodeRed,
        blue:importCodeBlue,
        purple:importCodePurple
      }
      const saveCodeMap={
        green:'#32b7a6',
        red:'#ff4c4c',
        blue:'#4c97ff',
        purple:'#8b5cd6'
      }
      const importImg=importCodeMap[getAccent()]
      const saveImg=saveCodeMap[getAccent()]
    return (<MediaQuery minWidth={unconstrainedWidth}>{isUnconstrained => {
        const stageSize = resolveStageSize(stageSizeMode, isUnconstrained);

        const alwaysEnabledModals = (
            <React.Fragment>
                <TWSecurityManager securityManager={securityManager} />
                <TWRestorePointManager />
                {usernameModalVisible && <TWUsernameModal />}
                {settingsModalVisible && <TWSettingsModal />}
                {customExtensionModalVisible && <TWCustomExtensionModal />}
                {fontsModalVisible && <TWFontsModal />}
                {unknownPlatformModalVisible && <TWUnknownPlatformModal />}
                {invalidProjectModalVisible && <TWInvalidProjectModal />}
            </React.Fragment>
        );

        return isPlayerOnly ? (
            <React.Fragment>
                {isWindowFullScreen ? (
                    <div
                        className={styles.fullscreenBackground}
                        style={{
                            backgroundColor: fullscreenBackgroundColor
                        }}
                    />
                ) : null}
                <StageWrapper
                    isFullScreen={isFullScreen}
                    isEmbedded={isEmbedded}
                    isRendererSupported={isRendererSupported()}
                    isRtl={isRtl}
                    loading={loading}
                    stageSize={STAGE_SIZE_MODES.full}
                    vm={vm}
                >
                    {alertsVisible ? (
                        <Alerts className={styles.alertsContainer} />
                    ) : null}
                </StageWrapper>
                {alwaysEnabledModals}
            </React.Fragment>
        ) : (
            <Box
                className={styles.pageWrapper}
                dir={isRtl ? 'rtl' : 'ltr'}
                style={{
                    minWidth: 1024 + Math.max(0, customStageSize.width - 480),
                    minHeight: 640 + Math.max(0, customStageSize.height - 360)
                }}
                {...componentProps}
            >
                {alwaysEnabledModals}
                {telemetryModalVisible ? (
                    <TelemetryModal
                        isRtl={isRtl}
                        isTelemetryEnabled={isTelemetryEnabled}
                        onCancel={onTelemetryModalCancel}
                        onOptIn={onTelemetryModalOptIn}
                        onOptOut={onTelemetryModalOptOut}
                        onRequestClose={onRequestCloseTelemetryModal}
                        onShowPrivacyPolicy={onShowPrivacyPolicy}
                    />
                ) : null}
                {loading ? (
                    <Loader isFullScreen />
                ) : null}
                {isCreating ? (
                    <Loader
                        isFullScreen
                        messageId="gui.loader.creating"
                    />
                ) : null}
                {isBrowserSupported() ? null : (
                    <BrowserModal
                        isRtl={isRtl}
                        onClickDesktopSettings={onClickDesktopSettings}
                    />
                )}
                {tipsLibraryVisible ? (
                    <TipsLibrary />
                ) : null}
                {cardsVisible ? (
                    <Cards />
                ) : null}
                {alertsVisible ? (
                    <Alerts className={styles.alertsContainer} />
                ) : null}
                {connectionModalVisible ? (
                    <ConnectionModal
                        vm={vm}
                    />
                ) : null}
                {costumeLibraryVisible ? (
                    <CostumeLibrary
                        vm={vm}
                        onRequestClose={onRequestCloseCostumeLibrary}
                    />
                ) : null}
                {backdropLibraryVisible ? (
                    <BackdropLibrary
                        vm={vm}
                        onRequestClose={onRequestCloseBackdropLibrary}
                    />
                ) : null}
                
                <MenuBar
                    accountNavOpen={accountNavOpen}
                    authorId={authorId}
                    authorThumbnailUrl={authorThumbnailUrl}
                    authorUsername={authorUsername}
                    canChangeLanguage={canChangeLanguage}
                    canChangeTheme={canChangeTheme}
                    canCreateCopy={canCreateCopy}
                    canCreateNew={canCreateNew}
                    canEditTitle={canEditTitle}
                    canManageFiles={canManageFiles}
                    canRemix={canRemix}
                    canSave={canSave}
                    canShare={canShare}
                    className={styles.menuBarPosition}
                    enableCommunity={enableCommunity}
                    isShared={isShared}
                    isTotallyNormal={isTotallyNormal}
                    logo={logo}
                    renderLogin={renderLogin}
                    showComingSoon={showComingSoon}
                    showOpenFilePicker={showOpenFilePicker}
                    showSaveFilePicker={showSaveFilePicker}
                    onClickAbout={onClickAbout}
                    onClickAccountNav={onClickAccountNav}
                    onClickAddonSettings={onClickAddonSettings}
                    onClickMaster={onClickMaster}
                    onClickConnect={onClickConnect}
                    onClickFirmware={onClickFirmware}
                    onClickDesktopSettings={onClickDesktopSettings}
                    clickSerialConnect={clickSerialConnect}
                    clickBleConnect={clickBleConnect}
                    clickDownloadCode={clickDownloadCode}
                    clickEspSend={clickEspSend}
                    clickSendWifi={clickSendWifi}
                    onClickNewWindow={onClickNewWindow}
                    onClickPackager={onClickPackager}
                    onClickLogo={onClickLogo}
                    onCloseAccountNav={onCloseAccountNav}
                    onLogOut={onLogOut}
                    onOpenRegistration={onOpenRegistration}
                    onProjectTelemetryEvent={onProjectTelemetryEvent}
                    onSeeCommunity={onSeeCommunity}
                    onShare={onShare}
                    onStartSelectingFileUpload={onStartSelectingFileUpload}
                    onToggleLoginOpen={onToggleLoginOpen}
                    onModeChange={handleModeChange}
                    modeValue={modeValue}
                    extensionName={extensionName}
                    openExampleCode={handleOpenExample}
                />
                <Box className={styles.bodyWrapper}>
                    <Box className={styles.flexWrapper}>
                        <Box className={styles.editorWrapper}>
                            <Tabs
                                forceRenderTabPanel
                                className={tabClassNames.tabs}
                                selectedIndex={activeTabIndex}
                                selectedTabClassName={tabClassNames.tabSelected}
                                selectedTabPanelClassName={tabClassNames.tabPanelSelected}
                                onSelect={onActivateTab}
                            >
                                <TabList className={tabClassNames.tabList} style={{
                                    position: 'relative',
                                    zIndex: 100
                                }}>
                                    <Tab className={tabClassNames.tab}>
                                        <img
                                            draggable={false}
                                            src={codeIcon()}
                                        />
                                        <FormattedMessage
                                            defaultMessage="Code"
                                            description="Button to get to the code panel"
                                            id="gui.gui.codeTab"
                                        />
                                    </Tab>
                                    <Tab
                                        className={tabClassNames.tab}
                                        onClick={onActivateCostumesTab}
                                    >
                                        <img
                                            draggable={false}
                                            src={costumesIcon()}
                                        />
                                        {targetIsStage ? (
                                            <FormattedMessage
                                                defaultMessage="Backdrops"
                                                description="Button to get to the backdrops panel"
                                                id="gui.gui.backdropsTab"
                                            />
                                        ) : (
                                            <FormattedMessage
                                                defaultMessage="Costumes"
                                                description="Button to get to the costumes panel"
                                                id="gui.gui.costumesTab"
                                            />
                                        )}
                                    </Tab>
                                    <Tab
                                        className={tabClassNames.tab}
                                        onClick={onActivateSoundsTab}
                                    >
                                        <img
                                            draggable={false}
                                            src={soundsIcon()}
                                        />
                                        <FormattedMessage
                                            defaultMessage="Sounds"
                                            description="Button to get to the sounds panel"
                                            id="gui.gui.soundsTab"
                                        />
                                    </Tab>
                                </TabList>
                                <TabPanel className={tabClassNames.tabPanel}>
                                    <Box className={styles.blocksWrapper}>
                                        <Blocks
                                            key={`${blocksId}/${theme.id}`}
                                            canUseCloud={canUseCloud}
                                            grow={1}
                                            isVisible={blocksTabVisible}
                                            options={{
                                                media: `${basePath}static/${theme.getBlocksMediaFolder()}/`
                                            }}
                                            stageSize={stageSize}
                                            onOpenCustomExtensionModal={onOpenCustomExtensionModal}
                                            theme={theme}
                                            vm={vm}
                                        />
                                    </Box>
                                    <Box className={styles.extensionButtonContainer}>
                                        <button
                                            className={styles.extensionButton}
                                            title={intl.formatMessage(messages.addExtension)}
                                            onClick={(e) => {
                                                if (!showCode) {
                                                    onExtensionButtonClick(e);
                                                }
                                            }}
                                        >
                                            <img
                                                className={styles.extensionButtonIcon}
                                                draggable={false}
                                                src={addExtensionIcon}
                                            />
                                        </button>
                                    </Box>
                                    <Box className={styles.watermark}>
                                        <Watermark />
                                    </Box>
                                </TabPanel>
                                <TabPanel className={tabClassNames.tabPanel}>
                                    {costumesTabVisible ? <CostumeTab
                                        vm={vm}
                                    /> : null}
                                </TabPanel>
                                <TabPanel className={tabClassNames.tabPanel}>
                                    {soundsTabVisible ? <SoundTab vm={vm} /> : null}
                                </TabPanel>
                            </Tabs>
                            {/* {backpackVisible ? (
                                <Backpack host={backpackHost} />
                            ) : null} */}
                        </Box>

                        <LoadingOverlay isLoading={isLoading} />
                        <BurnLogs isLoading={isFlashing} logs={logs}></BurnLogs>
                        <TrainPage isTrain={isTrain}></TrainPage>
                        
                        <Box className={classNames(styles.stageAndTargetWrapper, styles[stageSize])}>
                            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', alignItems: 'center',paddingTop:'10px'}}>
                                {showCode &&  <button
                                    style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    }}
                                    onClick={()=>{
                                        let args={
                                            code:codeModule.getCode(),
                                            device:getCurrent()
                                        }
                                        saveCode(args);
                                    }}
                                >
                                    <svg
                                    viewBox="0 0 24 24"
                                    style={{ width: '22px', height: '22px', fill: saveImg }}
                                    >
                                    <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3-8H7V5h8v4z" />
                                    </svg>
                                </button>}

                                {showCode && <button
                                    style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    }}
                                    onClick={()=>{
                                        loadCode();
                                    }}
                                >
                                    {/* <FormattedMessage
                                        defaultMessage="导入"
                                        description="Button to get to the code panel"
                                        id="gui.importFile"
                                    /> */}
                                    <img src={importImg} style={{ width: '18px', height: '18px' }}></img>
                                </button>}


                            
                                {/* {showCode && getCurrent()=='ICRobot' &&<span style={{color:'#ccc',fontSize:'14px'}}>丨</span>}
                                {showCode && getCurrent()=='ICRobot' && 
                                    <select
                                        value={selectedIndex}
                                        onChange={(e) => setSelectedIndex(Number(e.target.value))}
                                        style={{ marginLeft: '8px', padding: '4px' }}
                                    >
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <option key={num} value={num}>
                                                {num}
                                            </option>
                                        ))}
                                    </select>
                                }
                                {showCode && getCurrent()=='ICRobot' && <span>
                                    <FormattedMessage
                                        defaultMessage="号默认程序"
                                        description="Button to get to the code panel"
                                        id="gui.codeofnumber"
                                    />
                                </span>}

                                {showCode && getCurrent()=='ICRobot'  &&  <button
                                    onClick={handleLoadSelectedCode}
                                    style={{
                                        marginLeft: '6px',
                                        padding: '4px 8px',
                                        backgroundColor: '#239393',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    OK
                                </button>} */}
                            </div>
                            
                            {/* {showCode && <CodeMirrorComponent code={pythonCode}/>}
                            {showCode && <TabSwitcher serialData={data} onSendData={handleChildData} extension={currentExtension} isDown={isDown}/>} */}

                            {showCode && <div className={styles.codeAndTab}>
                                {showCode && <CodeMirrorComponent code={pythonCode}/>}
                                {showCode && <TabSwitcher serialData={data} onSendData={handleChildData} extension={currentExtension}/>}
                            </div>}

                            {!showCode && <StageWrapper
                                isFullScreen={isFullScreen}
                                isRendererSupported={isRendererSupported()}
                                isRtl={isRtl}
                                stageSize={stageSize}
                                vm={vm}
                            />}
                            {!showCode && <Box className={styles.targetWrapper}>
                                <TargetPane
                                    stageSize={stageSize}
                                    vm={vm}
                                />
                            </Box>}
                            {/* {selected && (
                                <div
                                style={{
                                    marginTop: "20px",
                                    padding: "15px",
                                    background: "#f9f9f9",
                                    borderRadius: "10px",
                                }}
                                >
                                <h2 style={{ fontWeight: "bold", marginBottom: "10px" }}>
                                    已选择示例：
                                </h2>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <img src={selected.img} alt={selected.name} width={50} />
                                    <span style={{ fontSize: "18px" }}>{selected.name}</span>
                                </div>
                                </div>
                            )} */}

                            {/* 弹窗 */}
                            <ExampleModal
                                open={open}
                                onClose={() => setOpen(false)}
                                onSelect={handleSelect}
                            />
                            {props.masterModalVisible && (
                                <MasterModal onRequestClose={props.onRequestCloseMasterModal} handleData={handledata} />
                            )}
                            {props.connectModalVisible && (
                                <ConnectTabs onRequestClose={props.onRequestCloseConnectModal} handleConnectData={handleConnectData} portData={portData} />
                            )}
                            {props.firmwareModalVisible && (
                                <FirmwareFlasher onRequestClose={props.onRequestCloseFirmwareModal} handleFirmwareData={handleFirmwareData} />
                            )}
                        </Box>
                    </Box>
                </Box>
                <DragLayer />
            </Box>
        );
    }}</MediaQuery>);
};

GUIComponent.propTypes = {
    accountNavOpen: PropTypes.bool,
    activeTabIndex: PropTypes.number,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    authorThumbnailUrl: PropTypes.string,
    authorUsername: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    backdropLibraryVisible: PropTypes.bool,
    backpackHost: PropTypes.string,
    backpackVisible: PropTypes.bool,
    basePath: PropTypes.string,
    blocksTabVisible: PropTypes.bool,
    blocksId: PropTypes.string,
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canRemix: PropTypes.bool,
    canSave: PropTypes.bool,
    canShare: PropTypes.bool,
    canUseCloud: PropTypes.bool,
    cardsVisible: PropTypes.bool,
    children: PropTypes.node,
    costumeLibraryVisible: PropTypes.bool,
    costumesTabVisible: PropTypes.bool,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    enableCommunity: PropTypes.bool,
    intl: intlShape.isRequired,
    isCreating: PropTypes.bool,
    isEmbedded: PropTypes.bool,
    isFullScreen: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    isShared: PropTypes.bool,
    isWindowFullScreen: PropTypes.bool,
    isTotallyNormal: PropTypes.bool,
    loading: PropTypes.bool,
    logo: PropTypes.string,
    onActivateCostumesTab: PropTypes.func,
    onActivateSoundsTab: PropTypes.func,
    onActivateTab: PropTypes.func,
    onClickAccountNav: PropTypes.func,
    onClickAddonSettings: PropTypes.func,
    onClickMaster: PropTypes.func,
    onClickConnect:PropTypes.func,
    onClickFirmware:PropTypes.func,
    onClickDesktopSettings: PropTypes.func,
    clickSerialConnect: PropTypes.func,
    download:PropTypes.func,
    SerialDownload:PropTypes.func,
    saveCode:PropTypes.func,
    loadCode:PropTypes.func,
    cancelload:PropTypes.func,
    clickBleConnect: PropTypes.func,
    clickDownloadCode: PropTypes.func,
    clickEspSend: PropTypes.func,
    clickSendWifi: PropTypes.func,
    onClickNewWindow: PropTypes.func,
    onClickPackager: PropTypes.func,
    onClickLogo: PropTypes.func,
    onCloseAccountNav: PropTypes.func,
    onExtensionButtonClick: PropTypes.func,
    onOpenCustomExtensionModal: PropTypes.func,
    onLogOut: PropTypes.func,
    onOpenRegistration: PropTypes.func,
    onRequestCloseBackdropLibrary: PropTypes.func,
    onRequestCloseCostumeLibrary: PropTypes.func,
    onRequestCloseTelemetryModal: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onShare: PropTypes.func,
    onShowPrivacyPolicy: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onTabSelect: PropTypes.func,
    onTelemetryModalCancel: PropTypes.func,
    onTelemetryModalOptIn: PropTypes.func,
    onTelemetryModalOptOut: PropTypes.func,
    onToggleLoginOpen: PropTypes.func,
    renderLogin: PropTypes.func,
    securityManager: PropTypes.shape({}),
    showComingSoon: PropTypes.bool,
    showOpenFilePicker: PropTypes.func,
    showSaveFilePicker: PropTypes.func,
    soundsTabVisible: PropTypes.bool,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    targetIsStage: PropTypes.bool,
    telemetryModalVisible: PropTypes.bool,
    theme: PropTypes.instanceOf(Theme),
    tipsLibraryVisible: PropTypes.bool,
    usernameModalVisible: PropTypes.bool,
    settingsModalVisible: PropTypes.bool,
    customExtensionModalVisible: PropTypes.bool,
    fontsModalVisible: PropTypes.bool,
    unknownPlatformModalVisible: PropTypes.bool,
    invalidProjectModalVisible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
};

GUIComponent.defaultProps = {
    backpackHost: null,
    backpackVisible: false,
    basePath: './',
    blocksId: 'original',
    canChangeLanguage: true,
    canChangeTheme: true,
    canCreateNew: false,
    canEditTitle: false,
    canManageFiles: true,
    canRemix: false,
    canSave: false,
    canCreateCopy: false,
    canShare: false,
    canUseCloud: false,
    enableCommunity: false,
    isCreating: false,
    isShared: false,
    isTotallyNormal: false,
    loading: false,
    showComingSoon: false,
    stageSizeMode: STAGE_SIZE_MODES.large,
};

const mapStateToProps = state => ({
    customStageSize: state.scratchGui.customStageSize,
    isWindowFullScreen: state.scratchGui.tw.isWindowFullScreen,
    blocksId: state.scratchGui.timeTravel.year.toString(),
    stageSizeMode: state.scratchGui.stageSize.stageSize,
    theme: state.scratchGui.theme.theme
});

export default injectIntl(connect(
    mapStateToProps
)(GUIComponent));