import React from "react";
import { useSelector } from "react-redux";
import SyntaxHighlighter from "react-syntax-highlighter";
import Markdown from "react-markdown";
import { VscArrowDown } from "react-icons/vsc";
import { useTranslation } from "react-i18next";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { RootState } from "#/store";
import { Cell } from "#/state/jupyterSlice";
import { useScrollToBottom } from "#/hooks/useScrollToBottom";
import { I18nKey } from "#/i18n/declaration";
import FileChatModule from "./KnowledgeBase";

interface IJupyterCell {
  cell: Cell;
}

function JupyterCell({ cell }: IJupyterCell): JSX.Element {
  const code = cell.content;

  if (cell.type === "input") {
    return (
      <div className="rounded-lg bg-gray-800 dark:bg-gray-900 p-2 text-xs">
        <div className="mb-1 text-gray-400">EXECUTE</div>
        <pre
          className="scrollbar-custom scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-white/10 dark:hover:scrollbar-thumb-white/20 overflow-auto px-5"
          style={{ padding: 0, marginBottom: 0, fontSize: "0.75rem" }}
        >
          <SyntaxHighlighter language="python" style={atomOneDark}>
            {code}
          </SyntaxHighlighter>
        </pre>
      </div>
    );
  }

  // aggregate all the NON-image lines into a single plaintext.
  const lines: { type: "plaintext" | "image"; content: string }[] = [];
  let current = "";
  for (const line of code.split("\n")) {
    if (line.startsWith("![image](data:image/png;base64,")) {
      lines.push({ type: "plaintext", content: current });
      lines.push({ type: "image", content: line });
      current = "";
    } else {
      current += `${line}\n`;
    }
  }
  lines.push({ type: "plaintext", content: current });

  return (
    <div className="rounded-lg bg-gray-800 dark:bg-gray-900 p-2 text-xs">
      <div className="mb-1 text-gray-400">STDOUT/STDERR</div>
      <pre
        className="scrollbar-custom scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-white/10 dark:hover:scrollbar-thumb-white/20 overflow-auto px-5 max-h-[60vh] bg-gray-800"
        style={{ padding: 0, marginBottom: 0, fontSize: "0.75rem" }}
      >
        {/* display the lines as plaintext or image */}
        {lines.map((line, index) => {
          if (line.type === "image") {
            return (
              <div key={index}>
                <Markdown urlTransform={(value: string) => value}>
                  {line.content}
                </Markdown>
              </div>
            );
          }
          return (
            <div key={index}>
              <SyntaxHighlighter language="plaintext" style={atomOneDark}>
                {line.content}
              </SyntaxHighlighter>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

function JupyterEditor(): JSX.Element {
  const { t } = useTranslation();

  const { cells } = useSelector((state: RootState) => state.jupyter);
  const jupyterRef = React.useRef<HTMLDivElement>(null);

  const { hitBottom, scrollDomToBottom, onChatBodyScroll } =
    useScrollToBottom(jupyterRef);

  return (
    <div className="flex-1" style={{ height: '100%', width: '100%' }}>
      <FileChatModule/>
    </div>
  );
}

export default JupyterEditor;
