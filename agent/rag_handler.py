import logging
import os
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http import models

logger = logging.getLogger("rag-handler")

class RAGHandler:
    def __init__(self):
        self.qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.client = QdrantClient(url=self.qdrant_url)
        self.collection_name = "dukat_knowledge"
        self._ensure_collection()

    def _ensure_collection(self):
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE),
                )
                logger.info(f"Created collection: {self.collection_name}")
        except Exception as e:
            logger.error(f"Failed to ensure Qdrant collection: {e}")

    async def search(self, query_vector: List[float], tenant_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Perform semantic search filtered by tenant_id"""
        try:
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                query_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="tenant_id",
                            match=models.MatchValue(value=tenant_id),
                        )
                    ]
                ),
                limit=limit,
            )
            return [hit.payload for hit in results]
        except Exception as e:
            logger.error(f"RAG search failed: {e}")
            return []

    async def add_documents(self, documents: List[Dict[str, Any]]):
        """Add documents to the vector store"""
        # This would handle embedding generation and uploading to Qdrant
        pass
