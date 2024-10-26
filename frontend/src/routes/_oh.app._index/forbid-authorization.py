from fastapi import FastAPI

app = FastAPI()


@app.post('/api/open-vscode')
async def open_vscode():
    # 暂时移除验证逻辑
    return {'message': 'VSCode opened'}
