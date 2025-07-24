import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import {MenuItem} from '../menu/menu.jsx';
import icon from './tw-desktop-icon.svg';
// import logo from './logo.png'
import styles from './settings-menu.css';

const MasterController = props => (
    <MenuItem onClick={props.onClick}>
        <div className={styles.option}>
            {/* <img
                src={logo}
                draggable={false}
                width={24}
                height={24}
                alt=""
            /> */}
           {props.value === '选择设备' ? (
                <FormattedMessage
                    defaultMessage="选择设备"
                    description="Button in menu bar under settings to open desktop app settings"
                    id="selectDevice"
                />
            ) : (
                props.value
            )}
        </div>
    </MenuItem>
);

MasterController.propTypes = {
    onClick: PropTypes.func
};

export default MasterController;
