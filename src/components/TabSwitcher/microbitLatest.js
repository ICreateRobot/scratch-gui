// import {getGiteeTocken,getGithubTocken} from '../utils/TockenDb'
// const CONFIG = {
//     gitee: {
//       api: 'https://gitee.com/api/v5',
//       owner: 'lgmShine',
//       repo: 'bucket',
//       branch: 'master',
//       base: 'firmware/microbit',
//       token: getGiteeTocken(),
//     },
//     github: {
//       api: 'https://api.github.com',
//       owner: 'ICreateRobot',
//       repo: 'bucket',
//       branch: 'master',
//       base: 'firmware/microbit',
//       token: getGithubTocken(),
//     },
//   };

//   const BASE_URL =
//   'https://arkt-advert.oss-cn-beijing.aliyuncs.com/firmware/microbit';

//   const VERSION_TYPES = ['last', 'middle', 'long'];
  
//   /* ---------- 工具：版本比较 ---------- */
//   const normalizeVersion = v =>
//     String(v).replace(/^v/i, '').trim();
  
//   const compareVersion = (a, b) => {
//     const pa = normalizeVersion(a).split('.').map(n => parseInt(n) || 0);
//     const pb = normalizeVersion(b).split('.').map(n => parseInt(n) || 0);
//     const len = Math.max(pa.length, pb.length);
//     for (let i = 0; i < len; i++) {
//       if (pa[i] !== pb[i]) return pa[i] - pb[i];
//     }
//     return 0;
//   };
  
//   /* ---------- 单源实现（Gitee 或 GitHub） ---------- */
//   async function fetchLatestMicrobitHexFrom(source) {
//     const cfg = CONFIG[source];
//     const headers = cfg.token
//       ? { Authorization: `token ${cfg.token}` }
//       : {};
  
//     const rootUrl = `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.base}?ref=${cfg.branch}`;
//     const rootRes = await fetch(rootUrl, { headers });
  
//     if (!rootRes.ok) {
//       throw new Error(`${source}_ROOT_FAILED`);
//     }
  
//     const dirs = (await rootRes.json()).filter(i => i.type === 'dir');
  
//     let latest = null;
  
//     for (const dir of dirs) {
//       const dirUrl = `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${dir.path}?ref=${cfg.branch}`;
//       const res = await fetch(dirUrl, { headers });
//       if (!res.ok) continue;
  
//       const files = await res.json();
  
//       const versionFile = files.find(f => f.name === 'version.txt');
//       const hexFile = files.find(f => f.name.toLowerCase().endsWith('.hex'));
//       if (!versionFile || !hexFile) continue;
  
//       let version = '';
  
//       if (source === 'gitee') {
//         const vr = await fetch(
//           `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${versionFile.path}?ref=${cfg.branch}`,
//           { headers }
//         );
//         const vjson = await vr.json();
//         version = atob(vjson.content.replace(/\n/g, '')).trim();
//       } else {
//         const vr = await fetch(versionFile.download_url);
//         version = (await vr.text()).trim();
//       }
  
//       if (!latest || compareVersion(version, latest.version) > 0) {
//         latest = {
//           version,
//           url:
//             source === 'gitee'
//               ? `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${hexFile.path}?ref=${cfg.branch}`
//               : hexFile.download_url,
//         };
//       }
//     }
  
//     if (!latest) {
//       throw new Error(`${source}_NO_FIRMWARE`);
//     }
  
//     return latest.url;
//   }


//   /* ---------- 单源实现：获取最新 microbit 版本号 ---------- */
//     async function fetchLatestMicrobitVersionFrom(source) {
//         const cfg = CONFIG[source];
//         const headers = cfg.token
//         ? { Authorization: `token ${cfg.token}` }
//         : {};
    
//         const rootUrl = `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.base}?ref=${cfg.branch}`;
//         const rootRes = await fetch(rootUrl, { headers });
    
//         if (!rootRes.ok) {
//         throw new Error(`${source}_ROOT_FAILED`);
//         }
    
//         const dirs = (await rootRes.json()).filter(i => i.type === 'dir');
    
//         let latest = null;
    
//         for (const dir of dirs) {
//         const dirUrl = `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${dir.path}?ref=${cfg.branch}`;
//         const res = await fetch(dirUrl, { headers });
//         if (!res.ok) continue;
    
//         const files = await res.json();
    
//         const versionFile = files.find(f => f.name === 'version.txt');
//         if (!versionFile) continue;
    
//         let version = '';
    
//         if (source === 'gitee') {
//             const vr = await fetch(
//             `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${versionFile.path}?ref=${cfg.branch}`,
//             { headers }
//             );
//             const vjson = await vr.json();
//             version = atob(vjson.content.replace(/\n/g, '')).trim();
//         } else {
//             const vr = await fetch(versionFile.download_url);
//             version = (await vr.text()).trim();
//         }
    
//         if (!latest || compareVersion(version, latest.version) > 0) {
//             latest = { version };
//         }
//         }
    
//         if (!latest) {
//         throw new Error(`${source}_NO_VERSION`);
//         }
    
