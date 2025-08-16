import { supabase } from '../../lib/supabase';
import OpenAI from 'openai';
import type { Document, DocumentInsert, Chunk, ChunkInsert, Node, NodeInsert } from '../../shared/schema';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export class DocumentProcessor {
  async processDocument(file: Express.Multer.File, userId: string) {
    const fileType = this.getFileType(file.originalname);
    
    // Validate file type
    if (!['pdf', 'txt', 'docx'].includes(fileType)) {
      throw new Error('Unsupported file type. Only PDF, TXT, and DOCX files are allowed.');
    }

    // Extract text content
    let textContent: string;
    let metadata: any = { fileName: file.originalname, fileSize: file.size };

    try {
      switch (fileType) {
        case 'pdf':
          try {
            const pdfData = await pdfParse(file.buffer);
            textContent = pdfData.text;
            metadata.pageCount = pdfData.numpages;
            
            // Enforce PDF page limit
            if (pdfData.numpages > 10) {
              throw new Error('PDF files must be 10 pages or less.');
            }
          } catch (pdfError) {
            console.error('PDF parsing error:', pdfError);
            throw new Error('Failed to process PDF file. Please ensure it is not encrypted or corrupted.');
          }
          break;
          
        case 'docx':
          const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
          textContent = docxResult.value;
          break;
          
        case 'txt':
          textContent = file.buffer.toString('utf-8');
          break;
          
        default:
          throw new Error('Unsupported file type');
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error('Failed to process document. Please ensure the file is not corrupted.');
    }

    // Validate content length
    if (textContent.length > 50000) { // ~5000 words
      throw new Error('Document content is too long. Please limit to approximately 5,000 words.');
    }

    // Simple English validation
    if (textContent.length > 100) {
      const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      const foundEnglishWords = englishWords.filter(word => 
        textContent.toLowerCase().includes(` ${word} `) || 
        textContent.toLowerCase().startsWith(`${word} `) ||
        textContent.toLowerCase().endsWith(` ${word}`)
      );
      
      if (foundEnglishWords.length < 3) {
        throw new Error('Only English documents are supported. Please upload an English document.');
      }
    }

    // Content moderation
    try {
      const moderationResponse = await openai.moderations.create({
        input: textContent.substring(0, 4000) // OpenAI moderation limit
      });

      if (moderationResponse.results[0].flagged) {
        throw new Error('Document content violates our content policy.');
      }
    } catch (error) {
      console.warn('Content moderation failed:', error);
      // Continue processing - don't block on moderation failures
    }

    // Create document record
    const documentData = {
      user_id: userId,
      title: file.originalname.replace(/\.[^/.]+$/, ""), // Remove file extension
      type: fileType as 'pdf' | 'txt' | 'docx',
      content: { originalText: textContent },
      metadata,
      status: 'processing' as const
    };

    const { data: document, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to save document to database.');
    }

    // Process document asynchronously
    this.processDocumentAsync(document.id, textContent);

    return { documentId: document.id, document };
  }

  private async processDocumentAsync(documentId: string, textContent: string) {
    try {
      // Import here to avoid circular dependencies
      const { mindMapGenerator } = await import('./mindmap-generator');
      const { quizGenerator } = await import('./quiz-generator');
      
      // Step 1: Generate mind map structure
      const mindMapResult = await mindMapGenerator.generateMindMap(documentId, textContent);
      
      // Step 2: Generate quiz questions
      await quizGenerator.generateQuiz(documentId, mindMapResult.nodes);
      
      // Step 3: Mark document as completed
      await supabase
        .from('documents')
        .update({ status: 'completed' })
        .eq('id', documentId);

    } catch (error) {
      console.error('Error processing document:', error);
      
      // Mark document as failed
      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', documentId);
    }
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'txt':
        return 'txt';
      case 'docx':
        return 'docx';
      default:
        return 'unknown';
    }
  }
}

