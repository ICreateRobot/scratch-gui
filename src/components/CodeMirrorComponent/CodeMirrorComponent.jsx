import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import codeModule from '../../../../../utils/global.js'
// import CodeMirror from 'codemirror';
// import 'codemirror/lib/codemirror.css';
// import 'codemirror/mode/lua/lua';
// import hljs from 'highlight.js';
// import 'highlight.js/styles/default.css'; // 引入样式
// import lua from 'highlight.js/lib/languages/lua';

// hljs.registerLanguage('lua', lua);

import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { EditorView } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import { oneDark } from '@codemirror/theme-one-dark';



const CodeMirrorComponent = ({ code, options }) => {
    const editorRef = useRef(null);
    // console.log(code)

    const codeMirrorRef = useRef(null);
    const STORAGE_KEY='tw:theme'
    const local = localStorage.getItem(STORAGE_KEY);
     // 判断是否暗色
    let editorTheme = "light";
    try {
        if (local) {
            if (local === "dark") {
                editorTheme = oneDark;
            } else {
                const parsed = JSON.parse(local);
                if (parsed?.gui === "dark") {
                    editorTheme = oneDark;
                }
            }
        }
    } catch (e) {
        // 解析失败则使用默认 light
    }

    useEffect(() => {
        // if (!codeMirrorRef.current) {
        //     console.log('执行了')
        //     codeMirrorRef.current = CodeMirror.fromTextArea(editorRef.current, {
        //         mode: 'lua',
        //         lineNumbers: true,
        //         value: code,
        //         ...options
        //     });
        // } else {
        //     console.log('否则')
        //     console.log(code)
        //     codeMirrorRef.current.setValue(code);
        // }

        if(editorRef.current){
            editorRef.current.value=code
        }
        
        // 清理函数
        // return () => {
        //     if (codeMirrorRef.current) {
        //         codeMirrorRef.current.toTextArea();
        //     }
        // };
    }, [code, options]);

    const handleChange = (e) => {
        // console.log(e)
        const updatedCode = e;
        // console.log(updatedCode)
        codeModule.setCode(updatedCode)
    };


    return (
        // <div style={{ border: '1px solid #ccc', backgroundColor: '#f9f9f9', padding: '10px',height:'100%'}}>
        //      <textarea spellCheck="false" ref={editorRef} style={{height:'100%',width:'460px'}} defaultValue={code} onChange={handleChange}>
        //      </textarea>
        // </div>

        <div style={{ border: '1px solid #ccc', backgroundColor: '#f9f9f9', padding: '10px',borderRadius:'10px',height:'60vh'}}>
          <CodeMirror
            value={code}
            height="50vh"
            width='460px'
            extensions={[
              python(),
              autocompletion(),
              EditorView.lineWrapping,
            ]}
            // theme="light"
            theme={editorTheme}
            // theme={oneDark}
            onChange={handleChange}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              foldGutter: true,
              autocompletion: true,
              syntaxHighlighting: true,
            }}
            style={{borderRadius:'10px'}}
          />
        </div>
       
        
    );
};


CodeMirrorComponent.propTypes = {
    code: PropTypes.string.isRequired,
    options: PropTypes.object
};

CodeMirrorComponent.defaultProps = {
    options: {}
};

export default CodeMirrorComponent;