import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantService implements OnModuleInit {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_CLOUD_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  async onModuleInit() {
    try {
      const collection = process.env.QDRANT_COLLECTION || 'agri_knowledge_base';
      const info = await this.client.getCollection(collection);
      console.log(`✅ Qdrant: ${info.points_count} points`);
    } catch (error) {
      console.error('❌ Qdrant error:', error);
    }
  }

  async search(queryVector: number[], topK: number = 5) {
    const collection = process.env.QDRANT_COLLECTION || 'agri_knowledge_base';
    return await this.client.search(collection, {
      vector: queryVector,
      limit: topK,
      with_payload: true,
    });
  }
}