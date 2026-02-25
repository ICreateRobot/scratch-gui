import React, { useState } from "react";
import styles from "./styles.css";
import { setCurrent, getCurrent } from "../utils/utils.js";
import formatMessage from "format-message";
import { FormattedMessage } from "react-intl";

import Apriltag from "./Apriltag.png";
import line from "./line.png";
import MobileControl from "./MobileControl.png";
import transport from "./transport.png";
import voiceCon from "./voiceCon.png";
import imgControl from "./imgControl.png";
import xiaofang from "./xiaofang.png";
import subway from "./subway.png";
import onlineAuto from "./onlineAutoLine.png"
import onlineVOice from "./onlineVoice.png"

const ExampleModal = ({ open, onClose, onSelect }) => {
  const [tab, setTab] = useState("sb3");

  if (!open) return null;

  const currentDevice = getCurrent();

  // 读取本地主题
  const local = localStorage.getItem("tw:theme");
  let isDark = false;
  try {
    if (local === "dark") {
      isDark = true;
    } else {
      const parsed = JSON.parse(local);
      if (parsed?.gui === "dark") {
        isDark = true;
      }
    }
  } catch (e) {
    isDark = false;
  }

  const sb3Examples = [
    {
      id: 1,
      mode: "sb3",
      device: "ICRobot",
      name: formatMessage({
        id: "ic.sampleProgram.image",
        default: "Image Transmission Remote Control",
        description: "Image Transmission Remote Control",
      }),
      img: imgControl,
    },
    {
      id: 2,
      mode: "sb3",
      device: "ICRobot",
      name: formatMessage({
        id: "ic.sampleProgram.onlineVoice",
        default: "Voice-controlled robot",
        description: "Voice-controlled robot",
      }),
      img: onlineVOice,
    },
    {
      id: 3,
      mode: "sb3",
      device: "ICRobot",
      name: formatMessage({
        id: "ic.sampleProgram.onlineAuto",
        default: "Automatic line following",
        description: "Automatic line following",
      }),
      img: onlineAuto,
    },
  ];

  const pythonExamples = [
    {
      id: 1,
      mode: "py",
      device: "ICRobot",
      name: formatMessage({
        id: "ic.sampleProgram.line",
        default: "Line-following Robot",
        description: "Line-following Robot",
      }),
      img: line,
    },
    {
      id: 2,
      mode: "py",
      device: "ICRobot",
      name: formatMessage({
        id: "ic.sampleProgram.voiceCon",
        default: "Voice-controlled Robot",
        description: "Voice-controlled Robot",
      }),
      img: voiceCon,
    },
    {
      id: 3,
      mode: "py",
      device: "ICRobot",
      name: formatMessage({
        id: "ic.sampleProgram.apriltag",
        default: "Apriltag Code Recognition",
        description: "Apriltag Code Recognition",
      }),
      img: Apriltag,
    },
    {
      id: 4,
      mode: "py",
      device: "ICRobot",
      name: formatMessage({
        id: "ic.sampleProgram.app",
        default: "App Remote Control",
        description: "App Remote Control",
      }),
      img: MobileControl,
    },
    {
      id: 5,
      mode: "py",
      device: "ICRobot",
      name: formatMessage({
        id: "ic.sampleProgram.transport",
        default: "Trabsport Robot",
        description: "Trabsport Robot",
      }),
      img: transport,
    },
  ];

  const examples = tab === "sb3" ? sb3Examples : pythonExamples;

  const filteredExamples = examples.filter(
    (item) => item.device === "scratch" || item.device === currentDevice
  );

  return (
    <div className={styles.overlay}>
      <div
        className={`${styles.modal} ${
          isDark ? styles.modalDark : styles.modalLight
        }`}
      >
        {/* 关闭按钮 */}
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${
              tab === "sb3" ? styles.active : ""
            } ${isDark ? styles.tabBtnDark : styles.tabBtnLight}`}
            onClick={() => setTab("sb3")}
          >
            <FormattedMessage
              defaultMessage="Block Sample Program"
              description="SB3 Sample Program"
              id="ic.sampleProgram.sb3"
            />
          </button>
          <button
            className={`${styles.tabBtn} ${
              tab === "python" ? styles.active : ""
            } ${isDark ? styles.tabBtnDark : styles.tabBtnLight}`}
            onClick={() => setTab("python")}
          >
            <FormattedMessage
              defaultMessage="Python Sample Program"
              description="Python Sample Program"
              id="ic.sampleProgram.py"
            />
          </button>
        </div>

        {/* 示例内容 */}
        <div className={styles.grid}>
          {filteredExamples.length > 0 ? (
            filteredExamples.map((item) => (
              <button
                key={item.id}
                className={`${styles.gridItem} ${
                  isDark ? styles.gridItemDark : styles.gridItemLight
                }`}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <img src={item.img} alt={item.name} />
                <span>{item.name}</span>
              </button>
            ))
          ) : (
            <div className={styles.noExamples}>
              <p>
                <FormattedMessage
                  defaultMessage="No examples available"
                  description="No examples available"
                  id="ic.sampleProgram.noExample"
                />
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExampleModal;
