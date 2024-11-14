export const getWorkspaces = async () => {
    try {
        const response = await fetch('http://localhost:3050/api/v1/workspaces', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer R09PRMB-MD54CT2-GNNC5J4-JH746X3'
            }
        });
        const data = await response.json();
        const workspaces = data.workspaces.map(workspace => workspace.name);
        return workspaces;
    } catch (error) {
        console.error('Error:', error);
    }
};

export const getFiles = async (slug) => {
    try {
        const response = await fetch('http://localhost:3050/api/v1/workspace/' + slug, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer R09PRMB-MD54CT2-GNNC5J4-JH746X3'
            }
        });
        const data = await response.json();
        const documents = data.workspace[0].documents;
        const files = documents.map(document => {
            const metadata = JSON.parse(document.metadata);
            return {
                docpath: document.docpath,
                id: metadata.id,         // 存储文档的 ID
                title: metadata.title,   // 存储文档的 title
                published: metadata.published, // 存储文档的 published
            };
        })
        return files;
    } catch (error) {
        console.error('Error:', error);
    }
};

export const getThreads = async (workspaceSlug) => {
    try {
        const response = await fetch('http://localhost:3050/api/v1/workspace/' + workspaceSlug, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer R09PRMB-MD54CT2-GNNC5J4-JH746X3'
            }
        });
        const data = await response.json();
        const threads = data.workspace[0].threads;
        const returnThreads = threads.map(thread => thread.slug)
        return returnThreads;
    } catch (error) {
        console.log('getThreads Error!');
        console.error('Error:', error);
    }
};

export const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file); // 确保 'file' 是文件的字段名称

    try {
        const response = await fetch('http://localhost:3050/api/v1/document/upload', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer R09PRMB-MD54CT2-GNNC5J4-JH746X3'
            },
            body: formData
        });

        const result = await response.json();
        console.log(result);

        const location = result.documents[0].location;
        try {
            const response2 = await fetch('http://localhost:3050/api/v1/workspace/codeassistant/update-embeddings', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Authorization': 'Bearer R09PRMB-MD54CT2-GNNC5J4-JH746X3',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "adds": [location]
                })
            })
            const result2 = await response2.json();
            console.log(result2);

        } catch (error) {
            console.error('Upload error:', error);
        }

    } catch (error) {
        console.error('Upload error:', error);
    }
}

export const RemoveDocument = async (docPath) => {
    try {
        const response = await fetch('http://localhost:3050/api/v1/system/remove-documents', {
            method: 'DELETE',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer R09PRMB-MD54CT2-GNNC5J4-JH746X3',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "names": [docPath]
            }) // 将对象转换为 JSON 字符串
        });

        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.error('Remove error:', error);
    }
};

export const chatWithWorkspaceThread = async (workspaceSlug, threadName, message, mode) => {
    try {
        const response = await fetch('http://localhost:3050/api/v1/workspace/' + workspaceSlug + '/thread/' + threadName + '/chat', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer R09PRMB-MD54CT2-GNNC5J4-JH746X3',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "message": message,
                "mode": mode
            })
        });

        const result = await response.json();
        console.log(result);

        const responseContent = result.textResponse;
        console.log(`botResponse is : ${responseContent}`);
        return responseContent;

    } catch (error) {
        console.error('Chat error:', error);
    }
};

export const addWorkspace = async (name) => {
    try {
        const response = await fetch('http://localhost:3050/api/v1/workspace/new', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer R09PRMB-MD54CT2-GNNC5J4-JH746X3',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "name": name
            })
        });

        const result = await response.json();
        console.log(result);

    } catch (error) {
        console.error('Add workspace error:', error);
    }
};

export const RemoveWorkspace = async (slug) => {
    try {
        const response = await fetch('http://localhost:3050/api/v1/workspace/' + slug, {
            method: 'DELETE',
            headers: {
                'accept': '*/*',
                'Authorization': 'Bearer R09PRMB-MD54CT2-GNNC5J4-JH746X3'
            }
        });
        const result = await response.json();
        console.log(result);
        if (response.ok) return true;
        else return false;
    } catch (error) {
        console.error('Add workspace error:', error);
    }
};

export const addThread = async (workspaceSlug, threadName) => {
    try {
        const response = await fetch('http://localhost:3050/api/v1/workspace/' + workspaceSlug + '/thread/new', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer R09PRMB-MD54CT2-GNNC5J4-JH746X3',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "name": threadName,
                "slug": threadName
            })
        });

        const result = await response.json();
        const thread = result.thread;
        const message = result.message;
        if (message) {
            console.log('重名');
            return false;
        }
        else return true;

    } catch (error) {
        console.error('Add workspace error:', error);
    }
};

export const RemoveThread = async (workspaceSlug, threadName) => {
    try {
        const response = await fetch('http://localhost:3050/api/v1/workspace/' + workspaceSlug + '/thread/' + threadName, {
            method: 'DELETE',
            headers: {
                'accept': '*/*',
                'Authorization': 'Bearer R09PRMB-MD54CT2-GNNC5J4-JH746X3'
            }
        });
        // const result = await response.json();
        if (response.status == 200) {
            console.log('删除成功！');
            return true;
        }
        else return false;
    } catch (error) {
        console.error('Add workspace error:', error);
    }
};

export const getThreadHistory = async (workspaceSlug, threadName) => {
    try {
        const response = await fetch('http://localhost:3050/api/v1/workspace/' + workspaceSlug + '/thread/' + threadName + '/chats', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer R09PRMB-MD54CT2-GNNC5J4-JH746X3'
            }
        });
        const result = await response.json();
        const history = result.history;
        const returnHistory = history.map(history=>history.content);
        return returnHistory;
    } catch (error) {
        console.error('getHistory error:', error);
    }
};
