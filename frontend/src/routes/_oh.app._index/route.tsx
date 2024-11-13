import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  ClientActionFunctionArgs,
  json,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import { RootState } from "#/store";
import AgentState from "#/types/AgentState";
import FileExplorer from "#/components/file-explorer/FileExplorer";
import OpenHands from "#/api/open-hands";
import { useSocket } from "#/context/socket";
import CodeEditorCompoonent from "./code-editor-component";
import { useFiles } from "#/context/files";
import { EditorActions } from "#/components/editor-actions";
// import ChatInput from "#/components/chat/ChatInput";

export const clientLoader = async () => {
  const token = localStorage.getItem("token");
  return json({ token });
};

export const clientAction = async ({ request }: ClientActionFunctionArgs) => {
  const token = localStorage.getItem("token");

  const formData = await request.formData();
  const file = formData.get("file")?.toString();

  let selectedFileContent: string | null = null;

  if (file && token) {
    selectedFileContent = await OpenHands.getFile(token, file);
  }

  return json({ file, selectedFileContent });
};

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="w-full h-full border border-danger rounded-b-xl flex flex-col items-center justify-center gap-2 bg-red-500/5">
      <h1 className="text-3xl font-bold">Oops! An error occurred!</h1>
      {error instanceof Error && <pre>{error.message}</pre>}
    </div>
  );
}

function CodeEditor() {
  const { token } = useLoaderData<typeof clientLoader>();
  const { runtimeActive } = useSocket();
  const {
    setPaths,
    selectedPath,
    modifiedFiles,
    saveFileContent: saveNewFileContent,
    discardChanges,
  } = useFiles();

  const agentState = useSelector(
    (state: RootState) => state.agent.curAgentState,
  );

  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [llmResponse, setLlmResponse] = useState<string | null>(null);

  React.useEffect(() => {
    if (runtimeActive && token) OpenHands.getFiles(token).then(setPaths);
  }, [runtimeActive, token]);

  const isEditingAllowed = React.useMemo(
    () =>
      agentState === AgentState.PAUSED ||
      agentState === AgentState.FINISHED ||
      agentState === AgentState.AWAITING_USER_INPUT,
    [agentState],
  );

  const handleSave = async () => {
    if (selectedPath) {
      const content = saveNewFileContent(selectedPath);

      if (content && token) {
        try {
          await OpenHands.saveFile(token, selectedPath, content);
        } catch (error) {
          // handle error
        }
      }
    }
  };

  const handleDiscard = () => {
    if (selectedPath) discardChanges(selectedPath);
  };

  const handleOpenVSCode = async () => {
    try {
      const token = localStorage.getItem("token"); // 获取存储的令牌
      const response = await fetch("http://localhost:3005/api/open-vscode", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`, // 添加Authorization头
        },
      });
      if (response.ok) {
        console.log("VSCode opened successfully");
      } else {
        console.error("Failed to open VSCode");
      }
    } catch (error) {
      console.error("Error opening VSCode:", error);
    }
  };

  const [showComboBox, setShowComboBox] = useState(false);

  const handleSelectText = () => {
    if (selectedText) {
      setShowComboBox(true);
    }
  };

  const handleExplain = () => {
    if (selectedText) {
      const message = `${selectedText}\n请为此代码生成注释,只返回生成注释后的代码即可，不要返回任何其它值`;
      try {
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
              "content": message + "只返回代码即可，不要返回其他任何值"
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
          .then(data => {
            if (data.choices && data.choices.length > 0) {
              const content = data.choices[0].message.content; // 提取 content
              setLlmResponse(content); // 将 content 赋值给 llmResponse
              console.log("LLM返回内容是：", content); // 打印返回的内容
            }
          })
          .catch(error => console.log('error', error));

      } catch (error) {
        console.error("Error sending message to LLM:", error);
      }
    }
  }

  const handleOptionClick = async (option: string) => {
    console.log(`Selected option: ${option}`);
    console.log(`selectedText is: ${selectedText}`);
    if (selectedText) {
      const message = `${selectedText}\n请将此代码转换为 ${option}代码`;
      try {
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
              "content": message + "只返回代码即可，不要返回其他任何值"
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
          .then(data => {
            if (data.choices && data.choices.length > 0) {
              const content = data.choices[0].message.content; // 提取 content
              setLlmResponse(content); // 将 content 赋值给 llmResponse
              console.log("LLM返回内容是：", content); // 打印返回的内容
            }
          })
          .catch(error => console.log('error', error));

      } catch (error) {
        console.error("Error sending message to LLM:", error);
      }
    }
    setShowComboBox(false);
  };

  // 监测 selectedText 的变化，自动关闭 ComboBox
  useEffect(() => {
    if (!selectedText) {
      setShowComboBox(false);
      setLlmResponse(null);
    }
  }, [selectedText]);

  return (
    <div className="flex h-full w-full bg-neutral-900 relative">
      <FileExplorer />
      <div className="flex flex-col min-h-0 w-full">
        {selectedPath && (
          <div className="flex w-full items-center justify-between self-end p-2">
            <span className="text-sm text-neutral-500">{selectedPath}</span>
            <EditorActions
              onSave={handleSave}
              onDiscard={handleDiscard}
              onOpenVSCode={handleOpenVSCode}
              onSelectText={handleSelectText}
              onExplain={handleExplain}
              isDisabled={!isEditingAllowed || !modifiedFiles[selectedPath]}
              selectedText={selectedText}
            />
          </div>
        )}
        <div className="flex grow items-center justify-center">
          <CodeEditorCompoonent isReadOnly={!isEditingAllowed} setSelectedText={setSelectedText} />
        </div>
      </div>

      {/* ComboBox 位置移到这里 */}
      {showComboBox && (
        <div className="absolute bottom-4 right-4 z-10 bg-gray border rounded shadow-lg mt-1">
          {["Python", "C++", "Java", "C"].map((option) => (
            <div
              key={option}
              className="p-2 hover:bg-gray-300 hover:text-black cursor-pointer"
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}

      {llmResponse&& (
        <div className="absolute bottom-4 right-4 z-10 bg-gray border rounded shadow-lg flex flex-col max-w-xs max-h-80 overflow-auto">
          <div className="flex justify-between items-center p-2">
            <h3 className="font-bold text-sm">结果</h3>
            <button
              className="text-blue-500 hover:text-red-700 text-lg"
              onClick={() => setLlmResponse(null)}
            >
              &times;
            </button>
          </div>
          <p style={{ whiteSpace: 'pre-wrap', padding: '0.5rem' }}>{llmResponse}</p>
        </div>
      )}
    </div>
  );
}

export default CodeEditor;
