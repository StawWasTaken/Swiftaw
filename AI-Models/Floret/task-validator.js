/**
 * FLORET Task Validator — Quality Assurance & Correctness Engine
 *
 * Ensures all generated tasks and code meet corporate standards
 * Validates requirements, implementations, and outputs before delivery
 *
 * Validation Framework:
 * 1. Requirements validation
 * 2. Implementation validation
 * 3. Output validation
 * 4. Security validation
 * 5. Performance validation
 * 6. Documentation validation
 */

class FloretTaskValidator {
  constructor() {
    this.validationRules = new Map();
    this.validationLog = [];
    this.securityPatterns = this.initSecurityPatterns();
    this.performanceThresholds = this.initPerformanceThresholds();
  }

  // ══════════════════════════════════════════════════════════════
  // REQUIREMENTS VALIDATION
  // ══════════════════════════════════════════════════════════════

  validateRequirements(requirements) {
    const validation = {
      valid: true,
      issues: [],
      warnings: [],
      suggestions: [],
      completenessScore: 0
    };

    // Check primary goal is clear
    if (!requirements.primaryGoal || requirements.primaryGoal.length < 10) {
      validation.issues.push('Primary goal is unclear or too vague');
      validation.valid = false;
    }

    // Check acceptance criteria
    if (!requirements.acceptanceCriteria || requirements.acceptanceCriteria.length === 0) {
      validation.warnings.push('No acceptance criteria defined');
    }

    // Check constraints are documented
    if (requirements.constraints.length === 0) {
      validation.suggestions.push('Consider documenting constraints');
    }

    // Check for security requirements
    if (!this.hasSecurityRequirements(requirements)) {
      validation.suggestions.push('Consider adding security requirements');
    }

    // Check for performance requirements
    if (!this.hasPerformanceRequirements(requirements)) {
      validation.suggestions.push('Consider defining performance targets');
    }

    // Calculate completeness
    const completedAspects = [
      requirements.primaryGoal ? 1 : 0,
      requirements.acceptanceCriteria?.length > 0 ? 1 : 0,
      requirements.constraints?.length > 0 ? 1 : 0,
      requirements.inputs?.length > 0 ? 1 : 0,
      requirements.outputs?.length > 0 ? 1 : 0,
      requirements.risksAndAssumptions?.length > 0 ? 1 : 0,
      requirements.technicalStack?.length > 0 ? 1 : 0
    ];

    validation.completenessScore = (completedAspects.reduce((a, b) => a + b, 0) / completedAspects.length * 100).toFixed(0);

    return validation;
  }

  hasSecurityRequirements(requirements) {
    const requirementsText = JSON.stringify(requirements).toLowerCase();
    return /security|auth|encrypt|permission|safe|protected|credential/.test(requirementsText);
  }

  hasPerformanceRequirements(requirements) {
    const requirementsText = JSON.stringify(requirements).toLowerCase();
    return /performance|fast|optimize|latency|throughput|concurrent|parallel/.test(requirementsText);
  }

  // ══════════════════════════════════════════════════════════════
  // CODE VALIDATION
  // ══════════════════════════════════════════════════════════════

  validateCode(code, language) {
    const validation = {
      language,
      syntaxValid: true,
      securityIssues: [],
      performanceIssues: [],
      styleIssues: [],
      bestPracticeViolations: [],
      readabilityScore: 100,
      qualityScore: 100
    };

    // Syntax validation
    const syntaxCheck = this.checkSyntax(code, language);
    if (!syntaxCheck.valid) {
      validation.syntaxValid = false;
      validation.syntaxErrors = syntaxCheck.errors;
    }

    // Security validation
    validation.securityIssues = this.validateSecurity(code, language);

    // Performance validation
    validation.performanceIssues = this.validatePerformance(code, language);

    // Style validation
    validation.styleIssues = this.validateStyle(code, language);

    // Best practices
    validation.bestPracticeViolations = this.validateBestPractices(code, language);

    // Calculate scores
    validation.readabilityScore = this.calculateReadabilityScore(code);
    validation.qualityScore = this.calculateQualityScore(validation);

    return validation;
  }

