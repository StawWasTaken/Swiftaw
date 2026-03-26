/**
 * Document Analyzer — Text & File Analysis Tools for Tithonia
 * Handles PDF, text, and file content analysis
 */

export class DocumentAnalyzer {
  constructor() {
    this.currentDocument = null;
  }

  /**
   * Extract text from various file types
   */
  async extractText(file) {
    const { name, type } = file;

    if (type === 'text/plain') {
      return await this.extractFromText(file);
    } else if (type === 'application/pdf') {
      return await this.extractFromPDF(file);
    } else if (type.startsWith('image/')) {
      return await this.extractFromImage(file);
    } else if (type === 'application/json') {
      return await this.extractFromJSON(file);
    }

    return null;
  }

  /**
   * Extract text from .txt files
   */
  async extractFromText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Extract text from PDF files (if PDF.js is available)
   */
  async extractFromPDF(file) {
    if (typeof pdfjsLib === 'undefined') {
      return '[PDF file - enable PDF.js library to extract text]';
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const pdf = await pdfjsLib.getDocument(e.target.result).promise;
          let text = '';
          for (let i = 0; i < pdf.numPages; i++) {
            const page = await pdf.getPage(i + 1);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            text += `\n--- Page ${i + 1} ---\n${pageText}`;
          }
          resolve(text);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract text from images (requires Tesseract.js or similar)
   */
  async extractFromImage(file) {
    // For now, return placeholder
    // In production, integrate with Tesseract.js or Cloud Vision API
    return '[Image file - text extraction not yet implemented. Use vision model instead.]';
  }

  /**
   * Extract and format JSON
   */
  async extractFromJSON(file) {
    const text = await this.extractFromText(file);
    try {
      const json = JSON.parse(text);
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return text;
    }
  }

  /**
   * Summarize text (sends to AI)
   */
  getSummarizePrompt(text, length = 'medium') {
    const lengthMap = {
      short: '2-3 sentences',
      medium: '1 paragraph',
      long: '3-5 paragraphs'
    };

    return `Summarize the following text in ${lengthMap[length] || lengthMap.medium}. Be concise and focus on key points:\n\n${text}`;
  }

  /**
   * Extract key points (sends to AI)
   */
  getKeyPointsPrompt(text) {
    return `Extract the 5-10 most important key points from this text in a bulleted list:\n\n${text}`;
  }

  /**
   * Analyze content (sends to AI)
   */
  getAnalysisPrompt(text, focusArea = 'general') {
    const focusMap = {
      general: 'overall content, main topics, and themes',
      sentiment: 'emotional tone, sentiment, and perspective',
      structure: 'organization, flow, and logical structure',
      technical: 'technical terms, concepts, and complexity',
      audience: 'intended audience and communication style'
    };

    return `Analyze the following text focusing on ${focusMap[focusArea] || focusMap.general}. Provide detailed insights:\n\n${text}`;
  }

  /**
   * Extract metadata from text
   */
  extractMetadata(text) {
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;
    const paragraphs = text.split(/\n\n+/).length;
    const lines = text.split('\n').length;
    const avgWordsPerLine = Math.round(wordCount / lines);

    // Simple sentiment hint (very basic)
    const positiveWords = text.match(/good|great|excellent|amazing|wonderful|fantastic/gi)?.length || 0;
    const negativeWords = text.match(/bad|terrible|awful|horrible|poor|hate/gi)?.length || 0;
    const sentiment = positiveWords > negativeWords ? 'positive' : negativeWords > positiveWords ? 'negative' : 'neutral';

    return {
      wordCount,
      charCount,
      paragraphs,
      lines,
      avgWordsPerLine,
      sentiment,
      readingTime: Math.ceil(wordCount / 200) // Assuming 200 words per minute
    };
  }
}
