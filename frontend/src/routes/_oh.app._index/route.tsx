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

  // const [message, setMessage] = useState(""); // 用于保存传递给ChatInput的消息

  React.useEffect(() => {
    // only retrieve files if connected to WS to prevent requesting before runtime is ready
    if (runtimeActive && token) OpenHands.getFiles(token).then(setPaths);
  }, [runtimeActive, token]);

  // Code editing is only allowed when the agent is paused, finished, or awaiting user input (server rules)
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

  // 发送消息的回调
  const handleSendMessage = (message: string) => {
    // 处理发送后的逻辑
    console.log(`Transform request already sent`)
  };

  const handleOptionClick = (option: string) => {
    console.log(`Selected option: ${option}`);
    console.log(`selectedText is: ${selectedText}`);
    // if(selectedText){
    //   const message = `${selectedText}\n请将此代码转换为 ${option}代码`;
    //   setMessage(message);
    // }
    setShowComboBox(false);
  };

  // 监测 selectedText 的变化，自动关闭 ComboBox
  useEffect(() => {
    if (!selectedText) {
      setShowComboBox(false);
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
    </div>
  );
}

export default CodeEditor;
