import {getLastTime,setLastTime} from './utils'

let writing = false;

async function safeSerialWrite(writer, data) {
  if (!writer) return;

  // 等待上一次写入完成（简单互斥）
  while (writing) {
    await new Promise(r => setTimeout(r, 5));
  }

  writing = true;

  try {
    // 发送前小延迟，防止设备处理不过来
    await new Promise(r => setTimeout(r, 100));

    const str = data + '\n';
    const encoder = new TextEncoder();
    const buffer = encoder.encode(str);

    await writer.write(buffer);

    // ⭐ 只在真正写完后更新时间
    if (typeof setLastTime === 'function') {
      setLastTime(Date.now());
    }

  } catch (err) {
    console.error("串口写入失败:", err);
    throw err;
  } finally {
    writing = false;
  }
}

export {
    safeSerialWrite
}
