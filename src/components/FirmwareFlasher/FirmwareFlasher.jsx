// FirmwareFlasher.jsx
import React, {useEffect, useState, useRef } from "react";
import { ESPLoader, Transport } from "esptool-js"; // 官方示例用法
import styles from "./FirmwareFlasher.css";
import {getCurrent } from '../utils/utils.js';
import {FormattedMessage} from 'react-intl';
import formatMessage  from 'format-message';
import {setMicrobitUrl} from '../utils/utils.js'
import {setVersion,getVersion } from '../utils/utils.js';
import { DAPLink, WebUSB } from 'dapjs';

import {getGiteeTocken,getGithubTocken} from '../utils/TockenDb'
/**
 * FirmwareFlasher
 * - 保留原来逻辑：ICRobot 普通固件 => flash then prompt reconnect => upload py+mpy
 * - 小智固件 => 仅 flash
 *
*    public/static/model/
 *   public/static/model/firmware.bin
 *   public/static/model/combined.bin
 *   public/static/model/main.py
 *   public/static/model/icrobot.mpy
 */

const currentURL = window.location.href;
const oneLevelUp = currentURL.substring(0, currentURL.lastIndexOf("/"));
const modelPath = oneLevelUp + "/static/model";
const FLASH_COMMON_PATH = `${modelPath}/firmware.bin`;
const FLASH_VFS = `${modelPath}/vfs.bin`;
const FLASH_COMBINED_PATH = `${modelPath}/combined.bin`;
const PY_PATH = `${modelPath}/main.py`;
const MPY_PATH = `${modelPath}/icrobot.mpy`;
const MICRO_PATH = `${modelPath}/MICROBIT.hex`

let USE_GITEE=true


/******************* GITEE CONFIG *******************/
const GITEE_OWNER = 'lgmShine';
const GITEE_REPO = 'bucket';
const GITEE_BRANCH = 'master';
const GITEE_BASE_FOLDER = 'firmware';
const GITEE_TOKEN = getGiteeTocken();


/******************* GITHUB CONFIG *******************/
const GITHUB_OWNER = 'ICreateRobot';
const GITHUB_REPO = 'bucket';
const GITHUB_BRANCH = 'master'; // 或 main
const GITHUB_BASE_FOLDER = 'firmware';
const GITHUB_TOKEN = getGithubTocken(); // 可选，国外一般不需要

function giteeApiUrl(path, params = {}) {
  const base = `https://gitee.com/api/v5${path}`;
  const qs = new URLSearchParams(params).toString();
  return qs ? `${base}?${qs}` : base;
}

function repoApiUrl(path, params = {}) {
  if (USE_GITEE) {
    const base = `https://gitee.com/api/v5${path}`;
    const qs = new URLSearchParams(params).toString();
    return qs ? `${base}?${qs}` : base;
  } else {
    const base = `https://api.github.com${path}`;
    const qs = new URLSearchParams(params).toString();
    return qs ? `${base}?${qs}` : base;
  }
}


function repoHeaders() {
  if (USE_GITEE && GITEE_TOKEN) {
    return { Authorization: `token ${GITEE_TOKEN}` };
  }
  if (!USE_GITEE && GITHUB_TOKEN) {
    return { Authorization: `Bearer ${GITHUB_TOKEN}` };
  }
  return {};
}
function giteeRawUrl(repoPath) {
  return `https://gitee.com/${GITEE_OWNER}/${GITEE_REPO}/raw/${GITEE_BRANCH}/${repoPath}`;
}