//         return latest.version;
//     }
  
//   /* ---------- 对外函数：Gitee → GitHub fallback ---------- */
//   export async function getLatestMicrobitHexUrlWithFallback() {
//     try {
//       console.log('尝试从 Gitee 获取 microbit 固件...');
//       return await fetchLatestMicrobitHexFrom('gitee');
//     } catch (giteeErr) {
//       console.warn('Gitee 失败，切换 GitHub', giteeErr);
  
//       try {
//         return await fetchLatestMicrobitHexFrom('github');
//       } catch (githubErr) {
//         console.error('GitHub 也失败', githubErr);
//         throw new Error('MICROBIT_FIRMWARE_UNAVAILABLE');
//       }
//     }
//   }
  

//   /* ---------- 对外函数：获取最新 microbit 版本号（带 fallback） ---------- */
//     export async function getLatestMicrobitVersionWithFallback() {
//         try {
//         console.log('尝试从 Gitee 获取 microbit 最新版本号...');
//         return await fetchLatestMicrobitVersionFrom('gitee');
//         } catch (giteeErr) {
//         console.warn('Gitee 失败，切换 GitHub', giteeErr);
    
//         try {
//             return await fetchLatestMicrobitVersionFrom('github');
//         } catch (githubErr) {
//             console.error('GitHub 也失败', githubErr);
//             throw new Error('MICROBIT_VERSION_UNAVAILABLE');
//         }
//         }
//     }


/* ---------- OSS 配置 ---------- */

const BASE_URL =
  'https://arkt-advert.oss-cn-beijing.aliyuncs.com/firmware/microbit';

const VERSION_TYPES = ['last', 'middle', 'long'];


/* ---------- 工具：版本比较 ---------- */

const normalizeVersion = v =>
  String(v).replace(/^v/i, '').trim();

const compareVersion = (a, b) => {
  const pa = normalizeVersion(a)
    .split('.')
    .map(n => parseInt(n, 10) || 0);

  const pb = normalizeVersion(b)
    .split('.')
    .map(n => parseInt(n, 10) || 0);

  const len = Math.max(pa.length, pb.length);

  for (let i = 0; i < len; i++) {
    if (pa[i] !== pb[i]) {
      return pa[i] - pb[i];
    }
  }

  return 0;
};


/* ---------- 获取最新 microbit 信息 ---------- */

async function fetchLatestMicrobitInfo() {
  let latest = null;

  for (const type of VERSION_TYPES) {
    try {
      const infoUrl = `${BASE_URL}/${type}/info.json`;
      const hexUrl = `${BASE_URL}/${type}/MICROBIT.hex`;

      // 检查 info.json 是否存在
      const infoRes = await fetch(infoUrl);

      if (!infoRes.ok) {
        console.warn(`${type} 的 info.json 不存在`);
        continue;
      }

      let info;

      try {
        info = await infoRes.json();
      } catch (e) {
        console.warn(`${type} 的 info.json 格式错误`);
        continue;
      }

      // version 必须存在
      if (!info.version) {
        console.warn(`${type} 缺少 version 字段`);
        continue;
      }

      // 检查 hex 文件是否存在
      const hexRes = await fetch(hexUrl, {
        method: 'HEAD',
      });

      if (!hexRes.ok) {
        console.warn(`${type} 的 MICROBIT.hex 不存在`);
        continue;
      }

      const item = {
        type,
        version: info.version,
        description: info.description || {},
        place: info.place || {},
        hexUrl,
      };

      if (
        !latest ||
        compareVersion(item.version, latest.version) > 0
      ) {
        latest = item;
      }
    } catch (err) {
      console.warn(`${type} 固件读取失败`, err);
    }
  }

  if (!latest) {
    throw new Error('MICROBIT_INFO_UNAVAILABLE');
  }

  return latest;
}


/* ---------- 对外函数：获取最新 microbit 固件地址 ---------- */

export async function getLatestMicrobitHexUrlWithFallback() {
  try {
    console.log('获取最新 microbit 固件...');

    const latest = await fetchLatestMicrobitInfo();

    return latest.hexUrl;
  } catch (err) {
    console.error('获取 microbit 固件失败', err);

    throw new Error('MICROBIT_FIRMWARE_UNAVAILABLE');
  }
}


/* ---------- 对外函数：获取最新 microbit 版本号 ---------- */

export async function getLatestMicrobitVersionWithFallback() {
  try {
    console.log('获取最新 microbit 版本号...');

    const latest = await fetchLatestMicrobitInfo();

    return latest.version;
  } catch (err) {
    console.error('获取 microbit 版本号失败', err);

    throw new Error('MICROBIT_VERSION_UNAVAILABLE');
  }
}


/* ---------- 可选：获取完整信息 ---------- */

export async function getLatestMicrobitInfoWithFallback() {
  try {
    console.log('获取最新 microbit 信息...');

    return await fetchLatestMicrobitInfo();
  } catch (err) {
    console.error('获取 microbit 信息失败', err);

    throw new Error('MICROBIT_INFO_UNAVAILABLE');
  }
}