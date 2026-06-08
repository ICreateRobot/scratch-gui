export default async function ({ addon, console, msg }) {
  let placeHolderDiv = null;
  let lockObject = null;
  let lockButton = null;
  let lockIcon = null;
  let flyOut = null;
  let scrollBar = null;
  let toggle = false;
  let flyoutLock = false;
  let closeOnMouseUp = false;
  let scrollAnimation = true;
  let lastSelectedDom = null;

  const SVG_NS = "http://www.w3.org/2000/svg";

  const Blockly = await addon.tab.traps.getBlockly();

  function getSpeedValue() {
    let data = {
      none: "0",
      short: "0.2",
      default: "0.3",
      long: "0.5",
    };
    return data[addon.settings.get("speed")];
  }

  function getToggleSetting() {
    return addon.settings.get("toggle");
  }

  function setTransition(speed) {
    for (let element of [flyOut, scrollBar]) {
      element.style.transitionDuration = `${speed}s`;
    }
  }

  function removeTransition() {
    for (let element of [flyOut, scrollBar]) {
      element.style.removeProperty("transition-duration");
    }
  }

  function updateLockDisplay() {
    lockObject.classList.toggle("locked", flyoutLock);
    lockButton.title = flyoutLock ? msg("unlock") : msg("lock");
    lockIcon.src = addon.self.getResource(`/${flyoutLock ? "" : "un"}lock.svg`) /* rewritten by pull.js */;
  }

  function autoLock() {
    const option = addon.settings.get("lockLoad");
    if (option) {
      if (getToggleSetting() === "category") {
        toggle = true;
      } else {
        flyoutLock = option;
        updateLockDisplay();
      }
      flyOut.classList.remove("sa-flyoutClose");
      scrollBar.classList.remove("sa-flyoutClose");
    }
  }

  function onmouseenter(e, speed = {}) {
    // If a mouse event was passed, only open flyout if the workspace isn't being dragged
    if (
      !e ||
      e.buttons === 0 ||
      document.querySelector(".blocklyToolboxDiv").className.includes("blocklyToolboxDelete")
    ) {
      speed = typeof speed === "object" ? getSpeedValue() : speed;
      setTransition(speed);
      flyOut.classList.remove("sa-flyoutClose");
      scrollBar.classList.remove("sa-flyoutClose");
      setTimeout(() => {
        addon.tab.traps.getWorkspace()?.recordCachedAreas();
        removeTransition();
      }, speed * 1000);
    }
    closeOnMouseUp = false; // only close if the mouseup event happens outside the flyout
  }

  function onmouseleave(e, speed = getSpeedValue()) {
    if (flyoutLock) return;
    if (e && e.buttons) {
      // dragging a block or scrollbar
      closeOnMouseUp = true;
      return;
    }
    setTransition(speed);
    flyOut.classList.add("sa-flyoutClose");
    scrollBar.classList.add("sa-flyoutClose");
    setTimeout(() => {
      addon.tab.traps.getWorkspace()?.recordCachedAreas();
      removeTransition();
    }, speed * 1000);
  }

  const updateIsFullScreen = () => {
    const isFullScreen = addon.tab.redux.state.scratchGui.mode.isFullScreen;
    document.documentElement.classList.toggle("sa-hide-flyout-not-fullscreen", !isFullScreen);
  };
  updateIsFullScreen();

  let didOneTimeSetup = false;
  function doOneTimeSetup() {
    if (didOneTimeSetup) {
      return;
    }
    didOneTimeSetup = true;

    addon.tab.redux.initialize();
    addon.tab.redux.addEventListener("statechanged", (e) => {
      switch (e.detail.action.type) {
        // Event casted when you switch between tabs
        case "scratch-gui/navigation/ACTIVATE_TAB": {
          // always 0, 1, 2
          const toggleSetting = getToggleSetting();
          if (
            e.detail.action.activeTabIndex === 0 &&
            !addon.self.disabled &&
            (toggleSetting === "hover" || toggleSetting === "cathover")
          ) {
            onmouseleave(null, 0);
            toggle = false;
          }
          break;
        }
        case "scratch-gui/mode/SET_FULL_SCREEN":
          updateIsFullScreen();
          break;
      }
    });

    document.body.addEventListener("mouseup", () => {
      if (closeOnMouseUp) {
        onmouseleave();
        closeOnMouseUp = false;
      }
    });

    if (addon.self.enabledLate && getToggleSetting() === "category" && !addon.settings.get("lockLoad")) {
      Blockly.getMainWorkspace().getToolbox().selectedItem_.setSelected(false);
    }
    addon.self.addEventListener("disabled", () => {
      Blockly.getMainWorkspace().getToolbox().selectedItem_.setSelected(true);
    });
    addon.self.addEventListener("reenabled", () => {
      if (getToggleSetting() === "category" && !addon.settings.get("lockLoad")) {
        Blockly.getMainWorkspace().getToolbox().selectedItem_.setSelected(false);
        onmouseleave(null, 0);
        toggle = false;
      }
    });

    addon.settings.addEventListener("change", () => {
      if (addon.self.disabled) return;
      if (getToggleSetting() === "category") {
        // switching to category click mode
        // close the flyout unless it's locked
        if (flyoutLock) {
          toggle = true;
          flyoutLock = false;
          updateLockDisplay();
        } else {
          Blockly.getMainWorkspace().getToolbox().selectedItem_.setSelected(false);
          onmouseleave(null, 0);
          toggle = false;
        }
      } else {
        // switching from category click to a different mode
        if (addon.settings.get("lockLoad")) {
          flyoutLock = true;
          updateLockDisplay();
        } else {
          onmouseleave();
        }
        Blockly.getMainWorkspace().getToolbox().selectedItem_.setSelected(true);
      }
    });

    // category click mode
    const oldSetSelectedItem = Blockly.Toolbox.prototype.setSelectedItem;
    Blockly.Toolbox.prototype.setSelectedItem = function (item, shouldScroll = true) {
      const previousSelection = this.selectedItem_;
      oldSetSelectedItem.call(this, item, shouldScroll);
      if (addon.self.disabled || getToggleSetting() !== "category") return;
      if (!shouldScroll && !toggle) {
        // ignore initial selection when updating the toolbox
        item.setSelected(false);
      } else if (item === previousSelection) {
        toggle = !toggle;
        if (toggle) onmouseenter();
        else {
          onmouseleave();
          item.setSelected(false);
        }
      } else if (!toggle) {
        scrollAnimation = false;
        toggle = true;
        onmouseenter();
      }
    };


    const oldSelectCategoryById = Blockly.Toolbox.prototype.selectCategoryById;
    Blockly.Toolbox.prototype.selectCategoryById = function (...args) {
      // called after populating the toolbox
      // ignore if the palette is closed
      if (!addon.self.disabled && getToggleSetting() === "category" && !toggle) return;
      return oldSelectCategoryById.call(this, ...args);
    };

    const oldStepScrollAnimation = Blockly.Flyout.prototype.stepScrollAnimation;
    Blockly.Flyout.prototype.stepScrollAnimation = function (...args) {
      // scrolling should not be animated when opening the flyout in category click mode
      if (!scrollAnimation) {
        this.scrollbar_.set(this.scrollTarget);
        this.scrollTarget = null;
        scrollAnimation = true;
        return;
      }
      return oldStepScrollAnimation.apply(this, args);
    };

    

    Blockly.getMainWorkspace().addChangeListener((event) => {
      if (addon.self.disabled) return;
      if (flyoutLock) return;
    
      console.log('aaaaa:',event.element)
      // ✅ 拖拽结束（最稳定）
      if (
        event.type === Blockly.Events.UI &&
        event.element === "selected"
      ) {
        onmouseleave(null);

        const workspace = Blockly.getMainWorkspace();
        const toolboxObj = workspace.getToolbox();
        const selectedItem = toolboxObj.getSelectedItem();
        selectedItem?.setSelected(false);
        lastSelectedDom = null;
      }
    });

    document.body.addEventListener("touchstart", (e) => {
      if (flyoutLock) return;
    
      const toolbox = document.querySelector(".blocklyToolboxDiv");
    
      const isInside =
        flyOut?.contains(e.target) ||
        toolbox?.contains(e.target);
    
      if (!isInside) {
        onmouseleave(null);
      }
    });
  }

  function handleRelease() {
    if (addon.self.disabled) return;
    if (flyoutLock) return;
  
    const workspace = Blockly.getMainWorkspace();
  
    // ❗ 只有真的拖了积木才关闭
    if (workspace && workspace.isDragging && workspace.isDragging()) {
      return; // 还在拖，不处理
    }
  
    // ⭐ 判断刚刚是否发生过拖拽（关键技巧）
    if (!flyOut.classList.contains("sa-flyoutClose")) {
      setTimeout(() => {
        // 再检查一次（防止误触）
        if (!workspace.isDragging()) {
          onmouseleave(null);
        }
      }, 100);
    }
  }

  while (true) {
    flyOut = await addon.tab.waitForElement(".blocklyFlyout", {
      markAsSeen: true,
      reduxEvents: [
        "scratch-gui/mode/SET_PLAYER",
        "scratch-gui/locales/SELECT_LOCALE",
        "scratch-gui/theme/SET_THEME",
        "fontsLoaded/SET_FONTS_LOADED",
      ],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    scrollBar = document.querySelector(".blocklyFlyoutScrollbar");
    const blocksWrapper = document.querySelector('[class*="gui_blocks-wrapper_"]');
    const injectionDiv = document.querySelector(".injectionDiv");

    // Code editor left border
    const borderElement1 = document.createElement("div");
    borderElement1.className = "sa-flyout-border-1";
    addon.tab.displayNoneWhileDisabled(borderElement1);
    injectionDiv.appendChild(borderElement1);
    const borderElement2 = document.createElement("div");
    borderElement2.className = "sa-flyout-border-2";
    addon.tab.displayNoneWhileDisabled(borderElement2);
    injectionDiv.appendChild(borderElement2);

    // Placeholder Div
    if (placeHolderDiv) placeHolderDiv.remove();
    placeHolderDiv = document.createElement("div");
    blocksWrapper.appendChild(placeHolderDiv);
    placeHolderDiv.className = "sa-flyout-placeHolder";
    placeHolderDiv.style.display = "none"; // overridden by userstyle if the addon is enabled

    // Lock image
    if (lockObject) lockObject.remove();
    lockObject = document.createElementNS(SVG_NS, "foreignObject");
    lockObject.setAttribute("class", "sa-lock-object");
    lockObject.style.display = "none"; // overridden by userstyle if the addon is enabled
    lockButton = document.createElement("button");
    lockButton.className = "sa-lock-button";
    lockIcon = document.createElement("img");
    lockIcon.alt = "";
    updateLockDisplay();
    // lockButton.onclick = () => {
    //   flyoutLock = !flyoutLock;
    //   updateLockDisplay();
    // };
    lockButton.addEventListener("click", (e) => {
      e.stopPropagation();
      flyoutLock = !flyoutLock;
      updateLockDisplay();
    });
    
    lockButton.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      e.preventDefault(); // ⭐ 防止穿透
      flyoutLock = !flyoutLock;
      updateLockDisplay();
    });
    lockButton.appendChild(lockIcon);
    lockObject.appendChild(lockButton);
    flyOut.appendChild(lockObject);

    onmouseleave(null, 0);
    toggle = false;

    const toolbox = document.querySelector(".blocklyToolboxDiv");
    const addExtensionButton = document.querySelector("[class^=gui_extension-button-container_]");

    // for (let element of [toolbox, addExtensionButton, flyOut, scrollBar]) {
    //   element.onmouseenter = (e) => {
    //     const toggleSetting = getToggleSetting();
    //     if (!addon.self.disabled && (toggleSetting === "hover" || toggleSetting === "cathover")) onmouseenter(e);
    //   };
    //   element.onmouseleave = (e) => {
    //     const toggleSetting = getToggleSetting();
    //     if (!addon.self.disabled && (toggleSetting === "hover" || toggleSetting === "cathover")) onmouseleave(e);
    //   };
    // }
    // placeHolderDiv.onmouseenter = (e) => {
    //   if (!addon.self.disabled && getToggleSetting() === "hover") onmouseenter(e);
    // };
    // placeHolderDiv.onmouseleave = (e) => {
    //   if (!addon.self.disabled && getToggleSetting() === "hover") onmouseleave(e);
    // };

    function toggleFlyout() {
      if (flyoutLock) return;
    
      if (flyOut.classList.contains("sa-flyoutClose")) {
        onmouseenter(null); // 打开
      } else {
        onmouseleave(null); // 关闭
      }
    }

    
    toolbox.addEventListener("click", (e) => {
      if (addon.self.disabled) return;
    
      const workspace = Blockly.getMainWorkspace();
      const toolboxObj = workspace.getToolbox();
    
      const selectedItem = toolboxObj.getSelectedItem();
      const clickedDom = e.target.closest(".scratchCategoryMenuItem");
    
      if (getToggleSetting() === "hover") {
        if (!clickedDom) return;
    
        const isSameCategory = clickedDom === lastSelectedDom;
    
        if (isSameCategory) {
          // ✅ 点击当前分类 → 关闭
          onmouseleave(null);
          selectedItem?.setSelected(false);
          lastSelectedDom = null;
        } else {
          // ✅ 点击不同分类 → 打开/保持打开
          if (flyOut.classList.contains("sa-flyoutClose")) {
            onmouseenter(null);
          }
          lastSelectedDom = clickedDom; // ⭐ 更新记录
        }
    
        return;
      }
    
      toggleFlyout();
    });
    // toolbox.addEventListener("click", (e) => {
    //   if (addon.self.disabled) return;
    //   toggleFlyout();
    // });
    toolbox.addEventListener("touchstart", (e) => {
      // if (addon.self.disabled) return;
      // toggleFlyout();
      const workspace = Blockly.getMainWorkspace();
      const toolboxObj = workspace.getToolbox();
    
      const selectedItem = toolboxObj.getSelectedItem();
      const clickedDom = e.target.closest(".scratchCategoryMenuItem");
    
      if (getToggleSetting() === "hover") {
        if (!clickedDom) return;
    
        const isSameCategory = clickedDom === lastSelectedDom;
    
        if (isSameCategory) {
          // ✅ 点击当前分类 → 关闭
          onmouseleave(null);
          selectedItem?.setSelected(false);
          lastSelectedDom = null;
        } else {
          // ✅ 点击不同分类 → 打开/保持打开
          if (flyOut.classList.contains("sa-flyoutClose")) {
            onmouseenter(null);
          }
          lastSelectedDom = clickedDom; // ⭐ 更新记录
        }
    
        return;
      }
    
      toggleFlyout();
    });
    doOneTimeSetup();
    autoLock();
    Blockly.svgResize(Blockly.getMainWorkspace());
  }
}
