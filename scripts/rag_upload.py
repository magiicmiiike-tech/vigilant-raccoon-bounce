import asyncio
import os
import uuid
from qdrant_client import QdrantClient
from qdrant_client.http import models
import openai # Assuming OpenAI for embeddings

# Configuration
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = "dukat_knowledge"
openai.api_key = os.getenv("OPENAI_API_KEY")

client = QdrantClient(url=QDRANT_URL)

async def get_embedding(text: str) -> list:
    # Placeholder for OpenAI embedding call
    # response = openai.Embedding.create(input=text, model="text-embedding-ada-002")
    # return response['data'][0]['embedding']
    return [0.0] * 1536 # Dummy

async def upload_text(text: str, tenant_id: str, metadata: dict = None):
    """Chunk, embed and upload a piece of text"""
    # Simple chunking logic (for prototype)
    chunks = [text[i:i+1000] for i in range(0, len(text), 800)]
    
    points = []
    for chunk in chunks:
        vector = await get_embedding(chunk)
        payload = {
            "text": chunk,
            "tenant_id": tenant_id,
            **(metadata or {})
        }
        points.append(models.PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload=payload
        ))
    
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )
    print(f"Uploaded {len(points)} chunks for tenant {tenant_id}")

if __name__ == "__main__":
    # Example usage
    sample_text = "Dukat Voice AI is a multi-tenant platform..."
    asyncio.run(upload_text(sample_text, "test-tenant-01"))
