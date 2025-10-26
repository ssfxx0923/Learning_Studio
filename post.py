import requests
import json
import uuid

# === 配置区 ===
WEBHOOK_URL = "http://a.ssfxx.cloud:5678/webhook/plan/analyze"  # 你的 n8n webhook URL
METHOD = "POST"  # 可改成 "GET" 如果你的 webhook 只支持 GET

def send_message_to_n8n(message: str):
    """向 n8n webhook 发送用户消息"""
    headers = {"Content-Type": "application/json"}
    # 生成16位请求ID
    request_id = uuid.uuid4().hex[:16]
    payload = {
        "message": message,
        "request_id": request_id
    }

    if METHOD.upper() == "POST":
        response = requests.post(WEBHOOK_URL, headers=headers, data=json.dumps(payload))
    else:
        response = requests.get(WEBHOOK_URL, params=payload)

    # 打印结果
    print(f"请求ID: {request_id}")
    print(f"状态码: {response.status_code}")
    print(f"返回内容: {response.text}")

if __name__ == "__main__":
    # 从用户输入读取消息
    user_input = "whisper, lantern, horizon ,puzzle ,crystal ,meadow ,orbit ,thunder ,fabric ,mirror ,canyon ,melody ,anchor ,prism ,ember ,voyage ,frost ,compass ,shadow ,ripple"
    send_message_to_n8n(user_input)