export default function FirmwareFlasher({ onRequestClose, handleFirmwareData}) {
  const [busy, setBusy] = useState(false);
  const [awaitReconnect, setAwaitReconnect] = useState(false);
  const [progress, setProgress] = useState({ stage: "", percent: 0 });
  const [log, setLog] = useState("");
  const readerRef = useRef(null);
  const writerRef = useRef(null);
  const [version, setVersionIn] = useState(getVersion().microbit ||
  getVersion().icrobot ||
  getVersion().icbricks ||
    '');

  const channelVersion = new BroadcastChannel('channel-version')
  channelVersion.addEventListener('message',(event)=>{
    setVersionIn(event.data)
  })

  const channelLoading = new BroadcastChannel('channel-loading-tabSwitcher')



  const logRef = useRef(null);

  const [giteeFirmware, setGiteeFirmware] = useState({
    standard: [],
    xiaozhi: [],
    microbit:[]
  });

  const [selectedStandardFirmware, setSelectedStandardFirmware] = useState('local');
  const [selectedXiaoZhiFirmware, setSelectedXiaoZhiFirmware] = useState('local');
  const [selectedMicrobitFirmware, setSelectedMicrobitFirmware] = useState('local');

  

  // const loadGiteeFirmwareList = async () => {
  //   try {
  //     appendLog("正在从 Gitee 获取固件列表...");
  //     const headers = GITEE_TOKEN
  //       ? { Authorization: `token ${GITEE_TOKEN}` }
  //       : {};

  //     const listType = async (type) => {
  //       const basePath = `${GITEE_BASE_FOLDER}/${type}`;
  //       const url = giteeApiUrl(
  //         `/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${basePath}`,
  //         { ref: GITEE_BRANCH, per_page: 100 }
  //       );

  //       const res = await fetch(url, { headers });
  //       if (!res.ok) throw new Error("获取固件目录失败");

  //       const dirs = (await res.json()).filter(i => i.type === "dir");
  //       const result = [];

  //       for (const d of dirs) {
  //         const folderPath = d.path;

  //         /* ---------- 1️⃣ 读取该目录内容 ---------- */
  //         const contentsUrl = giteeApiUrl(
  //           `/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${folderPath}`,
  //           { ref: GITEE_BRANCH, per_page: 100 }
  //         );
  //         const r2 = await fetch(contentsUrl, { headers });
  //         if (!r2.ok) continue;

  //         const files = await r2.json();

  //         /* ---------- 2️⃣ 读取 version.txt（API，无 CORS） ---------- */
  //         let version = d.name;
  //         const vfile = files.find(f => f.name.toLowerCase() === "version.txt");

  //         if (vfile) {
  //           try {
  //             const vApiUrl = giteeApiUrl(
  //               `/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${vfile.path}`,
  //               { ref: GITEE_BRANCH }
  //             );
  //             const vr = await fetch(vApiUrl, { headers });
  //             const vjson = await vr.json();
  //             if (vjson?.content) {
  //               version = atob(vjson.content.replace(/\n/g, "")).trim();
  //             }
  //           } catch (e) {
  //             console.warn("读取 version.txt 失败", e);
  //           }
  //         }

  //         /* ---------- 3️⃣ bin 文件（raw，用于烧录） ---------- */
  //         const bins = files
  //           .filter(f => f.name.toLowerCase().endsWith(".bin"))
  //           .map(f => ({
  //             name: f.name,
  //             url: giteeApiUrl(
  //                 `/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${f.path}`,
  //                 { ref: GITEE_BRANCH }
  //               ),
  //           }));

  //         if (!bins.length) continue;

  //         /* ---------- 4️⃣ 获取该目录的 commit 记录 ---------- */
  //         let commits = [];
  //         try {
  //           const commitsUrl = giteeApiUrl(
  //             `/repos/${GITEE_OWNER}/${GITEE_REPO}/commits`,
  //             {
  //               path: folderPath,
  //               sha: GITEE_BRANCH,
  //               per_page: 5,
  //             }
  //           );
  //           const cr = await fetch(commitsUrl, { headers });
  //           const cjson = await cr.json();

  //           commits = (cjson || []).map(c => ({
  //             sha: c.sha,
  //             message: c.commit?.message?.split("\n")[0] || "",
  //             author: c.commit?.committer?.name || "",
  //             date: c.commit?.committer?.date || "",
  //           }));
  //         } catch (e) {
  //           console.warn("获取提交记录失败", e);
  //         }

  //         result.push({
  //           folder: d.name,
  //           version,
  //           bins,
  //           commits,
  //         });
  //       }

  //       return result;
  //     };

  //     const [standard, xiaozhi] = await Promise.all([
  //       listType("standard"),
  //       listType("xiaozhi"),
  //     ]);

  //     setGiteeFirmware({ standard, xiaozhi });
  //     appendLog("Gitee 固件列表加载完成");
  //   } catch (err) {
  //     appendLog("获取 Gitee 固件失败: " + err.message);
  //   }
  // };


  // useEffect(() => {
  //   loadGiteeFirmwareList();
  // }, []);


  // const loadRepoFirmwareList = async () => {
  //   try {
  //     console.log(`正在从 ${USE_GITEE ? 'Gitee' : 'GitHub'} 获取固件列表...`);
  
  //     const headers = repoHeaders();
  
  //     const listType = async (type) => {
  //       const basePath = `${USE_GITEE ? GITEE_BASE_FOLDER : GITHUB_BASE_FOLDER}/${type}`;
  
  //       const url = USE_GITEE
  //         ? repoApiUrl(
  //             `/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${basePath}`,
  //             { ref: GITEE_BRANCH, per_page: 100 }
  //           )
  //         : repoApiUrl(
  //             `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${basePath}`,
  //             { ref: GITHUB_BRANCH }
  //           );
  
  //       const res = await fetch(url, { headers });
  //       if (!res.ok) throw new Error("获取固件目录失败");
  
  //       const items = await res.json();
  //       const dirs = items.filter(i => i.type === "dir");
  //       const result = [];
  
  //       for (const d of dirs) {
  //         const folderPath = d.path;
  
  //         /* ---------- 1️⃣ 读取目录内容 ---------- */
  //         const contentsUrl = USE_GITEE
  //           ? repoApiUrl(
  //               `/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${folderPath}`,
  //               { ref: GITEE_BRANCH }
  //             )
  //           : repoApiUrl(
  //               `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${folderPath}`,
  //               { ref: GITHUB_BRANCH }
  //             );
  
  //         const r2 = await fetch(contentsUrl, { headers });
  //         if (!r2.ok) continue;
  
  //         const files = await r2.json();
  
  //         /* ---------- 2️⃣ version.txt ---------- */
  //         let version = d.name;
  //         const vfile = files.find(f => f.name.toLowerCase() === "version.txt");
  
  //         if (vfile) {
  //           try {
  //             if (USE_GITEE) {
  //               const vr = await fetch(
  //                 repoApiUrl(
  //                   `/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${vfile.path}`,
  //                   { ref: GITEE_BRANCH }
  //                 ),
  //                 { headers }
  //               );
  //               const vjson = await vr.json();
  //               if (vjson?.content) {
  //                 version = atob(vjson.content.replace(/\n/g, "")).trim();
  //               }
  //             } else {
  //               // GitHub：直接用 download_url
  //               const vr = await fetch(vfile.download_url);
  //               version = (await vr.text()).trim();
  //             }
  //           } catch {}
  //         }
  
  //         /* ---------- 3️⃣ bin 文件 ---------- */
  //         const bins = files
  //           .filter(f => f.name.toLowerCase().endsWith(".bin"))
  //           .map(f => ({
  //             name: f.name,
  //             url: USE_GITEE
  //               ? repoApiUrl(
  //                   `/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${f.path}`,
  //                   { ref: GITEE_BRANCH }
  //                 )
  //               : f.download_url,
  //           }));
  
  //         if (!bins.length) continue;
  
  //         /* ---------- 4️⃣ commit 记录 ---------- */
  //         let commits = [];
  //         try {
  //           const commitsUrl = USE_GITEE
  //             ? repoApiUrl(
  //                 `/repos/${GITEE_OWNER}/${GITEE_REPO}/commits`,
  //                 { path: folderPath, sha: GITEE_BRANCH, per_page: 5 }
  //               )
  //             : repoApiUrl(
  //                 `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits`,
  //                 { path: folderPath, sha: GITHUB_BRANCH, per_page: 5 }
  //               );
  
  //           const cr = await fetch(commitsUrl, { headers });
  //           const cjson = await cr.json();
  
  //           commits = (cjson || []).map(c => ({
  //             sha: c.sha,
  //             message: c.commit?.message?.split("\n")[0] || "",
  //             author: c.commit?.committer?.name || "",
  //             date: c.commit?.committer?.date || "",
  //           }));
  //         } catch {}
  
  //         result.push({
  //           folder: d.name,
  //           version,
  //           bins,
  //           commits,
  //         });
  //       }
  
  //       return result;
  //     };
  
  //     const [standard, xiaozhi] = await Promise.all([
  //       listType("standard"),
  //       listType("xiaozhi"),
  //     ]);
  
  //     setGiteeFirmware({ standard, xiaozhi });
  //     appendLog("固件列表加载完成");
  //   } catch (err) {
  //     appendLog("获取固件失败: " + err.message);
  //   }
  // };


  const TYPE_FILE_EXT = {
    standard: '.bin',
    xiaozhi: '.bin',
    microbit: '.hex',
  };
  const loadFirmwareFromRepo = async (source) => {
    const isGitee = source === 'gitee';
  
    console.log(`尝试从 ${isGitee ? 'Gitee' : 'GitHub'} 获取固件列表...`);
  
    const headers = isGitee
      ? (GITEE_TOKEN ? { Authorization: `token ${GITEE_TOKEN}` } : {})
      : (GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {});
  
    const listType = async (type) => {
      const basePath = `${(isGitee ? GITEE_BASE_FOLDER : GITHUB_BASE_FOLDER)}/${type}`;
  
      const url = isGitee
        ? `https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${basePath}?ref=${GITEE_BRANCH}`
        : `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${basePath}?ref=${GITHUB_BRANCH}`;
  
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`${source} 获取目录失败`);
  
      const items = await res.json();
      const dirs = items.filter(i => i.type === 'dir');
      const result = [];
  
      for (const d of dirs) {
        const folderPath = d.path;
  
        /* ---------- 目录内容 ---------- */
        const contentsUrl = isGitee
          ? `https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${folderPath}?ref=${GITEE_BRANCH}`
          : `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${folderPath}?ref=${GITHUB_BRANCH}`;
  
        const r2 = await fetch(contentsUrl, { headers });
        if (!r2.ok) continue;
  
        const files = await r2.json();
  
        /* ---------- version.txt ---------- */
        let version = d.name;
        const vfile = files.find(f => f.name.toLowerCase() === 'version.txt');
  
        if (vfile) {
          try {
            if (isGitee) {
              const vr = await fetch(
                `https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${vfile.path}?ref=${GITEE_BRANCH}`,
                { headers }
              );
              const vjson = await vr.json();
              if (vjson?.content) {
                version = atob(vjson.content.replace(/\n/g, '')).trim();
              }
            } else {
              const vr = await fetch(vfile.download_url);
              version = (await vr.text()).trim();
            }
          } catch {}
        }
  
        /* ---------- bin 文件 ---------- */
        // const bins = files
        //   .filter(f => f.name.toLowerCase().endsWith('.bin'))
        //   .map(f => ({
        //     name: f.name,
        //     url: isGitee
        //       ? `https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${f.path}?ref=${GITEE_BRANCH}`
        //       : f.download_url,
        //   }));
        // if (!bins.length) continue;
        const ext = TYPE_FILE_EXT[type]; // '.bin' or '.hex'

        const firmwareFiles = files
          .filter(f => f.name.toLowerCase().endsWith(ext))
          .map(f => ({
            name: f.name,
            url: isGitee
              ? `https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${f.path}?ref=${GITEE_BRANCH}`
              : f.download_url,
          }));

        if (!firmwareFiles.length) continue;
  
        /* ---------- commits ---------- */
        let commits = [];
        try {
          const commitsUrl = isGitee
            ? `https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}/commits?path=${folderPath}&sha=${GITEE_BRANCH}&per_page=5`
            : `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?path=${folderPath}&sha=${GITHUB_BRANCH}&per_page=5`;
  
          const cr = await fetch(commitsUrl, { headers });
          const cjson = await cr.json();
  
          commits = (cjson || []).map(c => ({
            sha: c.sha,
            message: c.commit?.message?.split('\n')[0] || '',
            author: c.commit?.committer?.name || '',
            date: c.commit?.committer?.date || '',
          }));
        } catch {}
  
        // result.push({
        //   folder: d.name,
        //   version,
        //   bins,
        //   commits,
        // });
        result.push({
          folder: d.name,     // last / middle / long
          version,            // version.txt 内容
          bins: firmwareFiles, // bin 或 hex
          commits,
        });
      }
  
      return result;
    };
  
    // const [standard, xiaozhi] = await Promise.all([
    //   listType('standard'),
    //   listType('xiaozhi'),
    // ]);
  
    // return { standard, xiaozhi };

    const [standard, xiaozhi, microbit] = await Promise.all([
      listType('standard'),
      listType('xiaozhi'),
      listType('microbit'),
    ]);
    console.log({
      standard, 
      xiaozhi, 
      microbit
    })

    // const latestUrl = getLatestBinUrl(microbit);
    // setMicrobitUrl(latestUrl)
    return { standard, xiaozhi, microbit };
    
  };


  function compareVersion(v1, v2) {
    const arr1 = v1.split('.').map(Number);
    const arr2 = v2.split('.').map(Number);
    const len = Math.max(arr1.length, arr2.length);
  
    for (let i = 0; i < len; i++) {
      const num1 = arr1[i] || 0;
      const num2 = arr2[i] || 0;
  
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  function getLatestBinUrl(microbitArray) {
    if (!Array.isArray(microbitArray) || microbitArray.length === 0) {
      return null;
    }
  
    let latestItem = microbitArray[0];
  
    for (let i = 1; i < microbitArray.length; i++) {
      const current = microbitArray[i];
  
      if (
        compareVersion(current.version, latestItem.version) > 0
      ) {
        latestItem = current;
      }
    }
  
    // 取 bins 里的 url（默认取第一个）
    return latestItem.bins?.[0]?.url || null;
  }
  const loadRepoFirmwareList = async () => {
    try {
      // 1️⃣ 先试 Gitee
      const data = await loadFirmwareFromRepo('gitee');
      setGiteeFirmware(data);
      console.log('已使用 Gitee 固件源');
    } catch (giteeErr) {
      console.log('Gitee 访问失败，切换 GitHub...');
  
      try {
        // 2️⃣ fallback GitHub
        const data = await loadFirmwareFromRepo('github');
        setGiteeFirmware(data);
        console.log('已切换至 GitHub 固件源');
      } catch (githubErr) {
        console.log('GitHub 访问失败，无法获取固件列表');
        console.error(giteeErr, githubErr);
      }
    }
  };
  useEffect(() => {
    loadRepoFirmwareList();
    
  }, []);
  useEffect(() => {
    // 当 log 更新时，自动滚到底部
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]); // 依赖 log，每次更新都会滚动

  const appendLog = (txt) => {
    setLog((prev) => prev + `[${new Date().toLocaleTimeString()}] ${txt}\n`);
  };

  // ---------- Helper: Patch device.getInfo if missing (defensive) ----------
  const ensureDeviceInfo = (device) => {
    if (!device) return;
    if (!device.getInfo) {
      // best-effort fallback values
      device.getInfo = () => ({ usbVendorId: 0x10c4, usbProductId: 0xea60 });
    }
  };


  function base64ToUint8Array(base64) {
    // 去掉换行（Gitee 会自动加）
    const clean = base64.replace(/\n/g, '');

    // base64 → binary string
    const binary = atob(clean);

    // binary string → Uint8Array
    const len = binary.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  }
  // ---------- Flash using official Transport + ESPLoader flow ----------
  // firmwareUrl: URL pointing to .bin file
  // returns true/false
  const flashWithEsptoolOfficial = async (firmwareUrl, baudrate = 1152000) => {
    appendLog(`准备使用 esptool-js（Transport + ESPLoader）烧录：${firmwareUrl}`);
    let device = null;
    let transport = null;
    let esploader = null;
    try {
      // 1. request serial device
      appendLog("请求串口权限...");
      device = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x1A86 },
        ]
      });
      ensureDeviceInfo(device);

      // 2. create transport (official example uses new Transport(device, true))
      appendLog("创建 Transport...");
      transport = new Transport(device, true);

      // 3. set up terminal that collects logs into our appendLog
      const terminal = {
        clean() {
          /* no-op */
        },
        writeLine(data) {
          appendLog(data);
          handleFirmwareData(JSON.stringify({
            type: 'burnLogs',
            data: { message: {
              flashing:true,
              logs:`${data}`
            } }
          }))
        },
        write(data) {
          appendLog(data);
          handleFirmwareData(JSON.stringify({
            type: 'burnLogs',
            data: { message: {
              flashing:true,
              logs:`${data}`
            } }
          }))
        },
      };

      // 4. create ESPLoader instance using options object (official style)
      esploader = new ESPLoader({
        transport,
        baudrate: baudrate,
        terminal,
        debugLogging: false,
      });

      appendLog("连接并检测设备...");
      // main() performs initial handshake and returns chip name
      const chip = await esploader.main();
      appendLog(`已连接芯片: ${chip}`);

      // 5. fetch firmware bytes
      appendLog("下载固件...");
      const arr = await fetch(firmwareUrl);
      if (!arr.ok) throw new Error(`下载固件失败: ${arr.status} ${arr.statusText}`);
      let bin
      if (
        firmwareUrl.startsWith("https://raw.githubusercontent.com") ||
        firmwareUrl.startsWith("https://github.com") ||
        firmwareUrl.endsWith(".bin")
      ) {
        console.log('本地/github')
        const buf = await arr.arrayBuffer();
        bin = new Uint8Array(buf);
      }
      // ✅ 情况 2：Gitee contents API（base64）
      else {
        console.log('gitee固件')
        const file = await arr.json();
        if (!file.content) {
          throw new Error("Gitee 固件内容为空");
        }
        bin = base64ToUint8Array(file.content);
      }
      // if(firmwareUrl==FLASH_COMBINED_PATH){
      //   const buf = await arr.arrayBuffer();
      //   bin = new Uint8Array(buf);
      // }else{
      //   const file = await arr.json();
      //   bin = base64ToUint8Array(file.content);
      // }
      

      // 6. flashData (esploader.flashData exists in modern esptool-js)
      appendLog("开始烧录 (请勿断开设备) ...");
      setProgress({ stage: "烧录固件", percent: 0 });

      // some versions of esptool-js accept (buffer, offset, callback)
      if (typeof esploader.flashData === "function") {
        await esploader.flashData(bin, 0x0, (written, total) => {
          const percent = Math.round((written / total) * 100);
          setProgress({ stage: "烧录固件", percent });
        });
      } else if (typeof esploader.writeFlash === "function") {
        // fallback: use writeFlash with single-file fileArray
        appendLog("使用 writeFlash 回退方案（writeFlash）...");
        // convert binary to binary-string Latin1 for older API
        // let binStr = "";
        // for (let i = 0; i < bin.length; i++) binStr += String.fromCharCode(bin[i]);
        // const fileArray = [{ data: binStr, address: 0x0 }];
        // console.log(fileArray)
        // await esploader.writeFlash({
        //   fileArray,
        //   eraseAll: false,
        //   compress: true,
        //   reportProgress: (fileIndex, written, total) => {
        //     const percent = Math.round((written / total) * 100);
        //     setProgress({ stage: "烧录固件", percent });
        //   },
        //   calculateMD5Hash: (imageStr) => {
        //     // older example used CryptoJS, but here we skip MD5 calc (if required, add dependency)
        //     return null;
        //   },
        // });
        function binToLatin1(bin) {
            let result = "";
            const chunkSize = 0x8000;
            for (let i = 0; i < bin.length; i += chunkSize) {
                result += String.fromCharCode(...bin.subarray(i, i + chunkSize));
            }
            return result;
        }

        const binStr = binToLatin1(bin);
        const fileArray = [{ data: binStr, address: 0x0 }];
        console.log(fileArray);

        await esploader.writeFlash({
            fileArray,
            eraseAll: false,
            compress: true,
            flashSize:'keep',
            reportProgress: (fileIndex, written, total) => {
                const percent = Math.round((written / total) * 100);
                setProgress({ stage: "烧录固件", percent });
            },
            calculateMD5Hash: () => null, // 可选
        });
      } else {
        throw new Error("当前 esptool-js 版本不支持 flashData 或 writeFlash");
      }

      // 7. hard reset
      try {
        await esploader.hardReset();
      } catch (e) {
        appendLog("尝试硬复位失败（可忽略）: " + e.message);
      }

      appendLog("烧录完成！");
      setProgress({ stage: "烧录固件", percent: 100 });
      handleFirmwareData(JSON.stringify({
        type: 'burnLogs',
        data: { message: {
          flashing:false,
          logs:`success`
        } }
      }))

      // 8. cleanup: disconnect transport if available
      try {
        if (esploader && typeof esploader.after === "function") {
          // some versions require after()
          await esploader.after();
        }
      } catch (e) {
        // ignore
      }
      try {
        if (esploader && typeof esploader.disconnect === "function") await esploader.disconnect();
        if (transport && typeof transport.disconnect === "function") await transport.disconnect();
      } catch (e) {
        // ignore
      }
      return true;
    } catch (err) {
      console.log(err)
      handleFirmwareData(JSON.stringify({
        type: 'burnLogs',
        data: { message: {
          flashing:false,
          logs:`Failed`
        } }
      }))
      appendLog("烧录错误: " + (err && err.message ? err.message : String(err)));
      // try to cleanup on error
      try {
        if (esploader && typeof esploader.disconnect === "function") esploader.disconnect();
        if (transport && typeof transport.disconnect === "function") transport.disconnect();
      } catch {}
      return false;
    }
  };

  const flashTwoWithEsptoolOfficial = async (firmwareFiles, baudrate = 1152000) => {
      // firmwareFiles = [
      //   { address: 0x0, url: "firmware1.bin" },
      //   { address: 0x1420000, url: "firmware2.bin" }
      // ]
      // console.log(window.__serialPort)
      // console.log(window.__serialPortInfo)
      // return
      //  const jsonData = {
      //   command: "select_mode",
      //   params: { mode:"file"},
      // };
      // const str = JSON.stringify(jsonData) + "\n";
      // const encoder = new TextEncoder();
      // await window.__serialWriter.write(encoder.encode(str));
      // window.__serialPort.close()
      appendLog(`准备烧录 ${firmwareFiles.length} 个固件...`);
      let device = null;
      let transport = null;
      let esploader = null;

      try {
          // 1. 请求串口
          appendLog("请求串口权限...");
          device = await navigator.serial.requestPort({
            filters: [
              { usbVendorId: 0x1A86 },
            ]
          });
          ensureDeviceInfo(device);

          // 2. 创建 Transport
          appendLog("创建 Transport...");
          transport = new Transport(device, true);

          // 3. 创建终端收集日志
          const terminal = {
              clean() {},
              writeLine(data) { 
                appendLog(data);
                handleFirmwareData(JSON.stringify({
                  type: 'burnLogs',
                  data: { message: {
                    flashing:true,
                    logs:`stdout: ${data}`
                  } }
                }))
              },
              write(data) { 
                appendLog(data);
                handleFirmwareData(JSON.stringify({
                  type: 'burnLogs',
                  data: { message: {
                    flashing:true,
                    logs:`stdout: ${data}`
                  } }
                }))
               }
          };

          // 4. 创建 ESPLoader
          esploader = new ESPLoader({
              transport,
              baudrate,
              terminal,
              debugLogging: false
          });

          // 5. 连接芯片
          appendLog("连接并检测设备...");
          const chip = await esploader.main();
          appendLog(`已连接芯片: ${chip}`);

          // 6. 下载所有固件
          appendLog("下载固件...");
          const fileArray = [];
          for (const fw of firmwareFiles) {
              console.log('开始下载',fw)
              const res = await fetch(fw.url);
              console.log('下载完成',fw)
              if (!res.ok) throw new Error(`下载固件失败: ${res.status} ${res.statusText}`);

              let bin
              if (
                fw.url.startsWith("https://raw.githubusercontent.com") ||
                fw.url.startsWith("https://github.com") ||
                fw.url.endsWith(".bin")
              ) {
                console.log('本地/github')
                const buf = await res.arrayBuffer();
                bin = new Uint8Array(buf);
              }
              // ✅ 情况 2：Gitee contents API（base64）
              else {
                console.log('gitee固件')
                const file = await res.json();
                if (!file.content) {
                  throw new Error("Gitee 固件内容为空");
                }
                bin = base64ToUint8Array(file.content);
              }
              // if(firmwareFiles[0].url==FLASH_COMMON_PATH){
              //   const buf = await res.arrayBuffer();
              //   bin=new Uint8Array(buf)
              // }else{
              //   const file = await res.json();
              //   bin = base64ToUint8Array(file.content);
              // }
              // console.log(res)
              // const buf = await res.arrayBuffer();
              
              console.log(bin)

              // 转为 Latin1 字符串用于旧版本 writeFlash
              function binToLatin1(bin) {
                  let result = "";
                  const chunkSize = 0x8000;
                  for (let i = 0; i < bin.length; i += chunkSize) {
                      result += String.fromCharCode(...bin.subarray(i, i + chunkSize));
                  }
                  return result;
              }
              const binStr = binToLatin1(bin);

              fileArray.push({ data: binStr, address: fw.address });
          }

          // 7. 烧录
          appendLog("开始烧录 (请勿断开设备) ...");
          setProgress({ stage: "烧录固件", percent: 0 });

          if (typeof esploader.writeFlash === "function") {
              await esploader.writeFlash({
                  fileArray,
                  eraseAll: false,
                  compress: true,
                  flashSize: 'keep',
                  reportProgress: (fileIndex, written, total) => {
                      const percent = Math.round((written / total) * 100);
                      setProgress({ stage: "烧录固件", percent });
                  },
                  calculateMD5Hash: () => null,
              });
          } else if (typeof esploader.flashData === "function") {
              // 如果仅支持单个 flashData，可循环调用，但地址需手动处理
              for (const fw of fileArray) {
                  const buf = new Uint8Array(fw.data.length);
                  for (let i = 0; i < fw.data.length; i++) buf[i] = fw.data.charCodeAt(i);
                  await esploader.flashData(buf, fw.address, (written, total) => {
                      const percent = Math.round((written / total) * 100);
                      setProgress({ stage: "烧录固件", percent });
                  });
              }
          } else {
              throw new Error("当前 esptool-js 版本不支持 writeFlash 或 flashData");
          }

          // 8. 硬复位
          try {
              await esploader.hardReset();
          } catch (e) {
              appendLog("尝试硬复位失败（可忽略）: " + e.message);
          }

          appendLog("烧录完成！");
          setProgress({ stage: "烧录固件", percent: 100 });
          handleFirmwareData(JSON.stringify({
            type: 'burnLogs',
            data: { message: {
              flashing:false,
              logs:`success`
            } }
          }))

          // 9. 清理
          try { if (esploader?.after) await esploader.after(); } catch {}
          try { if (esploader?.disconnect) await esploader.disconnect(); } catch {}
          try { if (transport?.disconnect) await transport.disconnect(); } catch {}

          return true;
      } catch (err) {
        console.log(err)
          console.log("烧录错误: " + (err?.message ?? String(err)));
          handleFirmwareData(JSON.stringify({
            type: 'burnLogs',
            data: { message: {
              flashing:false,
              logs:`Failed`
            } }
          }))
          try { if (esploader?.disconnect) esploader.disconnect(); } catch {}
          try { if (transport?.disconnect) transport.disconnect(); } catch {}
          return false;
      }
  };


  // ---------- Raw REPL helpers (upload main.py / mpy) ----------
  const enterRawRepl = async (portObj) => {
    // open writer/reader
    const writer = portObj.writable.getWriter();
    writerRef.current = writer;
    const reader = portObj.readable.getReader();
    readerRef.current = reader;
    const encoder = new TextEncoder();
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const send = async (data) => {
      if (typeof data === "string") {
        await writer.write(encoder.encode(data));
      } else {
        await writer.write(data);
      }
    };

    // Enter raw REPL: Ctrl-C twice, Ctrl-A
    await send("\r\x03\x03");
    await sleep(800);
    await send("\r\x01");
    await sleep(1000);

    // 等待确认
    let buf = "";
    while (true) {
      const { value } = await reader.read();
      if (!value) break;
      buf += new TextDecoder().decode(value);
      if (buf.includes("raw REPL; CTRL-B to exit")) break;
    }

    appendLog("进入 Raw REPL 成功");
    return { send, reader, writer, sleep };
  };

  // const execRawCommand = async (env, cmd, timeout = 1500) => {
  //   const { send, reader } = env;
  //   await send(cmd + "\n");
  //   await send("\x04");
  //   const start = Date.now();
  //   let acc = "";
  //   console.log(cmd)
  //   while (Date.now() - start < timeout) {
  //     try {
  //       const { value, done } = await reader.read();
  //       console.log(value)
  //       console.log(done)
  //       if (done) break;
  //       if (value) acc += new TextDecoder().decode(value);
  //       console.log(acc)
  //     } catch {
  //       break;
  //     }
  //   }
  //   return acc;
  // };

  // const execRawCommand = async (env, cmd, timeout = 1500) => {
  //   const { send, reader } = env;
  //   await send(cmd + "\n");
  //   await send("\x04"); // Ctrl-D EOF

  //   const start = Date.now();
  //   let acc = "";
  //   const decoder = new TextDecoder();

  //   while (Date.now() - start < timeout) {
  //     const result = await Promise.race([
  //       reader.read(),
  //       new Promise((resolve) => setTimeout(() => resolve(null), 100)), // 每100ms检查一次
  //     ]);

  //     if (!result) continue; // 超时重试

  //     const { value, done } = result;
  //     if (done) break;
  //     if (value) {
  //       acc += decoder.decode(value);
  //       // ✅ 如果检测到执行完成信号则提前结束
  //       if (acc.includes("\x04>") || acc.endsWith("OK") || acc.trim().endsWith(">")) break;
  //     }
  //   }

  //   return acc.trim();
  // };

  const execRawCommand = async (env, cmd, timeout = 3000) => {
    const { send, reader } = env;
    const decoder = new TextDecoder();

    // 发送命令（⚠️ 不要加 \n）
    await send(cmd);
    await send("\x04"); // Ctrl-D EOF

    let acc = "";
    const start = Date.now();

    // Raw REPL 的输出包含两个 \x04，分别结束 stdout 和 stderr
    while (Date.now() - start < timeout) {
      const { value, done } = await reader.read();
      if (done || !value) break;
      acc += decoder.decode(value);
      if ((acc.match(/\x04/g) || []).length >= 2) break;
    }

    // 截取 stdout/err
    const parts = acc.split("\x04");
    const stdout = parts[1] || "";
    const stderr = parts[2] || "";
    if (stderr.trim()) console.warn("⚠️ stderr:", stderr.trim());
    return stdout.trim();
  };

  const execRawCommandNoWait = async (env, cmd) => {
    const { send } = env;
    await send(cmd + "\n");
    await send("\x04"); // Ctrl+D
  };
  const uploadTextFileViaRaw = async (env, fileUrl, remotePath) => {
    appendLog(`上传文本文件 ${remotePath} ...`);
    setProgress({ stage: `上传 ${remotePath}`, percent: 0 });
    const txt = await fetch(fileUrl).then((r) => r.text());
    const escaped = JSON.stringify(txt);
    const cmd = `with open('${remotePath}', 'w') as f:\n    f.write(${escaped})`;
    await execRawCommand(env, cmd, 3000);
    setProgress({ stage: `上传 ${remotePath}`, percent: 100 });
    appendLog(`上传 ${remotePath} 完成`);
  };
  // const uploadTextFileViaRaw = async (env, fileUrl, remotePath) => {
  //   appendLog(`上传文本文件 ${remotePath} ...`);
  //   setProgress({ stage: `上传 ${remotePath}`, percent: 0 });

  //   // 下载文件内容
  //   const txt = await fetch(fileUrl).then((r) => r.text());
  //   console.log(txt)
  //   const encoder = new TextEncoder();
  //   const data = encoder.encode(txt);
  //   console.log(data)


  //   // 打开目标文件
  //   await execRawCommand(env, `f=open('${remotePath}','w')`);

  //   // 分块写入，每块 128 字节（可调到 256/512）
  //   const chunkSize = 128;
  //   const total = data.length;

  //   for (let i = 0; i < total; i += chunkSize) {
  //     console.log(i)
  //     const chunk = data.slice(i, Math.min(i + chunkSize, total));
  //     let hex = "";
  //     for (const b of chunk) hex += b.toString(16).padStart(2, "0");

  //     // 通过 hex 转为 bytes.fromhex() 再写入
  //     const cmd = `f.write(bytes.fromhex('${hex}'))`;
  //     await execRawCommand(env, cmd, 1500);

  //     const percent = Math.round(((i + chunkSize) / total) * 100);
  //     setProgress({ stage: `上传 ${remotePath}`, percent });
  //   }

  //   // 关闭文件
  //   await execRawCommand(env, "f.close()", 500);
  //   setProgress({ stage: `上传 ${remotePath}`, percent: 100 });
  //   appendLog(`上传 ${remotePath} 完成`);
  // };


  const uploadBinaryFileViaRaw = async (env, fileUrl, remotePath) => {
    appendLog(`上传二进制文件 ${remotePath} ...`);
    const arr = await fetch(fileUrl);
    if (!arr.ok) throw new Error(`下载 ${fileUrl} 失败: ${arr.status}`);
    const buf = await arr.arrayBuffer();
    const bin = new Uint8Array(buf);
    const chunkSize = 256;
    const total = bin.length;

    await execRawCommand(env, `f=open('${remotePath}','wb')`, 500);
    for (let i = 0; i < total; i += chunkSize) {
      const chunk = bin.slice(i, Math.min(i + chunkSize, total));
      let hex = "";
      for (const b of chunk) hex += b.toString(16).padStart(2, "0");
      const cmd = `f.write(bytes.fromhex('${hex}'))`;
      await execRawCommand(env, cmd, 2000);
      const percent = Math.round(((i + chunkSize) / total) * 100);
      setProgress({ stage: `上传 ${remotePath}`, percent });
    }
    await execRawCommand(env, "f.close()", 500);
    setProgress({ stage: `上传 ${remotePath}`, percent: 100 });
    appendLog(`上传 ${remotePath} 完成`);
  };

  // ---------- Button handlers matching your original logic ----------
  const handleFlashCommonThenUpload = async () => {
    if (!("serial" in navigator)) {
      appendLog("当前浏览器不支持 Web Serial API，请使用 Chromium 内核（Chrome/Edge）并在 https 或 localhost 下运行。");
      return;
    }

    setBusy(true);
    setProgress({ stage: "", percent: 0 });
    appendLog("=== 普通固件流程 ===");

    // try {
    //   const ok = await flashTwoWithEsptoolOfficial([
    //       { address: 0x0, url: FLASH_COMMON_PATH },
    //       { address: 0x1420000, url: FLASH_VFS }
    //   ], 1152000);
    //   if (ok) {
    //     // appendLog("请拔下并重新插入设备，然后点击继续上传");
    //     // setAwaitReconnect(true);
    //     appendLog("successful");
    //   } else {
    //     appendLog("烧录失败，流程结束");
    //   }
    // } catch (e) {
    //   appendLog("流程异常: " + e.message);
    // } finally {
    //   setBusy(false);
    // }

   try {
    if (selectedStandardFirmware === "local") {
      await flashTwoWithEsptoolOfficial([
        { address: 0x0, url: FLASH_COMMON_PATH },
        { address: 0x1420000, url: FLASH_VFS },
      ]);
    } else {
      const fw = giteeFirmware.standard.find(
        f => f.folder === selectedStandardFirmware
      );
      if (!fw) throw new Error("未找到 Gitee 固件");

      appendLog(`使用 Gitee 固件版本: ${fw.version}`);

      const flashList = fw.bins.map(bin => {
        const name = bin.name.toLowerCase();
        if (name.includes("firmware"))
          return { address: 0x0, url: bin.url };
        if (name.includes("spiffs") || name.includes("vfs"))
          return { address: 0x1420000, url: bin.url };
        return null;
      }).filter(Boolean);

      await flashTwoWithEsptoolOfficial(flashList);
    }

    appendLog("烧录完成");
  } catch (e) {
    appendLog("烧录失败: " + e.message);
  } finally {
    setBusy(false);
  }
  };

  const handleUserReconnectedAndUpload = async () => {
    if (!("serial" in navigator)) {
      appendLog("当前浏览器不支持 Web Serial API");
      return;
    }
    setBusy(true);
    setAwaitReconnect(false);
    setProgress({ stage: "", percent: 0 });

    try {
      appendLog("请在弹窗中选择你刚刚重新插入的设备...");
      // open a new port for raw repl (user will choose)
      const p = await navigator.serial.requestPort({});
      // open at console baud
      await p.open({ baudRate: 115200 });
      // defensive: patch getInfo if missing (not strictly needed here)
      if (!p.getInfo) p.getInfo = () => ({ usbVendorId: 0x10c4, usbProductId: 0xea60 });

      const env = await enterRawRepl(p);

      // upload text .py
      await uploadTextFileViaRaw(env, PY_PATH, "/main.py");

      // upload binary .mpy
      await uploadBinaryFileViaRaw(env, MPY_PATH, "/lib/icrobot.mpy");

      appendLog("所有文件上传完成（main.py & icrobot.mpy）");
      // cleanup raw repl io
      try {
        if (readerRef.current) {
          await readerRef.current.cancel();
          readerRef.current.releaseLock();
          readerRef.current = null;
        }
        if (writerRef.current) {
          writerRef.current.releaseLock();
          writerRef.current = null;
        }
      } catch (e) {
        // ignore
      }
      await p.close();
      appendLog("串口已关闭");
    } catch (err) {
      appendLog("上传阶段出错: " + (err && err.message ? err.message : String(err)));
    } finally {
      setBusy(false);
      setProgress({ stage: "", percent: 0 });
    }
  };

  const handleFlashXiaoZhi = async () => {
    if (!("serial" in navigator)) {
      appendLog("当前浏览器不支持 Web Serial API，请使用 Chromium 内核（Chrome/Edge）并在 https 或 localhost 下运行。");
      return;
    }

    setBusy(true);
    setProgress({ stage: "", percent: 0 });
    appendLog("=== 小智 AI 固件 流程 ===");

    // try {
    //   const ok = await flashWithEsptoolOfficial(FLASH_COMBINED_PATH, 1152000);
    //   if (ok) {
    //     appendLog("小智固件 烧录成功（仅执行 esptool，不上传 py/mpy）");
    //   } else {
    //     appendLog("小智固件 烧录失败");
    //   }
    // } catch (e) {
    //   appendLog("流程异常: " + e.message);
    // } finally {
    //   setBusy(false);
    //   setProgress({ stage: "", percent: 0 });
    // }
    try {
      if (selectedXiaoZhiFirmware === 'local') {
        await flashWithEsptoolOfficial(FLASH_COMBINED_PATH);
      } else {
        const fw = giteeFirmware.xiaozhi.find(
          f => f.folder === selectedXiaoZhiFirmware
        );
        if (!fw) throw new Error('未找到 Gitee 小智固件');

        appendLog(`使用 Gitee 小智固件: ${fw.version}`);
        console.log(fw.bins[0].url)
        await flashWithEsptoolOfficial(fw.bins[0].url);
      }
    } catch (e) {
      appendLog("烧录失败: " + e.message);
    } finally {
      setBusy(false);
    }
  };
  // const handleFlashMicro =async()=>{
  //   console.log('microbit固件')
  //   try {
  //     // 1️⃣ 读取 HEX 文件内容
  //     const response = await fetch(MICRO_PATH);
  //     const hexText = await response.text();

  //     // 2️⃣ 让用户选择保存位置（可选 micro:bit 盘）
  //     const fileHandle = await window.showSaveFilePicker({
  //       suggestedName: 'MICROBIT.hex',
  //       types: [
  //         {
  //           description: 'Micro:bit HEX 文件',
  //           accept: { 'text/plain': ['.hex'] },
  //         },
  //       ],
  //     });

  //     // 3️⃣ 写入文件
  //     const writable = await fileHandle.createWritable();
  //     await writable.write(hexText);
  //     await writable.close();

      
  //     alert(formatMessage({
  //             id: 'gui.firmware.microbitSuccess',
  //             default: 'The HEX file has been saved successfully! Please wait for the micro:bit to automatically refresh the firmware.',
  //             description: 'gui.firmware.microbitSuccess'
  //     }));
  //   } catch (err) {
  //     console.log(err)
  //     if (err.name === 'AbortError') {
  //       console.log('用户取消保存');
  //     } else {
  //       console.error('保存失败:', err);
  //       alert(formatMessage({
  //             id: 'gui.firmware.microbitFailed',
  //             default: 'Save failed',
  //             description: 'gui.firmware.microbitFailed'
  //       }));
  //     }
  //   }
  // }

  const handleFlashMicro = async () => {
    console.log('microbit 固件');
  
    try {
      let hexText = '';
  
      // channelLoading.postMessage(true);
  
      /* ---------- 获取 HEX 内容 ---------- */
      if (selectedMicrobitFirmware === 'local') {
        setMicrobitUrl('');
        const response = await fetch(MICRO_PATH);
        if (!response.ok) throw new Error('本地 HEX 加载失败');
        hexText = await response.text();
      } else {
        const fwInfo = giteeFirmware.microbit.find(
          f => f.folder === selectedMicrobitFirmware
        );
  
        if (!fwInfo || !fwInfo.bins?.length) {
          throw new Error('未找到 microbit 固件');
        }
  
        const hexFile = fwInfo.bins[0];
  
        if (hexFile.url.includes('/contents/')) {
          setMicrobitUrl(hexFile.url);
          const res = await fetch(hexFile.url);
          if (!res.ok) throw new Error('HEX 下载失败');
          const json = await res.json();
          hexText = atob(json.content.replace(/\n/g, ''));
        } else {
          setMicrobitUrl(hexFile.url);
          const res = await fetch(hexFile.url);
          if (!res.ok) throw new Error('HEX 下载失败');
          hexText = await res.text();
        }
      }
  
      /* ---------- 通过 DAPLink 烧录 ---------- */
      const usbDevice = window.__microbitUSB;
      if (!usbDevice) throw new Error('未连接 Micro:bit USB');
  
      const transport = new WebUSB(usbDevice);
      const daplink = new DAPLink(transport);
  
      await daplink.connect();
      console.log('DAPLink 已连接，开始烧录...');
  
      let lastPercent = -1;
      daplink.on(DAPLink.EVENT_PROGRESS, (pct) => {
        const percent = Math.round(pct * 100);
        if (percent !== lastPercent) {
          lastPercent = percent;
          // console.log(`烧录进度: ${percent}%`);
          handleFirmwareData(JSON.stringify({
            type: 'burnLogs',
            data: { message: {
              flashing:true,
              logs:`${percent}`
            } }
          }))
          // channelLoading.postMessage({ flashing: true, progress: percent });
        }
      });
  
      await daplink.flash(new Uint8Array(hexText.split('').map(c => c.charCodeAt(0))));
      console.log('烧录完成！');
  
      await daplink.disconnect();
      console.log('DAPLink 已断开');
      handleFirmwareData(JSON.stringify({
        type: 'burnLogs',
        data: { message: {
          flashing:false,
          logs:`success`
        } }
      }))
  
      // channelLoading.postMessage(false);
  
      // alert(
      //   formatMessage({
      //     id: 'gui.firmware.microbitSuccess',
      //     default:
      //       'The HEX file has been flashed successfully to Micro:bit!',
      //     description: 'gui.firmware.microbitSuccess',
      //   })
      // );
    } catch (err) {
      console.error('烧录失败:', err);
      // channelLoading.postMessage(false);
  
      handleFirmwareData(JSON.stringify({
        type: 'burnLogs',
        data: { message: {
          flashing:false,
          logs:`Failed`
        } }
      }))
      if (err.name === 'AbortError') {
        console.log('用户取消操作');
      } else {
        // alert(
        //   formatMessage({
        //     id: 'gui.firmware.microbitFailed',
        //     default: 'Flash failed',
        //     description: 'gui.firmware.microbitFailed',
        //   })
        // );
      }
    }
  };

  // const handleFlashMicro = async () => {
  //   console.log('microbit 固件');
  
  //   try {
  //     let hexText = '';
  
  //     channelLoading.postMessage(true)
  
  //     /* ---------- 2️⃣ 让用户选择保存位置 ---------- */
  //     const fileHandle = await window.showSaveFilePicker({
  //       suggestedName: 'MICROBIT.hex',
  //       types: [
  //         {
  //           description: 'Micro:bit HEX 文件',
  //           accept: { 'text/plain': ['.hex'] },
  //         },
  //       ],
  //     });

  //     /* ---------- 1️⃣ 获取 HEX 内容 ---------- */
  //     if (selectedMicrobitFirmware === 'local') {
  //       // ✅ 本地固件（原逻辑，完全不变）
  //       setMicrobitUrl('')
  //       const response = await fetch(MICRO_PATH);
  //       if (!response.ok) throw new Error('本地 HEX 加载失败');
  //       hexText = await response.text();
  //     } else {
  //       // ✅ 仓库固件（Gitee / GitHub）
  //       const fwInfo = giteeFirmware.microbit.find(
  //         f => f.folder === selectedMicrobitFirmware
  //       );
  
  //       if (!fwInfo || !fwInfo.bins?.length) {
  //         throw new Error('未找到 microbit 固件');
  //       }
  
  //       const hexFile = fwInfo.bins[0];
  
  //       if (hexFile.url.includes('/contents/')) {
  //         // Gitee / GitHub API（base64）
  //         setMicrobitUrl(hexFile.url)
  //         const res = await fetch(hexFile.url);
  //         if (!res.ok) throw new Error('HEX 下载失败');
  //         const json = await res.json();
  //         hexText = atob(json.content.replace(/\n/g, ''));
  //       } else {
  //         // GitHub download_url（直链）
  //         setMicrobitUrl(hexFile.url)
  //         const res = await fetch(hexFile.url);
  //         if (!res.ok) throw new Error('HEX 下载失败');
  //         hexText = await res.text();
  //       }
  //     }
  
  //     /* ---------- 3️⃣ 写入 HEX ---------- */
  //     const writable = await fileHandle.createWritable();
  //     await writable.write(hexText);
  //     await writable.close();
  
  //     alert(
  //       formatMessage({
  //         id: 'gui.firmware.microbitSuccess',
  //         default:
  //           'The HEX file has been saved successfully! Please wait for the micro:bit to automatically refresh the firmware.',
  //         description: 'gui.firmware.microbitSuccess',
  //       })
  //     );
  //     channelLoading.postMessage(false)
  //   } catch (err) {
  //     console.log(err);
  
  //     channelLoading.postMessage(false)
  //     if (err.name === 'AbortError') {
  //       console.log('用户取消保存');
  //     } else {
  //       console.error('保存失败:', err);
  //       alert(
  //         formatMessage({
  //           id: 'gui.firmware.microbitFailed',
  //           default: 'Save failed',
  //           description: 'gui.firmware.microbitFailed',
  //         })
  //       );
  //     }
  //   }
  // };

  let localFirm=formatMessage({
                        id: 'gui.firmware.localFirmware',
                        default: 'Default firmware',
                        description: 'gui.firmware.localFirmware'
                  })
  const selectedStandardInfo = giteeFirmware.standard.find(f => f.folder === selectedStandardFirmware);
  const selectedXiaozhiInfo = giteeFirmware.xiaozhi.find(f => f.folder === selectedXiaoZhiFirmware);
  const selectedMicrobitInfo  = giteeFirmware.microbit.find(f => f.folder === selectedMicrobitFirmware);

  // ---------- UI ----------
  // return (
  //   <div className={styles.overlay}>
  //     <div className={styles.panel}>
  //       <div className={styles.headerRow}>
  //         <button className={styles.closeButton} onClick={onRequestClose} disabled={busy}>✕</button>
  //       </div>

  //       <h2 className={styles.title}>
  //         <FormattedMessage
  //             defaultMessage="Firmware Flashing Tool"
  //             description="Firmware Flashing Tool"
  //             id="gui.firmware.title"
  //         />
  //       </h2>

  //       <div className={styles.actionGroup}>
  //         {getCurrent()=='ICRobot' && <button className={styles.btn} onClick={handleFlashCommonThenUpload} disabled={busy}>
  //         <FormattedMessage
  //             defaultMessage="ICRobot Standard Firmware"
  //             description="ICRobot Standard Firmware"
  //             id="gui.firmware.icrobot"
  //         />
  //         </button>}
  //         {getCurrent()=='ICRobot' && <button className={styles.btn} onClick={handleFlashXiaoZhi} disabled={busy}>
  //         <FormattedMessage
  //             defaultMessage="XiaoZhi AI Firmware"
  //             description="XiaoZhi AI Firmware"
  //             id="gui.firmware.xiaozhi"
  //         />
  //         </button>}
  //         {getCurrent()=='Microbit' && <button className={styles.btn} onClick={handleFlashMicro} disabled={busy}>
  //         <FormattedMessage
  //             defaultMessage="Microbit Firmware"
  //             description="Microbit Firmware"
  //             id="gui.firmware.microbit"
  //         />
  //         </button>}
          
  //       </div>

  //       {/* {awaitReconnect && (
  //         <div className={styles.awaitReconnectBox}>
  //           <p>请拔下并重新插入设备后点击继续：</p>
  //           <button className={styles.btn} onClick={handleUserReconnectedAndUpload} disabled={busy}>
  //             已重新连接，继续上传
  //           </button>
  //         </div>
  //       )} */}

  //       {progress.stage && (
  //         <div className={styles.progressSection}>
  //           <div className={styles.progressLabel}>
  //             {progress.stage}: {progress.percent}%
  //           </div>
  //           <div className={styles.progressBar}>
  //             <div
  //               className={styles.progressInner}
  //               style={{ width: `${progress.percent}%` }}
  //             ></div>
  //           </div>
  //         </div>
  //       )}

  //       <h3 style={{ color: "#2e7d32", marginTop: 18, marginBottom: 4 }}>
  //          <FormattedMessage
  //             defaultMessage="Operation Log"
  //             description="Operation Log"
  //             id="gui.firmware.logs"
  //         />
  //       </h3>
  //       <pre ref={logRef} className={styles.logSection}>{log}</pre>
  //     </div>
  //     {awaitReconnect && (
  //       <div className={styles.toastOverlay}>
  //         <div className={styles.toastBox}>
  //           <h3>
  //           <FormattedMessage
  //               defaultMessage="Device Flashing Completed"
  //               description="Device Flashing Completed"
  //               id="gui.firmware.completed"
  //           />
  //           </h3>
  //           <p>
  //           <FormattedMessage
  //               defaultMessage="Please unplug and replug the device, then click the button below to continue uploading files."
  //               description="Please unplug and replug the device, then click the button below to continue uploading files."
  //               id="gui.firmware.reconnet"
  //           />
  //           </p>
  //           <button
  //             className={styles.btn}
  //             onClick={handleUserReconnectedAndUpload}
  //             disabled={busy}
  //           >
  //            <FormattedMessage
  //               defaultMessage="Reconnected, Continue Uploading"
  //               description="Reconnected, Continue Uploading"
  //               id="gui.firmware.continue"
  //           />
  //           </button>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );

 
   return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        {/* 顶部关闭按钮保留 */}
        <div className={styles.headerRow}>
          <button
            className={styles.closeButton}
            onClick={onRequestClose}
            disabled={busy}
          >
            ✕
          </button>
        </div>

        {/* 串口选择（占位，暂时不接逻辑） */}
        {/* <div className={styles.field}>
          <label>
            <FormattedMessage
              id="gui.firmware.selectPort"
              defaultMessage="选择串口："
            />
          </label>
          <select disabled>
            <option>COM - 请选择</option>
          </select>
        </div> */}
        {/* 当前固件版本显示 */}
        {version && <div className={styles.field}>
          <label className={styles.versionLabel}>
            <FormattedMessage
              id="gui.firmware.currentVersion"
              defaultMessage="Current Firmware Version"
            />
          </label>
          {version && <input
            className={styles.versionInput}
            type="text"
            value={version || ''}
            readOnly
          />}
        </div>}

        {/* ICRobot 双卡片 */}
        {getCurrent() === "ICRobot" && (
          <div className={styles.cardsRow}>
            {/* 标准固件 */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <FormattedMessage
                  id="gui.firmware.icrobot"
                  defaultMessage="Standard Firmware"
                />
              </div>

              <select
                value={selectedStandardFirmware}
                onChange={(e) => setSelectedStandardFirmware(e.target.value)}
              >
                <option value="local">
                  {/* <FormattedMessage
                    id="gui.firmware.localFirmware"
                    defaultMessage="Default firmware"
                  /> */}
                  {localFirm+'(1.1.0)'}
                </option>

                {giteeFirmware.standard.map(f => (
                  <option key={f.folder} value={f.folder}>
                    {f.version}
                  </option>
                ))}
              </select>

              {selectedStandardInfo && selectedStandardInfo.commits?.[0] && (
                <div className={styles.commitBox}>


                  <div className={styles.commitItem}>
                    <div className={styles.commitMsg}>
                      {selectedStandardInfo.commits[0].message}
                    </div>
                  </div>
                </div>
              )}

              {/* <div className={styles.cardDesc}>
                适用于 ICRobot 标准功能，包含基础控制与扩展能力。
              </div> */}

              <button
                className={styles.cardBtn}
                disabled={busy}
                onClick={handleFlashCommonThenUpload}
              >
                <FormattedMessage id="gui.firmware.standerdUpdate" defaultMessage="Update" />
              </button>
            </div>

            {/* 小智固件 */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <FormattedMessage
                  id="gui.firmware.xiaozhi"
                  defaultMessage="XiaoZhi AI Firmware"
                />
              </div>

              {/* <select
                value={selectedXiaoZhiFirmware}
                onChange={(e) => setSelectedXiaoZhiFirmware(e.target.value)}
              >
                <option value="local">本地固件（默认）</option>
                {giteeFirmware.xiaozhi.map(f => (
                  <option key={f.folder} value={f.folder}>
                    {f.version}
                  </option>
                ))}
              </select> */}
              <select
                value={selectedXiaoZhiFirmware}
                onChange={(e) => setSelectedXiaoZhiFirmware(e.target.value)}
              >
                <option value="local">
                   {localFirm+'(1.0.0)'}
                </option>

                {giteeFirmware.xiaozhi.map(f => (
                  <option key={f.folder} value={f.folder}>
                    {f.version}
                  </option>
                ))}
              </select>

              {/* <div className={styles.cardDesc}>
                集成小智 AI 能力，仅需烧录固件即可使用。
              </div> */}

              {selectedXiaozhiInfo && selectedXiaozhiInfo.commits?.[0] && (
              <div className={styles.commitBox}>

                <div className={styles.commitItem}>
                  <div className={styles.commitMsg}>
                    {selectedXiaozhiInfo.commits[0].message}
                  </div>
                </div>
              </div>
            )}

              <button
                className={styles.cardBtn}
                disabled={busy}
                onClick={handleFlashXiaoZhi}
              >
                <FormattedMessage id="gui.firmware.xiaozhiUpdate" defaultMessage="Update" />
              </button>
            </div>
          </div>
        )}

        {/* Microbit 单卡片 */}
        {/* {getCurrent() === "Microbit" && (
          <div className={`${styles.card} ${styles.singleCard}`}>
            <div className={styles.cardTitle}>
              <FormattedMessage
                id="gui.firmware.microbit"
                defaultMessage="Microbit Firmware"
              />
            </div>

            <div className={styles.cardDesc}>
              <FormattedMessage
                id="gui.firmware.microbitDesc"
                defaultMessage="Basic micro:bit firmware compatible with this software"
              />
            </div>

            <button
              className={styles.cardBtn}
              disabled={busy}
              onClick={handleFlashMicro}
            >
              <FormattedMessage id="gui.firmware.microbitUpdate" defaultMessage="Flash micro:bit firmware" />
            </button>
          </div>
        )} */}

        {getCurrent() === "Microbit" && (
          <div className={`${styles.card} ${styles.singleCard}`}>
            <div className={styles.cardTitle}>
              <FormattedMessage
                id="gui.firmware.microbit"
                defaultMessage="Microbit Firmware"
              />
            </div>

            <select
              value={selectedMicrobitFirmware}
              onChange={(e) => setSelectedMicrobitFirmware(e.target.value)}
            >
              <option value="local">
                {localFirm+'(1.0.0)'}
              </option>

              {giteeFirmware.microbit.map(f => (
                <option key={f.folder} value={f.folder}>
                  {f.version}
                </option>
              ))}
            </select>

            {/* 提交记录 */}
            {selectedMicrobitInfo && selectedMicrobitInfo.commits?.[0] && (
              <div className={styles.commitBox}>
                <div className={styles.commitItem}>
                  <div className={styles.commitMsg}>
                    {selectedMicrobitInfo.commits[0].message}
                  </div>
                </div>
              </div>
            )}

            <button
              className={styles.cardBtn}
              disabled={busy}
              onClick={handleFlashMicro}
            >
              <FormattedMessage
                id="gui.firmware.microbitUpdate"
                defaultMessage="Flash micro:bit firmware"
              />
            </button>
          </div>
        )}

        

      </div>
      {awaitReconnect && (
        <div className={styles.toastOverlay}>
          <div className={styles.toastBox}>
            <h3>
            <FormattedMessage
                defaultMessage="Device Flashing Completed"
                description="Device Flashing Completed"
                id="gui.firmware.completed"
            />
            </h3>
            <p>
            <FormattedMessage
                defaultMessage="Please unplug and replug the device, then click the button below to continue uploading files."
                description="Please unplug and replug the device, then click the button below to continue uploading files."
                id="gui.firmware.reconnet"
            />
            </p>
            <button
              className={styles.btn}
              onClick={handleUserReconnectedAndUpload}
              disabled={busy}
            >
             <FormattedMessage
                defaultMessage="Reconnected, Continue Uploading"
                description="Reconnected, Continue Uploading"
                id="gui.firmware.continue"
            />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
