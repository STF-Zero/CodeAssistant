import express from "express";
import cors from "cors";
import path from "path";
import { exec } from "child_process";
const app = express();

app.use(cors());

app.get("/api/open-vscode", (req, res) => {

  const directoryToOpen = "../../../../workspace"; // 指定固定的目录
  // const directoryToOpen = path.resolve(__dirname, "../../../../workspace"); // 绝对路径
  // const directoryToOpen = "/home/stf-zero/CodeAssistant/workspace";
  console.log(`Opening VSCode in directory: ${directoryToOpen}`);

  // 使用 exec 打开 VSCode
  exec(`code ${directoryToOpen}`, (err) => {
    if (err) {
      console.error("Failed to open VSCode:", err);
      return res.status(500).send("Failed to open VSCode");
    }
    res.send("VSCode opened successfully");
  });
});

app.listen(3005, () => {
  console.log("Server is running on http://localhost:3005");
});
