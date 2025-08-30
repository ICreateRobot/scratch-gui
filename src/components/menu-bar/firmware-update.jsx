import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import {MenuItem} from '../menu/menu.jsx';
import icon from './tw-desktop-icon.svg';
// import logo from './logo.png'
import styles from './settings-menu.css';
import firmware from './firmware.svg'

const FirmwareUpdate = props => (
    <MenuItem onClick={props.onClick}>
        <div className={styles.option}>

            <img
                src={firmware}
                draggable={false}
                width={24}
                height={24}
                alt=""
            />
            {/* <FormattedMessage
                defaultMessage='固件升级'
                description="Button in menu bar under settings to open desktop app settings"
                id="FirmwareUpdate"
            /> */}
        </div>
    </MenuItem>
);

FirmwareUpdate.propTypes = {
    onClick: PropTypes.func
};

export default FirmwareUpdate;
