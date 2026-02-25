import React, { useEffect, useState } from 'react';
import styles from './MasterModal.css';
import bricksImg from './images/bricks.png';
import robotImg from './images/robot.png';
import microbitImg from './images/microbit.png';
import formatMessage  from 'format-message';
import {FormattedMessage} from 'react-intl';
const MasterModal = ({ onRequestClose, handleData }) => {
  const [selected, setSelected] = useState(() => {
    // 从全局 window 读取已保存的状态
    if (window.masterSelectedState) {
      return [...window.masterSelectedState];
    }
    return [false, false, false];
  });

  // 每次状态变化时，保存到全局 window
  useEffect(() => {
    window.masterSelectedState = selected;
  }, [selected]);

  // 点击设备
  // const selectDevice = async(index) => {
  //   if (selected[index]) return; // 已选择则不重复
  //   const newState = [...selected];
  //   newState[index] = true;
  //   setSelected(newState);
  //   await new Promise(resolve => setTimeout(resolve, 1000));
  //   handleData({
  //     type: 'close',
  //     data: { message: newState }
  //   });  
  //   await new Promise(resolve => setTimeout(resolve, 200));
  //   handleData({
  //     type: 'open',
  //     data: { message: index+1 }
  //   });

  // };

  const selectDevice = async (index) => {
    // 如果当前已经选中该设备，就不重复操作
    if (selected[index]) return;

    // 找到当前选中的设备索引
    const currentSelectedIndex = selected.findIndex(v => v === true);

    // 复制状态
    const newState = [...selected];

    // 如果有其他设备已被选中，先取消它
    if (currentSelectedIndex !== -1) {
      newState[currentSelectedIndex] = false;
      setSelected([...newState]);
      await new Promise(resolve => setTimeout(resolve, 200)); // 小延迟模拟“关闭动画”
      handleData({
        type: 'close',
        data: { message: [...newState] }
      });
    }

    // 选中新设备
    newState[index] = true;
    setSelected([...newState]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    handleData({
      type: 'close',
      data: { message: [...newState] }
    });
    await new Promise(resolve => setTimeout(resolve, 200));
    handleData({
      type: 'open',
      data: { message: index + 1 }
    });
  };

  // 点击红色减号
  const deselectDevice = async(index, e) => {
    e.stopPropagation();
    const newState = [...selected];
    newState[index] = false;
    setSelected(newState);
    await new Promise(resolve => setTimeout(resolve, 1000));  
    handleData({
      type: 'close',
      data: { message: newState }
    });
  };

  const devices = [
    { name: 'ICBricks', img: bricksImg },
    { name: 'ICRobot', img: robotImg },
    { name: 'Microbit', img: microbitImg },
  ];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* 标题栏 */}
        <div className={styles.modalHeader}>
          <h2> <FormattedMessage
                    defaultMessage="select device"
                    description="select device"
                    id="gui.master.selectDevice"
                />
          </h2>
          <button className={styles.closeButton} onClick={onRequestClose}>
            &times;
          </button>
        </div>
        <hr />

        {/* 设备选择表格 */}
        <table>
          <tbody>
            <tr>
              {devices.map((dev, index) => (
                <td key={dev.name}>
                  <div
                    className={styles.cellContent}
                    onClick={() => selectDevice(index)}
                  >
                    {/* 半透明遮罩层 */}
                    {selected[index] && <div className={styles.overlay}></div>}

                    {/* 红色减号按钮 */}
                    {selected[index] && (
                      <div
                        className={styles.closeBtn}
                        onClick={(e) => deselectDevice(index, e)}
                      >
                        -
                      </div>
                    )}

                    <p>{dev.name}</p>
                    <img src={dev.img} alt={dev.name} />
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterModal;
