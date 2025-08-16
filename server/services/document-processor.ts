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