  checkSyntax(code, language) {
    // This would use language-specific syntax checkers
    // For now, basic checks
    const lang = language.toLowerCase();
    const errors = [];

    if (lang === 'python') {
      if (code.includes('import') && !code.includes('from')) {
        // Basic check
      }
    } else if (lang === 'javascript' || lang === 'typescript') {
      // Check for balanced braces
      const braceCount = (code.match(/{/g) || []).length;
      const closeBraceCount = (code.match(/}/g) || []).length;
      if (braceCount !== closeBraceCount) {
        errors.push('Unbalanced braces in code');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateSecurity(code, language) {
    const issues = [];
    const patterns = this.securityPatterns[language.toLowerCase()] || [];

    patterns.forEach(pattern => {
      if (pattern.regex.test(code)) {
        issues.push({
          severity: pattern.severity,
          issue: pattern.issue,
          recommendation: pattern.recommendation
        });
      }
    });

    return issues;
  }

  validatePerformance(code, language) {
    const issues = [];

    // Check for obvious performance anti-patterns
    if (/for\s*\(.*for\s*\(/.test(code)) {
      issues.push({
        severity: 'warning',
        issue: 'Nested loops detected - potential O(n²) complexity',
        recommendation: 'Consider optimizing with better algorithms or data structures'
      });
    }

    if (/while\s*\(\s*true\s*\)/.test(code)) {
      issues.push({
        severity: 'warning',
        issue: 'Infinite loop detected',
        recommendation: 'Ensure proper exit conditions'
      });
    }

    if (/sleep|wait|delay/.test(code.toLowerCase())) {
      issues.push({
        severity: 'info',
        issue: 'Blocking wait detected',
        recommendation: 'Consider async/await or non-blocking alternatives'
      });
    }

    return issues;
  }

  validateStyle(code, language) {
    const issues = [];
    const lines = code.split('\n');

    lines.forEach((line, idx) => {
      // Check line length
      if (line.length > 120) {
        issues.push({
          line: idx + 1,
          issue: 'Line too long (> 120 chars)',
          length: line.length
        });
      }

      // Check for TODO comments
      if (/TODO|FIXME|XXX|HACK/.test(line)) {
        issues.push({
          line: idx + 1,
          issue: 'Development marker found: ' + line.trim().substring(0, 40)
        });
      }
    });

    return issues;
  }

  validateBestPractices(code, language) {
    const violations = [];
    const lower = code.toLowerCase();

    // Generic best practices
    if (!lower.includes('error') && !lower.includes('except') && !lower.includes('try')) {
      violations.push('No error handling detected');
    }

    if (!lower.includes('log') && !lower.includes('debug')) {
      violations.push('No logging detected');
    }

    if (!/documentation|\/\/|"""|\*\*\/|<!-- comment -->/i.test(code)) {
      violations.push('Insufficient code documentation');
    }

    // Language-specific practices
    if (language.toLowerCase() === 'python') {
      if (!code.includes('if __name__')) {
        violations.push('Missing if __name__ == "__main__" guard');
      }
    }

    return violations;
  }

  calculateReadabilityScore(code) {
    let score = 100;

    // Reduce score based on various factors
    if (code.length > 1000) score -= 10;
    if (code.includes('').length > 5) score -= 5; // Too many empty lines
    if (!/\n/.test(code.substring(0, 100))) score -= 10; // First 100 chars with no newline

    return Math.max(0, score);
  }

  calculateQualityScore(validation) {
    let score = 100;

    if (!validation.syntaxValid) score -= 40;
    score -= Math.min(30, validation.securityIssues.length * 5);
    score -= Math.min(15, validation.performanceIssues.length * 3);
    score -= Math.min(10, validation.styleIssues.length);
    score -= Math.min(5, validation.bestPracticeViolations.length);

    return Math.max(0, score);
  }

  initSecurityPatterns() {
    return {
      'javascript': [
        {
          regex: /eval\s*\(/,
          severity: 'critical',
          issue: 'eval() detected - major security risk',
          recommendation: 'Use JSON.parse or other safe alternatives'
        },
        {
          regex: /innerHTML\s*=/,
          severity: 'critical',
          issue: 'innerHTML assignment - XSS vulnerability risk',
          recommendation: 'Use textContent or createElement for DOM updates'
        },
        {
          regex: /\$\{.*\}/.test && /SQL|query/i,
          severity: 'critical',
          issue: 'Potential SQL injection with template literals',
          recommendation: 'Use prepared statements or parameterized queries'
        }
      ],
      'python': [
        {
          regex: /exec\s*\(/,
          severity: 'critical',
          issue: 'exec() detected - major security risk',
          recommendation: 'Use safe alternatives or restrict input'
        },
        {
          regex: /pickle\.load/,
          severity: 'critical',
          issue: 'pickle.load() can execute arbitrary code',
          recommendation: 'Use json for untrusted data or validate pickle data'
        },
        {
          regex: /os\.system|subprocess\.call/,
          severity: 'high',
          issue: 'Shell command execution detected',
          recommendation: 'Use subprocess.run with shell=False'
        }
      ],
      'sql': [
        {
          regex: /UNION.*SELECT|SELECT.*UNION/i,
          severity: 'high',
          issue: 'Potential SQL injection vulnerability',
          recommendation: 'Use parameterized queries'
        },
        {
          regex: /DROP\s+TABLE|DELETE\s+FROM.*WHERE\s+1\s*=\s*1/i,
          severity: 'critical',
          issue: 'Dangerous query detected - could delete all data',
          recommendation: 'Add WHERE conditions and confirm deletions'
        }
      ]
    };
  }

  initPerformanceThresholds() {
    return {
      maxFunctionLength: 50, // lines
      maxCyclomaticComplexity: 10,
      maxNestingDepth: 4,
      minCodeCommentRatio: 0.1, // 10% comments
      maxLineLength: 120
    };
  }

  // ══════════════════════════════════════════════════════════════
  // OUTPUT VALIDATION
  // ══════════════════════════════════════════════════════════════

  validateOutput(output, expectedType) {
    const validation = {
      typeMatches: false,
      hasContent: false,
      isFormattedCorrectly: false,
      completeness: 0
    };

    if (expectedType === 'code') {
      validation.typeMatches = output && typeof output === 'string' && output.length > 10;
      validation.hasContent = output.length > 50;
      validation.isFormattedCorrectly = /function|class|def|interface|type/.test(output);
    } else if (expectedType === 'documentation') {
      validation.typeMatches = output && typeof output === 'string' && output.length > 20;
      validation.hasContent = output.split('\n').length > 5;
      validation.isFormattedCorrectly = /##|###|```|example|note|warning/i.test(output);
    } else if (expectedType === 'report') {
      validation.typeMatches = typeof output === 'object' || (typeof output === 'string' && output.length > 50);
      validation.hasContent = true;
    }

    validation.completeness = validation.typeMatches && validation.hasContent ? 100 : 50;

    return validation;
  }

  // ══════════════════════════════════════════════════════════════
  // COMPREHENSIVE VALIDATION
  // ══════════════════════════════════════════════════════════════

  validateTask(task) {
    const results = {
      taskId: task.id || 'unknown',
      timestamp: new Date().toISOString(),
      overallValid: true,
      sections: {}
    };

    // Validate requirements if present
    if (task.requirements) {
      results.sections.requirements = this.validateRequirements(task.requirements);
      if (!results.sections.requirements.valid) {
        results.overallValid = false;
      }
    }

    // Validate code if present
    if (task.code) {
      results.sections.code = this.validateCode(task.code, task.language);
      if (!results.sections.code.syntaxValid) {
        results.overallValid = false;
      }
    }

    // Validate output if present
    if (task.output) {
      results.sections.output = this.validateOutput(task.output, task.outputType);
      if (results.sections.output.completeness < 80) {
        results.overallValid = false;
      }
    }

    // Log validation
    this.logValidation(results);

    return results;
  }

  logValidation(results) {
    this.validationLog.unshift(results);
    if (this.validationLog.length > 100) {
      this.validationLog.pop();
    }
  }

  /**
   * Get validation statistics
   */
  getStats() {
    const successful = this.validationLog.filter(v => v.overallValid).length;
    return {
      totalValidations: this.validationLog.length,
      successfulValidations: successful,
      successRate: this.validationLog.length > 0 ? (successful / this.validationLog.length * 100).toFixed(1) + '%' : 'N/A',
      recentValidations: this.validationLog.slice(0, 5)
    };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FloretTaskValidator;
}

// Export to global scope for browser
if (typeof window !== 'undefined') {
  window.FloretTaskValidator = FloretTaskValidator;
}
