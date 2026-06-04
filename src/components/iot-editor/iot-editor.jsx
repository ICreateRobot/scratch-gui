import React, { useState, useRef } from 'react';
import ComponentPanel from '../ComponentPanel/ComponentPanel.jsx';
import Editor from '../Editor/Editor.jsx';
import PropertyPanel from '../PropertyPanel/PropertyPanel.jsx';
import Preview from '../Preview/Preview.jsx';
import useStore from '../../stores/useStore.js';
import styles from './iot-editor.css';

function IotEditor() {
  const {
    isRunning,
    screenSize,
    updateScreenSize,
    showScreenBorder,
    toggleScreenBorder,
    saveProject,
    loadProject,
    newProject
  } = useStore();

  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const fileInputRef = useRef(null);

  // 屏幕尺寸选项
  const presetSizes = [
    { name: '默认 (640x480)', width: 640, height: 480 },
    { name: '小屏 (320x240)', width: 320, height: 240 },
    { name: '中屏 (800x600)', width: 800, height: 600 },
    { name: '大屏 (1024x768)', width: 1024, height: 768 },
    { name: '手机竖屏 (375x667)', width: 375, height: 667 },
    { name: '手机横屏 (667x375)', width: 667, height: 375 },
    { name: '平板竖屏 (768x1024)', width: 768, height: 1024 },
    { name: '平板横屏 (1024x768)', width: 1024, height: 768 }
  ];

  const getScreenSizes = () => {
    const sizes = [...presetSizes];

    if (screenSize.name.includes('自定义') &&
      !presetSizes.some(size => size.width === screenSize.width && size.height === screenSize.height)) {

      if (!sizes.some(size => size.name === screenSize.name)) {
        sizes.push(screenSize);
      }
    }

    if (!sizes.some(size => size.name === '自定义')) {
      sizes.push({ name: '自定义', width: 640, height: 480 });
    }

    return sizes;
  };

  const screenSizes = getScreenSizes();

  const handleSizeChange = (e) => {
    const selectedSize = screenSizes.find(size => size.name === e.target.value);
    if (selectedSize) {
      if (selectedSize.name === '自定义') {
        setShowCustomInput(true);
        if (screenSize.name.includes('自定义') && screenSize.name !== '自定义') {
          setCustomWidth(screenSize.width.toString());
          setCustomHeight(screenSize.height.toString());
        } else {
          setCustomWidth('640');
          setCustomHeight('480');
        }
      } else {
        setShowCustomInput(false);
        updateScreenSize(selectedSize);
      }
    }
  };

  const handleCustomSizeApply = () => {
    const width = parseInt(customWidth) || 640;
    const height = parseInt(customHeight) || 480;

    const customSize = {
      name: `自定义 (${width}x${height})`,
      width,
      height
    };

    updateScreenSize(customSize);
    setShowCustomInput(false);
  };

  const handleCustomSizeCancel = () => {
    setShowCustomInput(false);
    if (screenSize.name.includes('自定义') && screenSize.name !== '自定义') {
      setCustomWidth(screenSize.width.toString());
      setCustomHeight(screenSize.height.toString());
    } else {
      setCustomWidth('');
      setCustomHeight('');
    }
  };

  // 保存项目
  const handleSaveProject = () => {
    try {
      saveProject();
      alert('项目保存成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  // 打开项目
  const handleOpenProject = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 处理文件选择
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const projectData = JSON.parse(content);

        // 验证项目数据
        if (!projectData.version || !projectData.components) {
          throw new Error('无效的项目文件');
        }

        // 加载项目
        loadProject(projectData);
        alert('项目加载成功！');
      } catch (error) {
        console.error('加载失败:', error);
        alert('加载失败：文件格式不正确');
      }
    };

    reader.onerror = () => {
      alert('读取文件失败');
    };

    reader.readAsText(file);

    // 清空input，以便再次选择同一文件
    event.target.value = '';
  };

  // 新建项目
  const handleNewProject = () => {
    newProject();
  };

  return (
    <div className={styles.app}>
      <div className={styles.appHeader}>
        <h1>物联网可视化开发平台</h1>
        <div className={styles.toolbar}>
          {/* 项目操作按钮 */}
          <div className={styles.projectOperations}>
            <button className={styles.newBtn} onClick={handleNewProject} title="新建项目">
              📄 新建
            </button>
            <button className={styles.saveBtn} onClick={handleSaveProject} title="保存项目">
              💾 保存
            </button>
            <button className={styles.openBtn} onClick={handleOpenProject} title="打开项目">
              📂 打开
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleFileChange}
            />
          </div>

          {/* 屏幕尺寸选择器 */}
          <div className={styles.sizeSelector}>
            <select
              value={screenSize.name}
              onChange={handleSizeChange}
              title="选择或自定义屏幕尺寸"
            >
              {screenSizes.map(size => (
                <option key={size.name} value={size.name}>
                  {size.name}
                </option>
              ))}
            </select>
          </div>

          {/* 自定义尺寸输入框 */}
          {showCustomInput && (
            <div className={styles.customSizeInput}>
              <input
                type="number"
                placeholder="宽度"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                min="100"
                max="1920"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomSizeApply();
                  }
                }}
              />
              <span>×</span>
              <input
                type="number"
                placeholder="高度"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                min="100"
                max="1920"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomSizeApply();
                  }
                }}
              />
              <button
                className={styles.applyBtn}
                onClick={handleCustomSizeApply}
                disabled={!customWidth || !customHeight}
              >
                应用
              </button>
              <button
                className={styles.cancelBtn}
                onClick={handleCustomSizeCancel}
              >
                取消
              </button>
            </div>
          )}

          {/* 边框切换按钮 */}
          {/* <button
            className={`border-toggle-btn ${showScreenBorder ? 'active' : ''}`}
            onClick={toggleScreenBorder}
            title={showScreenBorder ? "隐藏边框" : "显示边框"}
          >
            {showScreenBorder ? '📱 边框开' : '📱 边框关'}
          </button> */}

          <button className={styles.runBtn} onClick={() => useStore.getState().generatePreview()}>
            ▶️ 运行预览
          </button>
        </div>
      </div>

      <div className={styles.appContent}>
        <ComponentPanel />
        <Editor />
        <PropertyPanel />
      </div>

      {/* 预览弹窗 */}
      <Preview />
    </div>
  );
}

export default IotEditor;