import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import formatMessage  from 'format-message';
import { FormattedMessage } from "react-intl";

import styles from './FlashProgressModal.css';

const FlashProgress = ({ logs, onClose }) => {
    const [progress, setProgress] = useState(0);
    const [isFlashProblem, setFlashProblem] = useState(false);
    const isReciveErrRef = useRef(false);

    // =========================================================
    // 日志滚动相关
    // =========================================================

    // 日志 DOM
    const logContentRef = useRef(null);

    // 是否允许自动滚到底部
    //
    // true  = 自动滚动
    // false = 用户正在查看历史日志
    const shouldAutoScrollRef = useRef(true);

    // 标记当前是不是程序自己在滚动
    //
    // 防止：
    // element.scrollTop = ...
    //
    // 触发 onScroll 后，被误认为是用户滚动
    const isProgrammaticScrollRef = useRef(false);

    // =========================================================
    // logs 转换成字符串
    // =========================================================

    const rawLogText = useMemo(() => {
        if (!logs) return '';

        if (Array.isArray(logs)) {
            return logs.join('\n');
        }

        if (typeof logs === 'object') {
            return JSON.stringify(logs, null, 2);
        }

        return String(logs);
    }, [logs]);

    // =========================================================
    // 日志显示内容
    // =========================================================

    const logText = useMemo(() => {
        if (!rawLogText) return '';

        // 将乱码 � 替换成 ■
        return rawLogText.replace(/�+/g, (match) => {
            return '■'.repeat(match.length);
        });
    }, [rawLogText]);

    // =========================================================
    // 是否已经收到 flash-exit
    // =========================================================

    const isFlashExited = useMemo(() => {
        return rawLogText.includes('flash-exit');
    }, [rawLogText]);

    // =========================================================
    // 根据日志判断当前烧录状态
    // =========================================================

    const flashStatusText = useMemo(() => {
        if (!rawLogText) {
            return formatMessage({
                id: "flash.waitPrint",
                default: "Waiting for the flashing program output....",
                description: "flash.waitPrint",
            })
        }
        if (rawLogText.includes('cli-failedError')) {
            return formatMessage({
                id: "flash.compileError",
                default: "Compile error",
                description: "flash.compileError",
            });
        }

        // flash-exit0 表示烧录成功
        if (rawLogText.includes('flash-exit0')) {
            return formatMessage({
                id: "flash.flashSuccess",
                default: "Flashing successful",
                description: "flash.flashSuccess",
            });
        }

        // flash-exit1 表示烧录失败
        if (rawLogText.includes('flash-exit1')) {
            return formatMessage({
                id: "flash.flashFailed",
                default: "Flashing failed",
                description: "flash.flashFailed",
            });
        }

        // start flash 表示开始烧录
        if (rawLogText.includes('start flash')) {
            return formatMessage({
                id: "flash.flashing",
                default: "Flashing...",
                description: "flash.flashing",
            });
        }

        // start compile 表示开始编译
        if (rawLogText.includes('start compile')) {
            return formatMessage({
                id: "flash.compiling",
                default: "Compiling...",
                description: "flash.compiling",
            });
        }
        


        // 如果没有匹配到新的状态，保持原来的显示逻辑
        if (isFlashExited) {
            return formatMessage({
                id: "flash.firmwareComplete",
                default: "Firmware flashing complete",
                description: "flash.firmwareComplete",
            });
        }

        if (progress < 50) {
            return  formatMessage({
                id: "flash.writingFirmware",
                default: "Writing firmware...",
                description: "flash.writingFirmware",
            });
        }

        if (progress < 100) {
            return formatMessage({
                id: "flash.verifyingFirmware",
                default: "Verifying firmware...",
                description: "flash.verifyingFirmware",
            });
        }

        return formatMessage({
            id: "flash.waitingExit",
            default: "Flashing complete, waiting to exit...",
            description: "flash.waitingExit",
        });
    }, [rawLogText, isFlashExited, progress]);

    // =========================================================
    // 判断当前是否已经在日志底部
    // =========================================================

    const isLogAtBottom = () => {
        const element = logContentRef.current;

        if (!element) {
            return true;
        }

        const distanceFromBottom =
            element.scrollHeight -
            element.scrollTop -
            element.clientHeight;

        // 允许 20px 误差
        return distanceFromBottom <= 20;
    };

    // =========================================================
    // 滚动到日志底部
    // =========================================================

    const scrollLogToBottom = () => {
        const element = logContentRef.current;

        if (!element) return;

        isProgrammaticScrollRef.current = true;

        element.scrollTop = element.scrollHeight;

        // scroll 事件可能在下一帧触发
        // 稍微延迟后解除程序滚动标记
        requestAnimationFrame(() => {
            isProgrammaticScrollRef.current = false;
        });
    };

    // =========================================================
    // 用户滚动日志
    // =========================================================

    const handleLogScroll = () => {
        const element = logContentRef.current;

        if (!element) return;

        // 如果是程序自己滚动，不处理
        if (isProgrammaticScrollRef.current) {
            return;
        }

        const distanceFromBottom =
            element.scrollHeight -
            element.scrollTop -
            element.clientHeight;

        // -----------------------------------------------------
        // 用户已经回到底部
        // -----------------------------------------------------

        if (distanceFromBottom <= 20) {
            shouldAutoScrollRef.current = true;
        }

        // -----------------------------------------------------
        // 用户主动向上查看历史日志
        // -----------------------------------------------------

        else {
            shouldAutoScrollRef.current = false;
        }
    };

    // =========================================================
    // 用户鼠标滚轮
    //
    // 这个判断比单纯依赖 scroll 事件更加可靠。
    // =========================================================

    const handleLogWheel = (event) => {
        const element = logContentRef.current;

        if (!element) return;

        // 向上滚动
        if (event.deltaY < 0) {
            shouldAutoScrollRef.current = false;
            return;
        }

        // 向下滚动
        if (event.deltaY > 0) {
            // 如果已经接近底部，则恢复自动滚动
            if (isLogAtBottom()) {
                shouldAutoScrollRef.current = true;
            }
        }
    };

    // =========================================================
    // 日志发生变化
    //
    // 如果用户没有主动向上查看历史日志：
    // 自动滚到底部
    // =========================================================

    useEffect(() => {
        if (!logText) return;

        // 用户正在查看历史日志
        if (!shouldAutoScrollRef.current) {
            return;
        }

        // 第一次立即滚动
        scrollLogToBottom();

        // 再下一帧滚动一次
        //
        // 防止 React DOM 更新、字体换行等导致
        // 第一次 scrollHeight 还没有完全计算完成
        const frame1 = requestAnimationFrame(() => {
            if (!shouldAutoScrollRef.current) {
                return;
            }

            scrollLogToBottom();

            // 再延迟一帧
            const frame2 = requestAnimationFrame(() => {
                if (!shouldAutoScrollRef.current) {
                    return;
                }

                scrollLogToBottom();
            });

            return () => {
                cancelAnimationFrame(frame2);
            };
        });

        return () => {
            cancelAnimationFrame(frame1);
        };
    }, [logText]);

    // =========================================================
    // 初始化时自动滚到底部
    //
    // 防止组件刚打开时日志已经很多
    // =========================================================

    useEffect(() => {
        const timer = setTimeout(() => {
            if (shouldAutoScrollRef.current) {
                scrollLogToBottom();
            }
        }, 50);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    // =========================================================
    // 从日志中提取 Writing / Verifying 百分比
    // =========================================================

    useEffect(() => {
        if (!rawLogText) return;

        const matches = [
            ...rawLogText.matchAll(
                /(?:Writing|Verifying):\s*(\d+)%/gi
            )
        ];

        if (matches.length > 0) {
            const lastMatch =
                matches[matches.length - 1];

            const value =
                parseInt(lastMatch[1], 10);

            if (!isNaN(value)) {
                const lastStage =
                    lastMatch[0]
                        .toLowerCase()
                        .startsWith('verifying');

                if (lastStage) {
                    // Verifying：50% ~ 100%
                    setProgress(
                        50 + value / 2
                    );
                } else {
                    // Writing：0% ~ 50%
                    setProgress(
                        value / 2
                    );
                }
            }
        }

        // =====================================================
        // 检测烧录完成
        // =====================================================

        if (
            rawLogText.includes('DONE.') ||
            (
                rawLogText.includes('SUCCESS:') &&
                rawLogText.includes(
                    'written and verified'
                )
            )
        ) {
            setProgress(100);
        }
    }, [rawLogText]);


    // 报错信息提取
    useEffect(() => {
        if (!rawLogText) return;
        if (isReciveErrRef.current) return;

        // py32/arduino的编译报错
        if (rawLogText.includes('cli-failedError during build: exit status 1')) {
            alert(formatMessage({
                id: "flash.compileError",
                default: "Syntax error, please check the error log",
                description: "flash.compileError",
            }))
            isReciveErrRef.current = true
            setFlashProblem(true)
        }

        // py32的烧录报错
        if (rawLogText.includes('flash-exit1')) {
            alert(formatMessage({
                id: "flash.flashError",
                default: "Flashing error, please check the error log",
                description: "flash.flashError",
            }))
            isReciveErrRef.current = true
            setFlashProblem(true)
        }

        // arduino的烧录报错
        if (rawLogText.includes('unoFlash-failed')) {
            alert(formatMessage({
                id: "flash.flashError",
                default: "Flashing error, please check the error log",
                description: "flash.flashError",
            }))
            isReciveErrRef.current = true
            setFlashProblem(true)
        }

        if (rawLogText.includes('flash-exit0')) {
            alert(formatMessage({
                id: "flash.flashSuccess",
                default: "Flashing successful",
                description: "flash.flashSuccess",
            }))
            setFlashProblem(true)
            onClose()
        }

    }, [rawLogText]);

    let waitPrint=formatMessage({
        id: "flash.waitPrint",
        default: "Waiting for the flashing program output....",
        description: "flash.waitPrint",
    })

    // =========================================================
    // JSX
    // =========================================================

    return (
        <div className={styles.flashOverlay}>

            <div className={styles.flashContainer}>

                {/* =================================================
                    标题
                ================================================= */}

                <div className={styles.flashHeader}>

                    <div className={styles.flashTitle}>
                        <FormattedMessage
                            defaultMessage="Download Progress"
                            description="Download Progress"
                            id="flash.progress"
                        />
                    </div>

                    {/* 烧录中的转圈动画 */}
                    {!isFlashExited && (
                        <div className={styles.loadingSpinner} />
                    )}

                </div>

                {/* =================================================
                    状态
                ================================================= */}

                <div className={styles.flashStatus}>
                    {flashStatusText}
                </div>

                {/* =================================================
                    日志
                ================================================= */}

                <div className={styles.logWrapper}>

                    <div className={styles.logHeader}>
                        <FormattedMessage
                            defaultMessage="Logs"
                            description="Logs"
                            id="flash.logs"
                        />
                    </div>

                    <pre
                        ref={logContentRef}
                        className={styles.logContent}
                        onScroll={handleLogScroll}
                        onWheel={handleLogWheel}
                    >
                        {logText ||
                            waitPrint}
                    </pre>

                </div>

                {/* =================================================
                    完成按钮
                ================================================= */}

                {(isFlashExited || isFlashProblem) && onClose && (

                    <div className={styles.buttonWrapper}>

                        <button
                            className={styles.closeButton}
                            onClick={onClose}
                        >
                            <FormattedMessage
                                defaultMessage="Finish"
                                description="Finish"
                                id="flash.finish"
                            />
                        </button>

                    </div>

                )}

            </div>

        </div>
    );
};

export default FlashProgress;

