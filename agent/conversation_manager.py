class ConversationManager:
    def __init__(self):
        self.conversations = {}

    def get_history(self, session_id: str):
        return self.conversations.get(session_id, [])

    def add_message(self, session_id: str, role: str, content: str):
        if session_id not in self.conversations:
            self.conversations[session_id] = []
        self.conversations[session_id].append({"role": role, "content": content})
