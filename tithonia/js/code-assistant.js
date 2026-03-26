/**
 * Code Assistant — Code Generation, Analysis, & Preview for Tithonia
 * Handles code prompts, preview, and interaction
 */

export class CodeAssistant {
  constructor() {
    this.codeBlocks = [];
  }

  /**
   * Generate code generation prompt
   */
  getGenerateCodePrompt(description, language = 'javascript') {
    return `Generate ${language} code to: ${description}\n\nProvide clean, well-commented code.`;
  }

  /**
   * Generate code explanation prompt
   */
  getExplainCodePrompt(code) {
    return `Explain this code step-by-step in simple terms:\n\n\`\`\`\n${code}\n\`\`\``;
  }

  /**
   * Generate debugging/fix prompt
   */
  getDebugCodePrompt(code, error = '') {
    return `Debug this code${error ? ' (Error: ' + error + ')' : ''}:\n\n\`\`\`\n${code}\n\`\`\`\n\nExplain the issue and provide a fixed version.`;
  }

  /**
   * Generate code optimization prompt
   */
  getOptimizeCodePrompt(code) {
    return `Optimize this code for performance and readability:\n\n\`\`\`\n${code}\n\`\`\`\n\nExplain improvements.`;
  }

  /**
   * Detect code language from content
   */
  detectLanguage(code) {
    const languagePatterns = {
      javascript: /const\s+|let\s+|var\s+|=>|function\s+/,
      typescript: /:\s*(string|number|boolean|any|void|interface|type)\b/,
      python: /^(import|from|def|class|for\s+.*\sin\s|if\s+__name__)/m,
      html: /<(html|head|body|div|p|script)/i,
      css: /^\s*[.#\w]+\s*{|@media|@keyframes/m,
      react: /import\s+React|jsx|<[A-Z][\w]*>|useState|useEffect/,
      java: /class\s+\w+|public\s+static|System\.out/,
      cpp: /#include|std::|cout\s*<<|int\s+main/,
      php: /<\?php|\$\w+|function\s+/,
      sql: /SELECT|INSERT|UPDATE|DELETE|FROM|WHERE/i
    };

    let detectedLang = 'text';
    let maxMatches = 0;

    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      const matches = (code.match(pattern) || []).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedLang = lang;
      }
    }

    return detectedLang;
  }

  /**
   * Check if code can be previewed
   */
  canPreview(language) {
    return ['html', 'javascript', 'react', 'css'].includes(language);
  }

  /**
   * Create preview HTML for code
   */
  createPreview(code, language) {
    if (language === 'html') {
      // Directly use HTML
      return code;
    } else if (language === 'javascript' || language === 'react') {
      // Wrap in HTML for preview
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, sans-serif; background: #fff; color: #000; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script>${code}</script>
        </body>
        </html>`;
    } else if (language === 'css') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${code}
          </style>
        </head>
        <body>
          <div class="container">
            <h1>CSS Preview</h1>
            <p>Your CSS is applied to this page.</p>
          </div>
        </body>
        </html>`;
    }

    return null;
  }

  /**
   * Create a code block element with viewer and preview
   */
  createCodeBlockElement(code, language = 'text') {
    const language_display = this.detectLanguage(code);
    const canPreview = this.canPreview(language_display);

    const container = document.createElement('div');
    container.className = 'code-block';
    container.dataset.language = language_display;

    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.innerHTML = `
      <span class="code-lang">${language_display}</span>
      <div class="code-block-actions">
        <button class="code-action code-view" title="View code" style="display: none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          View
        </button>
        ${canPreview ? `
          <button class="code-action code-preview" title="Preview result">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="3 12 9 19 20 5"/>
            </svg>
            Preview
          </button>
        ` : ''}
        <button class="code-action code-copy" title="Copy code">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
          Copy
        </button>
      </div>
    `;

    const codeContent = document.createElement('div');
    codeContent.className = 'code-content';
    codeContent.innerHTML = `<pre><code class="language-${language_display}">${this.escapeHtml(code)}</code></pre>`;

    const previewContent = document.createElement('div');
    previewContent.className = 'code-preview-content';
    previewContent.style.display = 'none';
    if (canPreview) {
      const preview = this.createPreview(code, language_display);
      if (preview) {
        const iframe = document.createElement('iframe');
        iframe.className = 'code-preview-iframe';
        iframe.sandbox.add('allow-scripts', 'allow-same-origin');
        previewContent.appendChild(iframe);
        // Set iframe content after brief delay to ensure proper sandbox
        setTimeout(() => {
          iframe.contentDocument.open();
          iframe.contentDocument.write(preview);
          iframe.contentDocument.close();
        }, 0);
      }
    }

    container.appendChild(header);
    container.appendChild(codeContent);
    if (canPreview) container.appendChild(previewContent);

    // Event handlers
    const viewBtn = header.querySelector('.code-view');
    const previewBtn = header.querySelector('.code-preview');
    const copyBtn = header.querySelector('.code-copy');

    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        const isPreview = previewContent.style.display !== 'none';
        previewContent.style.display = isPreview ? 'none' : 'block';
        codeContent.style.display = isPreview ? 'block' : 'none';
        previewBtn.classList.toggle('active');
        if (viewBtn) viewBtn.style.display = isPreview ? 'inline-flex' : 'none';
      });

      if (viewBtn) {
        viewBtn.addEventListener('click', () => {
          previewContent.style.display = 'none';
          codeContent.style.display = 'block';
          previewBtn.classList.remove('active');
          viewBtn.style.display = 'none';
        });
      }
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(code);
          copyBtn.classList.add('active');
          setTimeout(() => copyBtn.classList.remove('active'), 2000);
        } catch (err) {
          alert('Failed to copy: ' + err.message);
        }
      });
    }

    return container;
  }

  /**
   * Escape HTML for display
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
