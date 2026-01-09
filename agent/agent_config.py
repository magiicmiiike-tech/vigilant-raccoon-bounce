# Agent Configuration
import os

class AgentConfig:
    def __init__(self):
        self.livekit_url = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
        self.stt_provider = os.getenv("STT_PROVIDER", "deepgram")
        self.llm_provider = os.getenv("LLM_PROVIDER", "openai")
        self.tts_provider = os.getenv("TTS_PROVIDER", "elevenlabs")
        self.sample_rate = 48000