export const documentProcessor = new DocumentProcessor();
          input: chunk.content,
          dimensions: 1536
        });

        const embedding = embeddingResponse.data[0].embedding;

        // Update chunk with embedding
        await supabase
          .from('chunks')
          .update({ embedding })
          .eq('id', chunk.id);

      } catch (error) {
        console.error('Error generating embedding for chunk:', chunk.id, error);
        // Continue with other chunks
      }
    }
  }

  private async generateMindMap(documentId: string, chunks: Chunk[]) {
    // Use OpenAI to identify main topics and create hierarchical structure
    const chunkTexts = chunks.map(c => c.content).join('\n\n');
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a mind mapping expert. Analyze the given text and create a hierarchical mind map structure with exactly 3 levels:
            - Level 0: 1-3 main topics (root nodes)
            - Level 1: 2-5 concepts per topic (branches)
            - Level 2: 2-4 specific facts/examples per concept (leaves)
            
            Maximum 100 total nodes. Return JSON in this format:
            {
              "nodes": [
                {
                  "title": "Node title",
                  "summary": "Brief summary",
                  "level": 0,
                  "parent_id": null,
                  "evidence": "Supporting text from document"
                }
              ]
            }`
          },
          {
            role: 'user',
            content: chunkTexts
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const mindMapData = JSON.parse(response.choices[0].message.content || '{"nodes": []}');
      
      // Create nodes with proper positioning
      const nodesToInsert: NodeInsert[] = [];
      let nodeCounter = 0;

      for (const nodeData of mindMapData.nodes) {
        if (nodeCounter >= 100) break; // Enforce node limit

        const position = this.calculateNodePosition(nodeData.level, nodeCounter);
        
        nodesToInsert.push({
          document_id: documentId,
          title: nodeData.title,
          summary: nodeData.summary,
          level: nodeData.level,
          position_x: position.x,
          position_y: position.y,
          parent_id: nodeData.parent_id,
          metadata: { evidence: nodeData.evidence }
        });

        nodeCounter++;
      }

      // Insert nodes
      const { error } = await supabase
        .from('nodes')
        .insert(nodesToInsert);

      if (error) {
        throw new Error('Failed to create mind map nodes');
      }

    } catch (error) {
      console.error('Error generating mind map:', error);
      
      // Create a simple fallback structure
      await this.createFallbackMindMap(documentId, chunks);
    }
  }

  private calculateNodePosition(level: number, index: number): { x: number; y: number } {
    const centerX = 500;
    const centerY = 400;
    
    switch (level) {
      case 0: // Topic - center
        return { x: centerX, y: centerY };
      case 1: // Concept - orbit around center
        const angle1 = (index * 2 * Math.PI) / 8;
        return {
          x: centerX + Math.cos(angle1) * 200,
          y: centerY + Math.sin(angle1) * 200
        };
      case 2: // Leaf - further out
        const angle2 = (index * 2 * Math.PI) / 16;
        return {
          x: centerX + Math.cos(angle2) * 350,
          y: centerY + Math.sin(angle2) * 350
        };
      default:
        return { x: centerX, y: centerY };
    }
  }

  private async createFallbackMindMap(documentId: string, chunks: Chunk[]) {
    // Simple fallback: create one topic node with chunk summaries as concepts
    const topicNode: NodeInsert = {
      document_id: documentId,
      title: 'Document Overview',
      summary: 'Main topics from the document',
      level: 0,
      position_x: 500,
      position_y: 400,
      metadata: { fallback: true }
    };

    const { data: topic, error: topicError } = await supabase
      .from('nodes')
      .insert(topicNode)
      .select()
      .single();

    if (topicError) return;

    // Create concept nodes from chunks
    const conceptNodes: NodeInsert[] = chunks.slice(0, 8).map((chunk, index) => ({
      document_id: documentId,
      title: chunk.content.substring(0, 50) + '...',
      summary: chunk.content.substring(0, 200),
      level: 1,
      position_x: 500 + Math.cos((index * 2 * Math.PI) / 8) * 200,
      position_y: 400 + Math.sin((index * 2 * Math.PI) / 8) * 200,
      parent_id: topic.id,
      metadata: { chunk_id: chunk.id }
    }));

    await supabase
      .from('nodes')
      .insert(conceptNodes);
  }

  private getFileType(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }
}

export const documentProcessor = new DocumentProcessor();