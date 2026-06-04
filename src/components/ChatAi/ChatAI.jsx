import React, { useState, useRef, useEffect } from "react";
import styles from "./ChatAI.css";
import formatMessage  from 'format-message';
import {FormattedMessage} from 'react-intl';
// import { getWorkspace, Blockly } from "../blocklyManager";

const ChatAI = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("chat");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  let message=formatMessage({
      id: 'gui.ai.pleaseInput',
      default: 'Please enter',
      description: 'gui.ai.pleaseInput'
  })

  const handleSend = async () => {

//     let xml=`<xml>
//     <block type="motion_movesteps">
//       <value name="STEPS">
//           <shadow type="math_number">
//               <field name="NUM">10</field>
//           </shadow>
//       </value>
//   </block>
//   <block type="motion_turnright">
//       <value name="DEGREES">
//           <shadow type="math_number">
//               <field name="NUM">15</field>
//           </shadow>
//       </value>
//   </block>
// </xml>`

//     replaceBlocklyWorkspace(xml);
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    const userInput = input;
    setMessages(prev => [...prev, { role: "user", content: userInput }]);
    setInput("");

    try {
      const url =
        mode === "blockly"
          ? "http://localhost:3001/api/blockly"
          : "http://localhost:3001/api/chat";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: userInput })
      });

      const data = await res.json();

      if (mode === "blockly") {
        if (data.success && data.blocklyXml) {
          setMessages(prev => [
            ...prev,
            { role: "ai", content: formatMessage({
                id: 'gui.ai.blocklySuccess',
                default: 'Blockly code generated successfully!',
                description: 'gui.ai.blocklySuccess'
            }) }
          ]);

          replaceBlocklyWorkspace(data.blocklyXml);
        } else {
          setMessages(prev => [
            ...prev,
            {
              role: "ai",
              content: `${formatMessage({
                  id: 'gui.ai.genFailed',
                  default: 'Generation failed',
                  description: 'gui.ai.genFailed'
              })}: ${data.error || formatMessage({
                id: 'gui.ai.unknowErr',
                default: 'Unknown error',
                description: 'gui.ai.unknowErr'
            })}`
            }
          ]);
        }
      } else {
        setMessages(prev => [
          ...prev,
          { role: "ai", content: data.content }
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: "ai", content: formatMessage({
            id: 'gui.ai.aiFailed',
            default: 'AI request failed',
            description: 'gui.ai.aiFailed'
        }) }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const replaceBlocklyWorkspace = (xmlString) => {
    window.onWorkspaceUpdate({
      xml: xmlString
    })
    // try {
    //   const ws = window.getWorkspace && window.getWorkspace();
    //   const Blockly = window.Blockly;

    //   if (!ws || !Blockly) {
    //     console.error("Blockly 未初始化");
    //     return;
    //   }

    //   ws.clear();
    //   const xmlDom = Blockly.utils.xml.textToDom(xmlString);
    //   Blockly.Xml.domToWorkspace(xmlDom, ws);

    //   console.log("✅ 工作区更新完成");
    // } catch (error) {
    //   console.error("替换 Blockly 工作区失败:", error);
    // }
  };

  return (
    <div className={styles.chatAiContainer}>
      {/* 模式切换 */}
      <div style={{ padding: "8px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={styles.chatModeButton}
            onClick={() => setMode("chat")}
            style={{ background: mode === "chat" ? "#4aa1ff" : "#ccc" }}
          >
            <FormattedMessage
              defaultMessage="Q&A Mode"
              description="Q&A Mode"
              id="gui.ai.qaMode"
            />
          </button>

          <button
            className={styles.chatModeButton}
            onClick={() => setMode("blockly")}
            style={{ background: mode === "blockly" ? "#4aa1ff" : "#ccc" }}
          >
            <FormattedMessage
              defaultMessage="Coding Mode"
              description="Coding Mode"
              id="gui.ai.codeMode"
            />
          </button>
        </div>

        {/* Beta 提示：单独一行 */}
        <div
          style={{
            fontSize: "12px",
            color: "#666",
            opacity: 0.9,
            marginTop: "6px"
          }}
        >
          <FormattedMessage
            defaultMessage="The AI feature is currently in beta. You can try it now."
            description="The AI feature is currently in beta. You can try it now."
            id="gui.ai.beta"
          />
        </div>
      </div>
  
      {/* 消息展示区 */}
      <div className={styles.chatAiMessages}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`${styles.chatAiMessageWrapper} ${styles[m.role]}`}
          >
            <div
              className={`${styles.chatAiMessage} ${styles[m.role]}`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
  
      {/* 输入框 */}
      <div className={styles.chatAiInputContainer}>
        <input
          className={styles.chatAiInput}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder={message}
        />
        <button
          className={styles.chatAiSendButton}
          onClick={handleSend}
        >
          {isLoading ? formatMessage({
              id: 'gui.ai.sending',
              default: 'Sending...',
              description: 'gui.ai.sending'
          }) : formatMessage({
            id: 'gui.ai.send',
            default: 'Send',
            description: 'gui.ai.send'
        })}
        </button>
      </div>
    </div>
  );
};

export default ChatAI;