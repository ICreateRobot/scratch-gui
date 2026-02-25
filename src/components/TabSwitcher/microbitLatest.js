import {getGiteeTocken,getGithubTocken} from '../utils/TockenDb'
const CONFIG = {
    gitee: {
      api: 'https://gitee.com/api/v5',
      owner: 'lgmShine',
      repo: 'bucket',
      branch: 'master',
      base: 'firmware/microbit',
      token: getGiteeTocken(),
    },
    github: {
      api: 'https://api.github.com',
      owner: 'ICreateRobot',
      repo: 'bucket',
      branch: 'master',
      base: 'firmware/microbit',
      token: getGithubTocken(),
    },
  };
  
  /* ---------- 工具：版本比较 ---------- */
  const normalizeVersion = v =>
    String(v).replace(/^v/i, '').trim();
  
  const compareVersion = (a, b) => {
    const pa = normalizeVersion(a).split('.').map(n => parseInt(n) || 0);
    const pb = normalizeVersion(b).split('.').map(n => parseInt(n) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      if (pa[i] !== pb[i]) return pa[i] - pb[i];
    }
    return 0;
  };
  
  /* ---------- 单源实现（Gitee 或 GitHub） ---------- */
  async function fetchLatestMicrobitHexFrom(source) {
    const cfg = CONFIG[source];
    const headers = cfg.token
      ? { Authorization: `token ${cfg.token}` }
      : {};
  
    const rootUrl = `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.base}?ref=${cfg.branch}`;
    const rootRes = await fetch(rootUrl, { headers });
  
    if (!rootRes.ok) {
      throw new Error(`${source}_ROOT_FAILED`);
    }
  
    const dirs = (await rootRes.json()).filter(i => i.type === 'dir');
  
    let latest = null;
  
    for (const dir of dirs) {
      const dirUrl = `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${dir.path}?ref=${cfg.branch}`;
      const res = await fetch(dirUrl, { headers });
      if (!res.ok) continue;
  
      const files = await res.json();
  
      const versionFile = files.find(f => f.name === 'version.txt');
      const hexFile = files.find(f => f.name.toLowerCase().endsWith('.hex'));
      if (!versionFile || !hexFile) continue;
  
      let version = '';
  
      if (source === 'gitee') {
        const vr = await fetch(
          `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${versionFile.path}?ref=${cfg.branch}`,
          { headers }
        );
        const vjson = await vr.json();
        version = atob(vjson.content.replace(/\n/g, '')).trim();
      } else {
        const vr = await fetch(versionFile.download_url);
        version = (await vr.text()).trim();
      }
  
      if (!latest || compareVersion(version, latest.version) > 0) {
        latest = {
          version,
          url:
            source === 'gitee'
              ? `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${hexFile.path}?ref=${cfg.branch}`
              : hexFile.download_url,
        };
      }
    }
  
    if (!latest) {
      throw new Error(`${source}_NO_FIRMWARE`);
    }
  
    return latest.url;
  }


  /* ---------- 单源实现：获取最新 microbit 版本号 ---------- */
    async function fetchLatestMicrobitVersionFrom(source) {
        const cfg = CONFIG[source];
        const headers = cfg.token
        ? { Authorization: `token ${cfg.token}` }
        : {};
    
        const rootUrl = `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.base}?ref=${cfg.branch}`;
        const rootRes = await fetch(rootUrl, { headers });
    
        if (!rootRes.ok) {
        throw new Error(`${source}_ROOT_FAILED`);
        }
    
        const dirs = (await rootRes.json()).filter(i => i.type === 'dir');
    
        let latest = null;
    
        for (const dir of dirs) {
        const dirUrl = `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${dir.path}?ref=${cfg.branch}`;
        const res = await fetch(dirUrl, { headers });
        if (!res.ok) continue;
    
        const files = await res.json();
    
        const versionFile = files.find(f => f.name === 'version.txt');
        if (!versionFile) continue;
    
        let version = '';
    
        if (source === 'gitee') {
            const vr = await fetch(
            `${cfg.api}/repos/${cfg.owner}/${cfg.repo}/contents/${versionFile.path}?ref=${cfg.branch}`,
            { headers }
            );
            const vjson = await vr.json();
            version = atob(vjson.content.replace(/\n/g, '')).trim();
        } else {
            const vr = await fetch(versionFile.download_url);
            version = (await vr.text()).trim();
        }
    
        if (!latest || compareVersion(version, latest.version) > 0) {
            latest = { version };
        }
        }
    
        if (!latest) {
        throw new Error(`${source}_NO_VERSION`);
        }
    
        return latest.version;
    }
  
  /* ---------- 对外函数：Gitee → GitHub fallback ---------- */
  export async function getLatestMicrobitHexUrlWithFallback() {
    try {
      console.log('尝试从 Gitee 获取 microbit 固件...');
      return await fetchLatestMicrobitHexFrom('gitee');
    } catch (giteeErr) {
      console.warn('Gitee 失败，切换 GitHub', giteeErr);
  
      try {
        return await fetchLatestMicrobitHexFrom('github');
      } catch (githubErr) {
        console.error('GitHub 也失败', githubErr);
        throw new Error('MICROBIT_FIRMWARE_UNAVAILABLE');
      }
    }
  }
  

  /* ---------- 对外函数：获取最新 microbit 版本号（带 fallback） ---------- */
    export async function getLatestMicrobitVersionWithFallback() {
        try {
        console.log('尝试从 Gitee 获取 microbit 最新版本号...');
        return await fetchLatestMicrobitVersionFrom('gitee');
        } catch (giteeErr) {
        console.warn('Gitee 失败，切换 GitHub', giteeErr);
    
        try {
            return await fetchLatestMicrobitVersionFrom('github');
        } catch (githubErr) {
            console.error('GitHub 也失败', githubErr);
            throw new Error('MICROBIT_VERSION_UNAVAILABLE');
        }
        }
    }