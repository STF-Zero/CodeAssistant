import { Editor, Monaco } from "@monaco-editor/react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { VscCode } from "react-icons/vsc";
import { editor, languages } from "monaco-editor";
import { I18nKey } from "#/i18n/declaration";
import { useFiles } from "#/context/files";
import OpenHands from "#/api/open-hands";

interface CodeEditorCompoonentProps {
  isReadOnly: boolean;
  setSelectedText: (text: string | null) => void; // 接收设置选中文本的函数
}

function CodeEditorCompoonent({ isReadOnly, setSelectedText }: CodeEditorCompoonentProps) {
  const { t } = useTranslation();
  const {
    files,
    selectedPath,
    modifiedFiles,
    modifyFileContent,
    saveFileContent: saveNewFileContent,
  } = useFiles();

  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [llmResponse, setLlmResponse] = useState<string>("初始提示词");
  const [monacoInstance, setMonacoInstance] = useState<Monaco | null>(null);
  // let tmpProvider: languages.InlineCompletionsProvider<languages.InlineCompletions<languages.InlineCompletion>>;
  let answer: string;

  const inlineCompletionsProvider = (monaco: Monaco) => {
    return {
      provideInlineCompletions: async (model: any, position: { lineNumber: any; column: any; }, context: any, token: any) => {
        return {
          items: [
            {
              range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
              insertText: llmResponse,
              command: {
                id: 'typeSuggestion',
                title: '插入建议'
              }
            }
          ]
        };
      },
      freeInlineCompletions: (completions: any) => { }
    };
  };

  const handleEditorDidMount = React.useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: Monaco): void => {

      setMonacoInstance(monaco);
      const languageId = editor.getModel()?.getLanguageId();

      let timeoutId: NodeJS.Timeout | null = null;

      monaco.editor.defineTheme("my-theme", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#171717",
        },
      });

      monaco.editor.setTheme("my-theme");

      const provider = inlineCompletionsProvider(monaco);
      monaco.languages.registerInlineCompletionsProvider(`${languageId}`, provider);

      editor.onDidChangeModelContent(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          // answer = "";
        }
        timeoutId = setTimeout(async () => {
          const value = editor.getValue();
          const lineCount = value.split("\n").length; // lineCount是编辑器中代码的行数
          let codeToSend = lineCount > 30 ? value.split("\n").slice(Math.max(0, lineCount - 30), lineCount).join("\n") : value;
          fetchLLMCompletion(codeToSend);
          const tmpProvider = {
            provideInlineCompletions: async (model: any, position: { lineNumber: number; column: number; }, context: any, token: any) => {
              return {
                items: [
                  {
                    range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                    insertText: answer, // 使用 answer 作为插入文本
                    command: {
                      id: 'typeSuggestion',
                      title: '插入建议'
                    }
                  }
                ]
              };
            },
            freeInlineCompletions: (completions: any) => {}
          };
          monaco.languages.registerInlineCompletionsProvider(`${languageId}`, tmpProvider);
        }, 1000); // 1000ms 的延迟
      })

      editor.onDidChangeCursorPosition((e) => {
        setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
        const selection = editor.getSelection();
        if (selection) {
          const text = editor.getModel()?.getValueInRange(selection);
          setSelectedText(text || null); // 更新选中的文本
        } else {
          setSelectedText(null); // 如果没有选中任何文本，则设为 null
        }
        // answer = "";
      });

    },
    [setSelectedText, llmResponse],
  );

  const handleEditorChange = (value: string | undefined) => {
    if (selectedPath && value) modifyFileContent(selectedPath, value);
  };

  // 调用 LLM API 获取代码建议
  const fetchLLMCompletion = async (code: string) => {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer sk-dWL7LdfzdRukoOqaA95365B981Dd49628e79E82f6c1b9112");
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
      "messages": [
        {
          "role": "system",
          "content": "你是一个大语言模型机器人"
        },
        {
          "role": "user",
          "content": code + "请给出补全此代码的建议，按照源代码的格式（包括换行符、空格等）只返回所需补全的代码部分即可，不要返回代码语言类型标注(如```python...```)、编写原理、代码解释等等其他任何回答"
        }
      ],
      "stream": false,
      "model": "gpt-3.5-turbo",
      "temperature": 0.5,
      "presence_penalty": 0,
      "frequency_penalty": 0,
      "top_p": 1
    });

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow' as RequestRedirect
    };

    fetch("https://xiaoai.plus/v1/chat/completions", requestOptions)
      .then(response => response.json())
      .then(async data => {
        if (data.choices && data.choices.length > 0) {
          const content = data.choices[0].message.content; // 提取 content
          console.log("content is:\n", content);
          setLlmResponse(content); // 将 content 赋值给 llmResponse
          answer = content;
          return content;
        }
      })
      .catch(error => {
        console.log('error', error);
        return null;
      });
  }

  React.useEffect(() => {
    const handleSave = async (event: KeyboardEvent) => {
      if (selectedPath && event.metaKey && event.key === "s") {
        const content = saveNewFileContent(selectedPath);

        if (content) {
          try {
            const token = localStorage.getItem("token")?.toString();
            if (token) await OpenHands.saveFile(token, selectedPath, content);
          } catch (error) {
            // handle error
            console.log(`error`);
          }
        }
      }
    };

    document.addEventListener("keydown", handleSave);
    return () => {
      document.removeEventListener("keydown", handleSave);
    };
  }, [saveNewFileContent, selectedPath]);

  if (!selectedPath) {
    return (
      <div
        data-testid="code-editor-empty-message"
        className="flex flex-col items-center text-neutral-400"
      >
        <VscCode size={100} />
        {t(I18nKey.CODE_EDITOR$EMPTY_MESSAGE)}
      </div>
    );
  }

  return (
    <div className="flex grow flex-col h-full w-full">
      {/* 确保编辑器能够占据父容器的最大空间 */}
      <div className="flex-grow min-h-0">
        <Editor
          data-testid="code-editor"
          height="100%"
          path={selectedPath ?? undefined}
          defaultValue=""
          value={
            selectedPath
              ? modifiedFiles[selectedPath] || files[selectedPath]
              : undefined
          }
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          options={{ readOnly: isReadOnly }}
        />
      </div>
      {/* 光标位置信息 */}
      <div className="p-2 text-neutral-500 flex-shrink-0">
        Row: {cursorPosition.line}, Column: {cursorPosition.column}
      </div>
    </div>
  );
}

export default React.memo(CodeEditorCompoonent);
