
// import React, { useMemo, useEffect, useRef } from "react";
// import styles from "./BurnLogs.css";

// const BurnLogs = ({ isLoading, logs }) => {
  
//   const lockRef = useRef(false);
//   const percent = useMemo(() => {

//     if (!logs || logs.length === 0) {
//       return 0;
//     }
  
//     // ======================================================
//     // 判断模式
//     // ======================================================
  
//     const isDualFirmware =
//       logs.includes('__MODE_DUAL__');
  
//     const isMicrobit =
//       logs.includes('__MODE_MICROBIT__');
  
//     // ======================================================
//     // microbit
//     // ======================================================
  
//     if (isMicrobit) {
  
//       const lastNumber = [...logs]
//         .reverse()
//         .find(
//           (l) =>
//             typeof l === 'string' &&
//             /^\d+$/.test(l)
//         );
  
//       return lastNumber
//         ? Number(lastNumber)
//         : 0;
//     }
  
//     // ======================================================
//     // 判断完成
//     // ======================================================
  
//     const exitCount = logs.filter(
//       (l) =>
//         typeof l === 'string' &&
//         (
//           l.includes('Child process exited with code 0') ||
//           l.includes('Hard resetting')
//         )
//     ).length;
  
//     const requiredExitCount =
//       isDualFirmware ? 2 : 1;
  
//     // if (exitCount >= requiredExitCount) {
//     //   return 100;
//     // }
  
//     // ======================================================
//     // 提取最新百分比
//     // ======================================================
  
//     let latestPercent = 0;
  
//     for (let i = logs.length - 1; i >= 0; i--) {
  
//       const line = logs[i];
  
//       if (typeof line !== 'string') {
//         continue;
//       }
  
//       const match =
//         line.match(/\((\d+)\s*%\)/);
  
//       if (match) {
  
//         latestPercent =
//           Number(match[1]);
  
//         break;
//       }
//     }
  
//     // ======================================================
//     // 单固件
//     // ======================================================
  
//     if (!isDualFirmware) {
//       return latestPercent;
//     }
  
//     // ======================================================
//     // 双固件
//     // ======================================================
  
//     const secondStageStarted =
//       logs.includes('__STAGE_2__');
  
//     // 第一阶段
//     if (!secondStageStarted) {
  
//       let percent=Math.round(
//         latestPercent * 0.5
//       );
//       if(percent==100){
//         latestPercent=0
//         return 100
//       }else{
//         return percent
//       }
      
//     }

//     // 第二阶段
//     if(latestPercent===0){
//       lockRef.current=true
//     }
//     if(!lockRef.current){
//       return 50
//     }else{
//       return Math.round(
//         50 + latestPercent * 0.5
//       );
  
//     }
    
    
  
//   }, [logs]);

//   const logRef = useRef(null);

//   useEffect(() => {
//     if (logRef.current) {
//       logRef.current.scrollTop = logRef.current.scrollHeight;
//     }
//   }, [logs]);
//   useEffect(() => {
//     if (!isLoading) {
//       lockRef.current = false;
//     }
//   }, [isLoading]);

//   if (!isLoading) return null;

//   return (
//     <div className={styles.overlay}>
//       <div className={styles.box}>
//         {/* <div className={styles.title}>正在烧录固件</div> */}

//         <div className={styles.percentWrapper}>
//           <div className={styles.percent}>{percent}%</div>
//           {/* 添加旋转的圆圈 */}
//           <div className={styles.spinner}></div>
//         </div>

//         <div className={styles.barOuter}>
//           <div
//             className={styles.barInner}
//             style={{ width: `${percent}%` }}
//           />
//         </div>

//         <div className={styles.logBox} ref={logRef}>
//           {logs && logs.length > 0 ? (
//             logs.map((line, idx) => {
//               const isNumber = typeof line === "string" && /^\d+$/.test(line);

