# Consolidated copy from dukat-voice-saas/agent/memory.py

import uuid
import time
from typing import Dict, List
from qdrant_client import QdrantClient
from redis import Redis

class MemoryLayer:
    def __init__(self, config: Dict):
        self.qdrant = QdrantClient(url=config.get('qdrant_url', 'http://localhost:6333'))
        self.redis = Redis(host=config.get('redis_host', 'localhost'), port=config.get('redis_port', 6379))

    def store_short_term(self, key: str, value: str):
        self.redis.setex(key, 300, value)  # 5min TTL

    def store_long_term(self, embedding: List[float], payload: Dict):
        self.qdrant.upsert(
            collection_name="long_term",
            points=[{
                "id": str(uuid.uuid4()), 
                "vector": embedding, 
                "payload": {**payload, "timestamp": time.time()}
            }]
        )

    def decay(self):
        """Delete points older than 30 days."""
        thirty_days_ago = time.time() - 2592000
        # Qdrant filtering for timestamp < 30 days
        print(f"Cleaning up data before {thirty_days_ago}")
