// import React, { useEffect, useRef } from 'react';
// import styles from './BurnLogs.css'; // 用 CSS Module 命名规范

// const BurnLogs = ({ isLoading, logs }) => {
//   const logEndRef = useRef(null);

//   useEffect(() => {
//     if (logEndRef.current) {
//       logEndRef.current.scrollIntoView({ behavior: 'smooth' });
//     }
//   }, [logs]);

//   if (!isLoading) return null;

//   return (
//     <div className={styles.loadingOverlay}>
//       <div className={styles.logBox}>
//         {logs.map((log, index) => (
//           <div key={index} className={styles.logLine}>{log}</div>
//         ))}
//         <div ref={logEndRef} />
//       </div>
//     </div>
//   );
// };

// export default BurnLogs;


// import React, { useMemo } from "react";
// import styles from "./BurnLogs.css";

// const BurnLogs = ({ isLoading, logs }) => {
//   const percent = useMemo(() => {
//     if (!logs || logs.length === 0) return 0;

//     let flashPercent = null;   // stdout (xx %) → 前 50
//     let uploadPercent = null;  // {"type":"progress"} → 后 50

//     // 解析 Flash 阶段的日志 "( xx % )"
//     for (let i = logs.length - 1; i >= 0; i--) {
//       const match = logs[i].match(/\((\d+)\s*%\)/);
//       if (match) {
//         flashPercent = Number(match[1]);
//         break;
//       }
//     }

//     // 解析 Upload 阶段的 JSON progress
//     for (let i = logs.length - 1; i >= 0; i--) {
//       try {
//         const obj = JSON.parse(logs[i]);
//         if (obj?.type === "progress") {
//           uploadPercent = Number(obj.value);
//           break;
//         }
//       } catch {}
//     }

//     // 计算总进度
//     let finalPercent = 0;

//     if (flashPercent !== null) {
//       finalPercent = (flashPercent / 100) * 50; // 0~50%
//     }

//     if (uploadPercent !== null) {
//       finalPercent = 50 + (uploadPercent / 100) * 50; // 50~100%
//     }

//     return Math.min(100, Math.round(finalPercent));
//   }, [logs]);

//   if (!isLoading) return null;

//   return (
//     <div className={styles.overlay}>
//       <div className={styles.box}>
//         <div className={styles.title}>正在烧录固件</div>

//         <div className={styles.percent}>{percent}%</div>

//         <div className={styles.barOuter}>
//           <div
//             className={styles.barInner}
//             style={{ width: `${percent}%` }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BurnLogs;


// import React, { useMemo , useEffect, useRef} from "react";
// import styles from "./BurnLogs.css";

// const BurnLogs = ({ isLoading, logs }) => {
  
//   const percent = useMemo(() => {
//     if (!logs || logs.length === 0) return 0;


//     const done = logs.some(
//       (l) =>
//         l.includes("Child process exited with code 0") ||
//         l.includes("Hard resetting")
//     );
//     if (done) return 100;

//     const last = logs[logs.length - 1];

//     // ⭐ 规则 1：最新日志是纯数字 → 直接进度
//     if (/^\d+$/.test(last)) {
//       const num = Number(last);
//       return Math.min(100, Math.max(0, num));
//     }

//     // ⭐ 新规则 2：Writing at xxx (97 %) → 直接使用括号百分比
//     const writingMatch = last.match(/^Writing.*\((\d+)\s*%\)/);
//     if (writingMatch) {
//       const num = Number(writingMatch[1]);
//       return Math.min(100, Math.max(0, num));
//     }

//     // ======================================================
//     //          以下是你原有逻辑，完全未改
//     // ======================================================

//     const stdoutPercents = [];
//     const jsonPercents = [];

//     for (let i = 0; i < logs.length; i++) {
//       const line = logs[i];

//       // stdout "(xx %)"
//       const m = line.match(/\((\d+)\s*%\)/);
//       if (m) {
//         stdoutPercents.push(Number(m[1]));
//         continue;
//       }

//       // JSON {"type":"progress"}
//       try {
//         const obj = JSON.parse(line);
//         if (obj?.type === "progress") {
//           jsonPercents.push(Number(obj.value));
//         }
//       } catch {}
//     }

//     if (stdoutPercents.length === 0 && jsonPercents.length === 0) {
//       return 0;
//     }

//     let phase1 = null;
//     let phase2 = null;