//               return (
//                 <div key={idx} className={styles.logLine}>
//                   {isNumber ? `Data written ${line}` : line}
//                 </div>
//               );
//             })
//           ) : (
//             <div className={styles.logEmpty}></div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BurnLogs;

import React, {
  useMemo,
  useEffect,
  useRef
} from "react";

import styles from "./BurnLogs.css";

const BurnLogs = ({
  isLoading,
  logs
}) => {
  const logRef = useRef(null);

  const burnInfo = useMemo(() => {
    let firmwareCount = 1;
    let currentFirmware = 1;
    let currentPercent = 0;

    if (!logs || logs.length === 0) {
      return {
        firmwareCount,
        currentFirmware,
        currentPercent
      };
    }

    /*
     * ================================
     * Microbit
     * ================================
     *
     * Microbit 原来的逻辑保持不变：
     * logs 中会存在单独的数字，例如：
     *
     * 0
     * 1
     * 2
     * ...
     * 100
     *
     * 直接取最后一个数字作为进度。
     */
    const isMicrobit =
      logs.includes("__MODE_MICROBIT__");

    if (isMicrobit) {
      const lastNumber =
        [...logs]
          .reverse()
          .find(
            (line) =>
              typeof line === "string" &&
              /^\d+$/.test(line)
          );

      currentPercent =
        lastNumber
          ? Number(lastNumber)
          : 0;

      currentPercent =
        Math.min(
          Math.max(
            currentPercent,
            0
          ),
          100
        );

      return {
        firmwareCount: 1,
        currentFirmware: 1,
        currentPercent
      };
    }

    /*
     * ================================
     * 获取固件数量
     * ================================
     *
     * 主进程发送：
     *
     * __FIRMWARE_COUNT__:1
     * 或
     * __FIRMWARE_COUNT__:2
     */
    for (let i = 0; i < logs.length; i++) {
      const line = logs[i];

      if (typeof line !== "string") {
        continue;
      }

      const countMatch =
        line.match(
          /__FIRMWARE_COUNT__:(\d+)/
        );

      if (countMatch) {
        firmwareCount =
          Number(countMatch[1]);

        break;
      }
    }

    if (
      !Number.isFinite(
        firmwareCount
      ) ||
      firmwareCount < 1
    ) {
      firmwareCount = 1;
    }

    /*
     * ================================
     * 获取当前固件阶段
     * ================================
     *
     * 主进程在第二个固件开始时发送：
     *
     * __FIRMWARE_STAGE__:2
     *
     * 如果以后有第三个固件：
     *
     * __FIRMWARE_STAGE__:3
     *
     * 这里从后往前找最新的 stage。
     *
     * 不再根据地址判断。
     * 不再出现：
     *
     * 1420000
     * 800000
     *
     * 这样的硬编码。
     */
    for (
      let i = logs.length - 1;
      i >= 0;
      i--
    ) {
      const line = logs[i];

      if (typeof line !== "string") {
        continue;
      }

      const stageMatch =
        line.match(
          /__FIRMWARE_STAGE__:(\d+)/
        );

      if (stageMatch) {
        currentFirmware =
          Number(stageMatch[1]);

        break;
      }
    }

    /*
     * 防止阶段数据异常
     */
    if (
      !Number.isFinite(
        currentFirmware
      ) ||
      currentFirmware < 1
    ) {
      currentFirmware = 1;
    }

    if (
      currentFirmware >
      firmwareCount
    ) {
      currentFirmware =
        firmwareCount;
    }

    /*
     * ================================
     * 获取当前固件进度
     * ================================
     *
     * esptool 输出类似：
     *
     * Writing at 0x00000000... (0 %)
     * Writing at 0x000107d5... (0 %)
     * Writing at 0x0001562b... (1 %)
     *
     * 第二个固件开始：
     *
     * Writing at 0x00800000... (0 %)
     *
     * 这里必须从后往前找第一个百分比。
     *
     * 特别注意：
     *
     * 不能写成：
     *
     * if (latestPercent === 0)
     *
     * 因为第二个固件刚开始时就是 0%，
     * 如果继续向前找，就可能找到第一个固件
     * 的旧进度，例如 100%。
     *
     * 那样第二个固件开始时就会错误显示 100%。
     */
    let latestPercent = 0;

    for (
      let i = logs.length - 1;
      i >= 0;
      i--
    ) {
      const line = logs[i];

      if (typeof line !== "string") {
        continue;
      }

      const percentMatch =
        line.match(
          /\(\s*(\d+)\s*%\s*\)/
        );

      if (percentMatch) {
        latestPercent =
          Number(percentMatch[1]);

        break;
      }
    }

    /*
     * 限制在 0 ~ 100
     */
    currentPercent =
      Math.min(
        Math.max(
          latestPercent,
          0
        ),
        100
      );

    return {
      firmwareCount,
      currentFirmware,
      currentPercent
    };
  }, [logs]);

  /*
   * ================================
   * 当前显示百分比
   * ================================
   *
   * 每个固件独立计算：
   *
   * 固件 1：
   * 0 → 100
   *
   * 固件 2：
   * 0 → 100
   *
   * 不做：
   *
   * 50 / 2
   * 100 / 2
   *
   * 之类的总进度计算。
   */
  const percent =
    burnInfo.currentPercent;

  /*
   * ================================
   * 日志自动滚动到底部
   * ================================
   */
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop =
        logRef.current.scrollHeight;
    }
  }, [logs]);

  /*
   * 不在烧录状态时不显示
   */
  if (!isLoading) {
    return null;
  }

  const isMicrobit =
    logs &&
    logs.includes(
      "__MODE_MICROBIT__"
    );

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>

        {/* =========================
            百分比
           ========================= */}
        <div
          className={
            styles.percentWrapper
          }
        >
          <div
            className={
              styles.percent
            }
          >
            {percent}%
          </div>

          <div
            className={
              styles.spinner
            }
          />
        </div>

        {/* =========================
            进度条
           ========================= */}
        <div
          className={
            styles.barOuter
          }
        >
          <div
            className={
              styles.barInner
            }
            style={{
              width: `${percent}%`
            }}
          />
        </div>

        {/* =========================
            固件信息
           ========================= */}
        {!isMicrobit && (
          <div
            className={
              styles.firmwareInfo
            }
          >
            {/* {burnInfo.firmwareCount > 1
              ? `${burnInfo.currentFirmware} / ${burnInfo.firmwareCount}`
              : "正在烧录固件"} */}
              {`${burnInfo.currentFirmware} / ${burnInfo.firmwareCount}`}
          </div>
        )}

        {/* =========================
            日志
           ========================= */}
        <div
          className={styles.logBox}
          ref={logRef}
        >
          {logs &&
          logs.length > 0 ? (
            logs.map(
              (line, idx) => {

                /*
                 * =========================
                 * 隐藏内部控制标记
                 * =========================
                 *
                 * 这些数据只是给 BurnLogs
                 * 用来计算状态的，不需要显示。
                 */
                if (
                  typeof line ===
                    "string" &&
                  (
                    line.startsWith(
                      "__FIRMWARE_COUNT__:"
                    ) ||
                    line.startsWith(
                      "__FIRMWARE_STAGE__:"
                    ) ||
                    line ===
                      "__MODE_MICROBIT__" ||
                    line ===
                      "__MODE_DUAL__" ||
                    line ===
                      "__STAGE_2__"
                  )
                ) {
                  return null;
                }

                /*
                 * Microbit 的数字日志
                 *
                 * 例如：
                 * 0
                 * 25
                 * 50
                 * 100
                 */
                const isNumber =
                  typeof line ===
                    "string" &&
                  /^\d+$/.test(
                    line
                  );

                return (
                  <div
                    key={idx}
                    className={
                      styles.logLine
                    }
                  >
                    {isNumber
                      ? `Data written ${line}`
                      : line}
                  </div>
                );
              }
            )
          ) : (
            <div
              className={
                styles.logEmpty
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BurnLogs;






