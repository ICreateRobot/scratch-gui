import React, { useEffect, useMemo, useState } from "react";
import styles from "./IotScan.module.css";

const IOT_IP_KEY = "iot_server_ip";


function isValidIP(ip) {
    const reg = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    return reg.test(ip);
}

async function connServer(ip) {
    try {
        const res = await fetch(`http://${ip}:3000/iot/connect`);

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "服务器错误");
        }

        return await res.json();
    } catch (err) {
        // fetch失败（服务器没启动、网络异常等）
        throw new Error(err.message || "无法连接服务");
    }
}

const IotScan = ( ) => {
    const [visible, setVisible] = useState(false);
    const [ip, setIp] = useState(() => {
        return localStorage.getItem(IOT_IP_KEY) || "";
    });// IP
    const [connected, setConnected] = useState(false);// 是否已经连接
    const [connecting, setConnecting] = useState(false);// 正在连接
    const [currentDevice, setCurrentDevice] = useState("");// 当前选择的设备
    const [deviceData, setDeviceData] = useState({});// 服务器返回的设备数据

    //打开弹窗
    useEffect(() => {
        const handleOpen = () => {
            console.log("打开 IoT 连接窗口");
            setVisible(true);
        };

        window.addEventListener("iot-scan-open", handleOpen);

        return () => {
            window.removeEventListener("iot-scan-open", handleOpen);
        };
    }, []);

    // 根据服务器返回的数据生成设备列表
    const options = useMemo(() => {
        const data = deviceData || {};
        const list = [];

        // 学生机
        if (data.students) {
            Object.keys(data.students)
                .sort((a, b) => Number(a) - Number(b))
                .forEach(id => {
                    list.push({
                        value: `student_${id}`,
                        label: `学生机${id}`
                    });
                });
        }

        // 教室
        if (data.classroom) {
            list.push({
                value: "classroom",
                label: "教室"
            });
        }

        return list;
    }, [deviceData]);

    // 连接服务器
    const handleConnect = async () => {
        if (!ip) {
            vm.runtime.ioDevices.toast.guiToast("", "请输入IP", 'error', 2000);
            return;
        }
        if (!isValidIP(ip)) {
            vm.runtime.ioDevices.toast.guiToast("", "IP格式不正确", 'error', 2000);
            return;
        }

        setConnecting(true);

        try {
            const result = await connServer(ip);

            if (result.success) {
                console.log("IoT服务器连接成功：", result.data);

                // 保存服务器返回的数据
                setDeviceData(result.data);
                // 保存服务器 IP
                vm.runtime.ioServer = ip;
                // 保存到 localStorage
                localStorage.setItem(IOT_IP_KEY, ip);

                setConnected(true);
            } else {
                vm.runtime.ioDevices.toast.guiToast("", "连接服务器失败", 'error', 2000);

                setDeviceData({});
                vm.runtime.ioServer = "";

                setConnected(false);
                setCurrentDevice("");
            }

        } catch (err) {
            console.error("连接IoT服务器失败：", err);

            setDeviceData({});
            vm.runtime.ioServer = "";

            setConnected(false);
            setCurrentDevice("");

            vm.runtime.ioDevices.toast.guiToast("", "无法连接服务器,检查服务器是否启动或者网络是否正常", 'error', 5000);
        } finally {
            setConnecting(false);
        }
    };

    //刷新连接
    const handleReconnect = async () => {
        if (!vm.runtime.ioServer) {
            return;
        }
        setConnecting(true);
        try {
            const result = await connServer(vm.runtime.ioServer);
            if (result.success) {
                setDeviceData(result.data);
                setConnected(true);
            } else {
                vm.runtime.ioDevices.toast.guiToast("", "连接服务器失败", 'error', 2000);
                setDeviceData({});
                vm.runtime.ioServer = "";
                setConnected(false);
                setCurrentDevice("");
            }
        } catch (err) {
            setDeviceData({});
            vm.runtime.ioServer = "";
            setConnected(false);
            setCurrentDevice("");
            vm.runtime.ioDevices.toast.guiToast("", "无法连接服务器,检查服务器是否启动或者网络是否正常", 'error', 5000);
        } finally {
            setConnecting(false);
        }
    };

    //设备列表发生变化后 自动选择第一个设备
    useEffect(() => {
        if (!connected) {
            setCurrentDevice("");
            return;
        }

        if (options.length > 0) {
            setCurrentDevice(options[0].value);
        } else {
            setCurrentDevice("");
        }
    }, [options, connected]);

    // 当前设备发生变化  更新 vm.runtime.iotList
    useEffect(() => {
        const data = deviceData || {};

        if (!currentDevice) {
            vm.runtime.iotList = null;
            return;
        }

        let result = null;

        if (currentDevice === "classroom") {
            result = data.classroom;
        }

        if (currentDevice.startsWith("student_")) {
            const id = currentDevice.split("_")[1];
            result = data.students?.[id];
        }

        console.log("当前选中设备数据：", {
            type: currentDevice,
            data: result
        });

        vm.runtime.iotList = result;

    }, [currentDevice, deviceData]);

    // 关闭弹窗
    const handleClose = () => {
        setVisible(false);
    };



    if (!visible) {
        return null;
    }

    return (
        <div className={styles.mask}>
            <div className={styles.modal}>

                {/* Header */}
                <div className={styles.header}>
                    <span>
                        连接物联网服务器
                    </span>

                    <button  onClick={handleClose} className={styles.close} >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>

                    {/* IP */}
                    <div className={styles.field}>
                        <label className={styles.label}>
                            服务器 IP
                        </label>

                        <div className={styles.connectRow}>
                            <input
                                value={ip}
                                placeholder="请输入服务器 IP"
                                onChange={(e) => setIp(e.target.value)}
                                className={styles.input}
                                disabled={connecting}
                            />

                            <button  onClick={handleConnect}  className={styles.connectButton} disabled={connecting} >
                                {connecting ? "连接中..." : "连接"}
                            </button>
                        </div>
                    </div>

                    {/* 连接状态 */}
                    {connected && (
                        <div className={styles.status}>
                            <span className={styles.statusDot}></span>
                            
                            <span>已连接：{vm.runtime.ioServer}</span>

                            <button
                                className={styles.reconnectButton}
                                onClick={handleReconnect}
                                disabled={connecting}
                                title="刷新"
                            >
                                🔄
                            </button>
                        </div>
                    )}

                    {/* 设备选择 */}
                    {connected && (
                        <div className={styles.field}>
                            <label className={styles.label}>
                                选择设备
                            </label>

                            {options.length > 0 ? (
                                <select
                                    value={currentDevice}
                                    onChange={(e) =>
                                        setCurrentDevice(e.target.value)
                                    }
                                    className={styles.select}
                                >
                                    {options.map(item => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className={styles.noDevice}>
                                    暂无可用设备
                                </div>
                            )}
                        </div>
                    )}

                    {/* 未连接 */}
                    {!connected && (
                        <div className={styles.empty}>
                            请输入物联网服务器 IP 并连接
                        </div>
                    )}

                </div>

                {/* Footer */}
                {/* <div className={styles.footer}>

                    <button className={styles.cancelButton} onClick={handleClose} >
                        取消
                    </button>

                    <button
                        className={styles.confirmButton}
                        onClick={handleConfirm}
                        disabled={!connected || options.length === 0}
                    >
                        确定
                    </button>

                </div> */}

            </div>
        </div>
    );
};



export default IotScan;