//     const idx100 = stdoutPercents.indexOf(100);

//     if (idx100 !== -1) {
//       phase1 = 100;

//       if (stdoutPercents.length > idx100 + 1) {
//         phase2 = stdoutPercents[stdoutPercents.length - 1];
//       } else if (jsonPercents.length > 0) {
//         phase2 = jsonPercents[jsonPercents.length - 1];
//       }
//     } else {
//       phase1 = stdoutPercents[stdoutPercents.length - 1];
//     }

//     let final = 0;

//     if (phase1 != null) {
//       final = (phase1 / 100) * 50;
//     }

//     if (phase2 != null) {
//       final = 50 + (phase2 / 100) * 50;
//     }

//     return Math.min(100, Math.round(final));
//   }, [logs]);

//   const logRef = useRef(null);

//   useEffect(() => {
//     if (logRef.current) {
//       logRef.current.scrollTop = logRef.current.scrollHeight;
//     }
//   }, [logs]);

//   if (!isLoading) return null;

//   return (
//     <div className={styles.overlay}>
//       <div className={styles.box}>
//         {/* <div className={styles.title}>正在烧录固件</div> */}

//         <div className={styles.percent}>{percent}%</div>

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


import React, { useMemo, useEffect, useRef } from "react";
import styles from "./BurnLogs.css";

const BurnLogs = ({ isLoading, logs }) => {
  
  const percent = useMemo(() => {
    if (!logs || logs.length === 0) return 0;

    const done = logs.some(
      (l) =>
        l.includes("Child process exited with code 0") ||
        l.includes("Hard resetting")
    );
    if (done) return 100;

    const last = logs[logs.length - 1];

    // ⭐ 规则 1：最新日志是纯数字 → 直接进度
    if (/^\d+$/.test(last)) {
      const num = Number(last);
      return Math.min(100, Math.max(0, num));
    }

    // ⭐ 新规则 2：Writing at xxx (97 %) → 直接使用括号百分比
    const writingMatch = last.match(/^Writing.*\((\d+)\s*%\)/);
    if (writingMatch) {
      const num = Number(writingMatch[1]);
      return Math.min(100, Math.max(0, num));
    }

    // ======================================================
    //          以下是你原有逻辑，完全未改
    // ======================================================

    const stdoutPercents = [];
    const jsonPercents = [];

    for (let i = 0; i < logs.length; i++) {
      const line = logs[i];

      // stdout "(xx %)"
      const m = line.match(/\((\d+)\s*%\)/);
      if (m) {
        stdoutPercents.push(Number(m[1]));
        continue;
      }

      // JSON {"type":"progress"}
      try {
        const obj = JSON.parse(line);
        if (obj?.type === "progress") {
          jsonPercents.push(Number(obj.value));
        }
      } catch {}
    }

    if (stdoutPercents.length === 0 && jsonPercents.length === 0) {
      return 0;
    }

    let phase1 = null;
    let phase2 = null;

    const idx100 = stdoutPercents.indexOf(100);

    if (idx100 !== -1) {
      phase1 = 100;

      if (stdoutPercents.length > idx100 + 1) {
        phase2 = stdoutPercents[stdoutPercents.length - 1];
      } else if (jsonPercents.length > 0) {
        phase2 = jsonPercents[jsonPercents.length - 1];
      }
    } else {
      phase1 = stdoutPercents[stdoutPercents.length - 1];
    }

    let final = 0;

    if (phase1 != null) {
      final = (phase1 / 100) * 50;
    }

    if (phase2 != null) {
      final = 50 + (phase2 / 100) * 50;
    }

    return Math.min(100, Math.round(final));
  }, [logs]);

  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isLoading) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        {/* <div className={styles.title}>正在烧录固件</div> */}

        <div className={styles.percentWrapper}>
          <div className={styles.percent}>{percent}%</div>
          {/* 添加旋转的圆圈 */}
          <div className={styles.spinner}></div>
        </div>

        <div className={styles.barOuter}>
          <div
            className={styles.barInner}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className={styles.logBox} ref={logRef}>
          {logs && logs.length > 0 ? (
            logs.map((line, idx) => {
              const isNumber = typeof line === "string" && /^\d+$/.test(line);

              return (
                <div key={idx} className={styles.logLine}>
                  {isNumber ? `Data written ${line}` : line}
                </div>
              );
            })
          ) : (
            <div className={styles.logEmpty}></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BurnLogs;






