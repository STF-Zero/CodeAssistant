import React, { useState, useEffect } from 'react';
import { getWorkspaces, getFiles, uploadDocument, RemoveDocument, chatWithWorkspaceThread, addWorkspace, RemoveWorkspace, getThreads, addThread, RemoveThread, getThreadHistory } from './KnowledgeBaseAPI'

// 文件列表项接口
interface FileItem {
    docpath: string;
    id: string;
    title: string;
    published: string;
}

// 主组件
const FileChatModule: React.FC = () => {
    // 文件列表和聊天记录状态
    const [files, setFiles] = useState<FileItem[]>([]);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ text: string; sender: 'user' | 'bot' }[]>([]);
    const [workspaces, setWorkspaces] = useState<string[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState(''); // 当前选择的 workspace
    const [threads, setThreads] = useState<string[]>([]);
    const [selectedThread, setSelectedThread] = useState(''); // 当前选择的 Thread

    const [isChecked, setIsChecked] = useState(false); // 是否启用联网模式

    // 获取文件列表
    useEffect(() => {
        fetchWorkspace();
        fetchFiles(selectedWorkspace.toLocaleLowerCase());
    }, []);

    // 当工作区改变时，将聊天设置为“请选择聊天”
    useEffect(() => {
        // 清空聊天记录
        fetchFiles(selectedWorkspace.toLocaleLowerCase());
        fetchWorkspaceThread(selectedWorkspace.toLocaleLowerCase());
        setSelectedThread('');
    }, [selectedWorkspace]);

    // 若所选聊天改变，则调用api获取聊天记录，加载在聊天区中
    useEffect(() => {
        handleGetHistory();
    }, [selectedThread]);

    const fetchWorkspace = async () => {
        const fetchedWorkspaces = await getWorkspaces();
        if (fetchedWorkspaces) {
            setWorkspaces(fetchedWorkspaces);  // 更新工作区列表
        }
    }

    const fetchFiles = async (slug: string) => {
        const fetchedFiles = await getFiles(slug);
        if (fetchedFiles) {
            setFiles(fetchedFiles);  // 更新文件列表
        }
    };

    const fetchWorkspaceThread = async (workspaceSlug: string) => {
        const fetchedThreads = await getThreads(workspaceSlug);
        if (fetchedThreads) {
            setThreads(fetchedThreads);  // 更新聊天列表
        }
    };

    const handleWorkspaceSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        if (event.target.value !== "请选择工作区")
            setSelectedWorkspace(event.target.value);
    };

    const handleAddWorkspace = async () => {
        const newWorkspace = window.prompt("请输入新的工作区名称：");
        if (newWorkspace !== null && newWorkspace.trim() !== '') {
            // 可以将新的工作区添加到状态或数据库中
            addWorkspace(newWorkspace)
            console.log(newWorkspace);
            alert(`工作区 "${newWorkspace}" 已添加！`);
            fetchWorkspace();
        }
    }

    const handleDeleteWorkspace = async () => {
        const confirmed = window.confirm(`您确定要删除工作区 ${selectedWorkspace} 吗？`);
        if (confirmed) {
            RemoveWorkspace(selectedWorkspace.toLocaleLowerCase())
            alert('删除已完成！');
        }
        fetchWorkspace();
    }

    const handleThreadSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        if (event.target.value !== "请选择聊天")
            setSelectedThread(event.target.value);
    }

    const handleAddThread = async () => {
        console.log("添加新的Thread");
        const newThread = window.prompt("请输入新的聊天名称：");
        if (newThread !== null && newThread.trim() !== '') {
            // 可以将新的聊天添加到状态或数据库中
            const result = addThread(selectedWorkspace.toLocaleLowerCase(), newThread)
            if (await result) {
                alert(`聊天 "${newThread}" 已添加！`);
                fetchWorkspaceThread(selectedWorkspace.toLocaleLowerCase());
            } else {
                alert(`添加失败！聊天名称已存在！`);
            }

        }
    }

    const handleDeleteThread = async () => {
        const confirmed = window.confirm(`您确定要删除聊天 ${selectedThread} 吗？`);
        if (confirmed) {
            const result = RemoveThread(selectedWorkspace.toLocaleLowerCase(), selectedThread);
            if (await result) alert('删除已完成！');
            else alert('删除失败！');
        }
        setSelectedThread('');
        fetchWorkspaceThread(selectedWorkspace.toLocaleLowerCase());
    }

    const handleGetHistory = async () => {
        setChatHistory([]);
        const fetchedHistory = await getThreadHistory(selectedWorkspace.toLowerCase(), selectedThread);
        for(let i = 0; i < fetchedHistory.length; i++){
            const content = fetchedHistory[i];
            if(i%2 == 0){
                setChatHistory(prev => [...prev, { text: content, sender: 'user' }]);
            }
            else{
                setChatHistory(prev => [...prev, { text: content, sender: 'bot' }]);
            }
        }
    }

    const handleClearChatHistory = async () => {
        setChatHistory([]);
    }

    // 删除指定id的文件
    const removeFileByName = (docPath: string) => {
        // 二次确认弹窗
        const confirmed = window.confirm('您确定要删除这个文件吗？' + docPath);
        if (confirmed) {
            RemoveDocument(docPath);
            alert('删除已完成！请刷新列表查看！');
            // fetchFiles(selectedWorkspace.toLocaleLowerCase());
        }
    };

    // 处理文件上传
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            uploadDocument(file);
            alert('上传已完成！请刷新列表查看！');
            // fetchFiles(selectedWorkspace.toLocaleLowerCase());
        }
    };

    // 发送消息处理
    const handleSendMessage = async () => {
        if (message.trim()) {
            setChatHistory(prev => [...prev, { text: message, sender: 'user' }]);
            const request = message;
            setMessage('')
            const mode = isChecked ? "query" : "chat";
            const responseContent = await chatWithWorkspaceThread(selectedWorkspace.toLocaleLowerCase(), selectedThread, request, mode);

            if (responseContent) {
                setChatHistory(prev => [...prev, { text: responseContent, sender: 'bot' }]);
            } else {
                setChatHistory(prev => [...prev, { text: "哎呀，出错啦！", sender: 'bot' }]);
            }
        }
    };

    // 勾选框状态处理
    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsChecked(event.target.checked);
    };

    return (
        <div style={{ display: 'flex', height: '100%', width: '100%' }}>
            {/* 左侧文件列表 */}
            <div style={{ width: '30%', padding: '10px', borderRight: '1px solid #ccc', overflowY: 'auto', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <select
                        value={selectedWorkspace}
                        onChange={handleWorkspaceSelect}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                    >
                        <option>请选择工作区</option>
                        {workspaces.map((workspace, index) => (
                            <option key={index} value={workspace}>
                                {workspace}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', justifyContent: 'space-between' }}>
                    <button
                        style={{
                            padding: '10px 30px',
                            color: '#fff',
                            backgroundColor: '#808A87',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s, transform 0.2s',
                        }}
                        onClick={handleAddWorkspace}
                    >
                        添加
                    </button>
                    <button
                        style={{
                            padding: '10px 30px',
                            color: '#fff',
                            backgroundColor: '#808A87',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s, transform 0.2s',
                        }}
                        onClick={handleDeleteWorkspace}
                    >
                        删除
                    </button>
                    <button
                        style={{
                            padding: '10px 30px',
                            color: '#fff',
                            backgroundColor: '#808A87',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s, transform 0.2s',
                        }}
                        onClick={() => (async () => await fetchFiles(selectedWorkspace.toLocaleLowerCase()))()}
                    >
                        刷新
                    </button>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />

                <input type="file" style={{ borderWidth: '0.1px' }} onChange={handleFileUpload} />
                <ul style={{ marginTop: '10px' }}>
                    {files.map(file => (
                        <li key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderWidth: '0.1px', borderRadius: '5px', padding: '7px' }}>
                            <div style={{ width: '80%' }}>
                                <span>{file.title}</span><br />
                                <small style={{ color: '#888' }}>{file.published}</small>
                            </div>
                            <button
                                onClick={() => removeFileByName(file.docpath)}
                                style={{
                                    backgroundColor: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s, transform 0.1s',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                }}
                                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#c0392b'}
                                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#e74c3c'}
                            >
                                删除
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 右侧聊天界面 */}
            <div style={{ width: '70%', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <button
                        onClick={handleAddThread}
                        style={{
                            padding: '10px 15px',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            marginRight: '10px'  // 增加间距
                        }}>
                        新的聊天
                    </button>
                    <button
                        onClick={handleClearChatHistory}
                        style={{
                            padding: '10px 15px',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            marginRight: 'auto'  // 增加间距
                        }}>
                        清空聊天
                    </button>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '20px',
                        backgroundColor: '#f4f4f4',
                        fontSize: '16px',
                        cursor: 'pointer',
                        marginRight: 'auto',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        width: 'fit-content',
                        userSelect: 'none'  // 禁止文本选择
                    }}>
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={handleCheckboxChange}
                            style={{
                                width: '20px',
                                height: '20px',
                                marginRight: '8px',  // 为勾选框和文本之间添加间距
                                cursor: 'pointer',
                                accentColor: '#808A87', // 使勾选框更美观的颜色
                                transition: 'all 0.3s ease', // 增加过渡效果
                            }}
                        />
                        <span style={{
                            color: '#333',
                            fontWeight: '500', // 设置文本为中等粗体
                        }}>
                            知识库询问模式
                        </span>
                    </label>
                    <button
                        onClick={handleDeleteThread}
                        style={{
                            padding: '10px 15px',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            marginRight: 'auto'  // 增加间距
                        }}>
                        删除聊天
                    </button>
                    <select
                        value={selectedThread}
                        onChange={handleThreadSelect}
                        style={{
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                    >
                        <option>请选择聊天</option>
                        {threads.map((thread, index) => (
                            <option key={index} value={thread}>
                                {thread}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', border: '1px solid #ccc', padding: '10px' }}>
                    {chatHistory.map((chat, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                justifyContent: chat.sender === 'user' ? 'flex-end' : 'flex-start',
                                marginBottom: '8px'  // 每条消息之间的间距
                            }}
                        >
                            <p
                                style={{
                                    background: chat.sender === 'user' ? '#808A87' : '#e0e0e0',
                                    color: chat.sender === 'user' ? '#fff' : '#000',
                                    display: 'inline-block',
                                    padding: '10px 15px',  // 增加 padding 以改善视觉效果
                                    borderRadius: '10px',
                                    maxWidth: '70%',        // 限制消息宽度
                                    wordWrap: 'break-word'   // 允许长词换行
                                }}
                            >
                                {chat.text}
                            </p>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="输入消息……"
                        style={{ flex: 1, padding: '5px', borderWidth: '0.1px', borderRadius: '5px' }}
                    />
                    <button onClick={handleSendMessage} style={{ marginLeft: '10px', paddingInline: '8px', borderWidth: '0.1px', borderRadius: '5px' }}>发送</button>
                </div>
            </div>
        </div>
    );
};

export default FileChatModule;
