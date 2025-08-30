import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import {MenuItem} from '../menu/menu.jsx';
import icon from './tw-desktop-icon.svg';
// import logo from './logo.png'
import styles from './settings-menu.css';

const ConnectDevice = props => (
    <MenuItem onClick={props.onClick}>
        <div className={styles.option}>
            <FormattedMessage
                defaultMessage='连接'
                description="Button in menu bar under settings to open desktop app settings"
                id="connectDevice"
            />
        </div>
    </MenuItem>
);

ConnectDevice.propTypes = {
    onClick: PropTypes.func
};

export default ConnectDevice;
