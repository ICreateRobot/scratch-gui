import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';

import ControlsComponent from '../components/controls/controls.jsx';
import { getAdd ,getBlock} from '../../../../utils/isAddMaster.js';
import { getIsRobot ,getRobotIp} from 'scratch-gui/src/components/utils/utils.js';
import { createControlsLogic} from './hooks/controls-logic.js';

const channel = new BroadcastChannel('flag_channel');
class Controls extends React.Component {
    constructor (props) {
        super(props);
        this.logic=createControlsLogic(this)
        this.handleGreenFlagClick=(e)=>this.logic.handleGreenFlagClick(e)
        this.handleStopAllClick =(e) => this.logic.handleStopAllClick(e)
        bindAll(this, [
            'handleGreenFlagClick',
            'handleStopAllClick'
        ]);
        this.stopAll = new BroadcastChannel('stopAll')
        this.ip=getRobotIp()
        this.channelSendIp=new BroadcastChannel('sendIp')
        this.channelSendIp.addEventListener('message',(event)=>{
            this.ip=event.data
        })

        this.whatSendFun='net'
        this.channelPort = new BroadcastChannel('channelPort')
        this.channelPort.addEventListener('message',(event)=>{
            console.log(event.data)
            if(event.data){
                this.whatSendFun='port'
            }else{
                this.whatSendFun='net'
            }
            
        })
    }
    handleGreenFlagClick (e) {
        e.preventDefault();
        // tw: implement alt+click and right click to toggle FPS
        if (e.shiftKey || e.altKey || e.type === 'contextmenu') {
            if (e.shiftKey) {
                this.props.vm.setTurboMode(!this.props.turbo);
            }
            if (e.altKey || e.type === 'contextmenu') {
                if (this.props.framerate === 30) {
                    this.props.vm.setFramerate(60);
                } else {
                    this.props.vm.setFramerate(30);
                }
            }
        } else {
            if (!this.props.isStarted) {
                this.props.vm.start();
            }
            this.props.vm.greenFlag();
        }
    }
    handleStopAllClick (e) {
        e.preventDefault();
        this.props.vm.stopAll();
    }
    render () {
        const {
            vm, // eslint-disable-line no-unused-vars
            isStarted, // eslint-disable-line no-unused-vars
            projectRunning,
            turbo,
            ...props
        } = this.props;
        return (
            <ControlsComponent
                {...props}
                active={projectRunning && isStarted}
                turbo={turbo}
                onGreenFlagClick={this.handleGreenFlagClick}
                onStopAllClick={this.handleStopAllClick}
            />
        );
    }
}

Controls.propTypes = {
    isStarted: PropTypes.bool.isRequired,
    projectRunning: PropTypes.bool.isRequired,
    turbo: PropTypes.bool.isRequired,
    framerate: PropTypes.number.isRequired,
    interpolation: PropTypes.bool.isRequired,
    isSmall: PropTypes.bool,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    isStarted: state.scratchGui.vmStatus.started,
    projectRunning: state.scratchGui.vmStatus.running,
    framerate: state.scratchGui.tw.framerate,
    interpolation: state.scratchGui.tw.interpolation,
    turbo: state.scratchGui.vmStatus.turbo
});
// no-op function to prevent dispatch prop being passed to component
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Controls);
