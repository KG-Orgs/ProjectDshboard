/**
 * 6.1 Query Processing & Parsing Service
 * Extracts structured hints from user queries to enable better search
 * 
 * Features:
 * - Regex pattern matching for spec sections and topics
 * - Claude Haiku fallback for complex queries
 * - Multi-spec section detection
 * - Query intent and type classification
 * - Entity extraction (materials, systems, properties)
 * - QueryContext generation with full metadata
 */

import { ParsedQuery, QueryContext } from '../types/rag';
import Anthropic from '@anthropic-ai/sdk';

// CSI MasterFormat Division Mappings
const CSI_DIVISIONS: Record<string, string> = {
  '00': 'Procurement & Contracting Requirements',
  '01': 'General Requirements',
  '02': 'Existing Conditions',
  '03': 'Concrete',
  '04': 'Masonry',
  '05': 'Metals',
  '06': 'Wood, Plastics, & Composites',
  '07': 'Thermal & Moisture Protection',
  '08': 'Openings',
  '09': 'Finishes',
  '10': 'Specialties',
  '11': 'Equipment',
  '12': 'Furnishings',
  '13': 'Special Construction',
  '14': 'Conveying Equipment',
  '15': 'Reserved',
  '16': 'Reserved',
  '17': 'Reserved',
  '18': 'Reserved',
  '19': 'Reserved',
  '20': 'Reserved',
  '21': 'Fire Suppression',
  '22': 'Plumbing',
  '23': 'Heating, Ventilating, & Air Conditioning',
  '24': 'Reserved',
  '25': 'Integrated Automation',
  '26': 'Electrical',
  '27': 'Communications',
  '28': 'Electronic Safety & Security',
  '29': 'Reserved',
  '30': 'Exterior Improvements',
  '31': 'Earthwork',
  '32': 'External Improvements',
  '33': 'Utilities',
  '34': 'Transportation',
  '35': 'Waterway & Marine Construction',
  '40': 'Process Integration',
  '41': 'Material Processing & Handling',
  '42': 'Process Heating & Cooling',
  '43': 'Process Gas & Liquid Handling',
  '44': 'Pollution Control Equipment',
  '45': 'Industry-Specific Manufacturing Equipment',
  '48': 'Electrical Power Generation',
  '49': 'Testing & Inert Gas Handling Equipment',
};

export class QueryParser {
  private anthropic: Anthropic;
  private enableHaikuFallback: boolean;

  constructor(enableHaikuFallback: boolean = true) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.enableHaikuFallback = enableHaikuFallback;
  }

  /**
   * Parse user query to extract structured hints
   * @param query User's natural language query
   * @returns ParsedQuery with extracted metadata
   */
  async parseQuery(query: string): Promise<ParsedQuery> {
    // First, try regex patterns for common formats
    const regexResult = this.parseWithRegex(query);
    if (regexResult.confidence > 0.7) {
      return regexResult;
    }

    // If regex confidence is low and fallback is enabled, use Claude Haiku
    if (this.enableHaikuFallback) {
      return this.parseWithHaiku(query);
    }

    return regexResult;
  }

  /**
   * Parse query and generate a comprehensive QueryContext
   * @param query User's natural language query
   * @param userId Optional user ID
   * @param projectId Optional project ID
   * @param sessionId Optional session ID
   * @returns QueryContext with full metadata and search hints
   */
  async parseQueryWithContext(
    query: string,
    userId?: string,
    projectId?: string,
    sessionId?: string
  ): Promise<QueryContext> {
    const startTime = Date.now();
    
    // Parse the base query
    const parsedQuery = await this.parseQuery(query);
    const parsingDuration = Date.now() - startTime;
    
    // Extract advanced information
    const multiSpecSections = this.extractMultipleSpecSections(query);
    const specCategories = this.mapSpecToCategories(multiSpecSections);
    const intent = this.classifyQueryIntent(query);
    const queryType = this.classifyQueryType(query);
    const entities = this.extractEntities(query);
    
    // Determine which parsing method was used
    const parsingMethod = this.determinePrimaryParsingMethod(
      parsedQuery,
      multiSpecSections
    );
    
    // Build context object
    const context: QueryContext = {
      parsedQuery,
      parsingMethod,
      parsingDuration,
      multiSpecSections: multiSpecSections.length > 0 ? multiSpecSections : undefined,
      specSectionCategories: Object.keys(specCategories).length > 0 ? specCategories : undefined,
      intent,
      queryType,
      searchFilters: {
        projectId,
        specSection: parsedQuery.specSection,
        categories: [...new Set(Object.values(specCategories))],
      },
      entities,
      timestamp: new Date().toISOString(),
      userId,
      projectId,
      sessionId,
    };
    
    return context;
  }

  /**
   * Parse query using regex patterns
   * Looks for common architectural specifications format (XX XX XX)
   */
  private parseWithRegex(query: string): ParsedQuery {
    const parsed: ParsedQuery = {
      rawQuery: query,
      topics: [],
      keywords: [],
      confidence: 0,
    };

    // Pattern 1: Spec section format (XX XX XX or XX-XX-XX or XX.XX.XX)
    // CSI MasterFormat uses 3 digit groups separated by space, dash, or period
    const specMatch = query.match(
      /\b(\d{2}[\s\-_.]?\d{2}[\s\-_.]?\d{2})\b/g
    );
    if (specMatch) {
      // Normalize format to spaces (XX XX XX)
      parsed.specSection = specMatch[0]
        .replace(/[\s\-_.]/g, ' ')
        .trim();
      parsed.confidence += 0.4;
    }

    // Pattern 2: Extract common construction topics
    const topicKeywords = [
      'insulation',
      'roofing',
      'concrete',
      'steel',
      'windows',
      'doors',
      'hvac',
      'plumbing',
      'electrical',
      'masonry',
      'flooring',
      'drywall',
      'paint',
      'ceiling',
      'foundation',
      'framing',
      'membrane',
      'sealant',
      'caulk',
      'waterproofing',
      'fire-rated',
      'acoustical',
      'sheathing',
    ];

    const foundTopics = topicKeywords.filter((topic) =>
      query.toLowerCase().includes(topic)
    );

    parsed.topics = foundTopics;
    if (foundTopics.length > 0) {
      parsed.confidence += 0.3;
    }

    // Pattern 3: Extract keywords (2+ character words, exclude common words)
    const stopWords = new Set([
      'the',
      'and',
      'or',
      'a',
      'an',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'is',
      'what',
      'does',
      'say',
      'about',
      'tell',
      'show',
      'requirements',
      'requirements',
      'specification',
      'spec',
    ]);

    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (word) =>
          word.length >= 3 &&
          !stopWords.has(word) &&
          !/^\d+$/.test(word) // exclude pure numbers
      );

    parsed.keywords = [...new Set(words)].slice(0, 5); // Top 5 unique keywords
    if (parsed.keywords.length > 0) {
      parsed.confidence += 0.2;
    }

    // Cap confidence at 1.0
    parsed.confidence = Math.min(parsed.confidence, 1.0);

    return parsed;
  }

  /**
   * Parse query using Claude Haiku for better extraction
   * More accurate but slower than regex
   */
  private async parseWithHaiku(query: string): Promise<ParsedQuery> {
    try {
      const prompt = `Extract structured information from this construction/architectural query:

Query: "${query}"

Return a JSON object with:
{
  "specSection": "XX XX XX format if detected, or null",
  "topics": ["list", "of", "construction", "topics"],
  "keywords": ["key", "words"],
  "confidence": 0.0-1.0
}

Rules:
- specSection: CSI MasterFormat codes are 3 groups of 2 digits (e.g., "23 05 00")
- topics: construction-related topics like "insulation", "roofing", "concrete", etc.
- keywords: important terms from the query
- confidence: how confident you are in the extraction (0-1)

Return ONLY valid JSON, no markdown or explanation.`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // Extract JSON from response
      const jsonText = content.text.trim();

      let extracted;
      try {
        extracted = JSON.parse(jsonText);
      } catch {
        // Try to extract JSON if wrapped in markdown
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Could not parse JSON');
        }
        extracted = JSON.parse(jsonMatch[0]);
      }

      return {
        rawQuery: query,
        specSection: extracted.specSection || undefined,
        topics: extracted.topics || [],
        keywords: extracted.keywords || [],
        confidence: extracted.confidence || 0.5,
      };
    } catch (error) {
      console.error('Haiku parsing failed, falling back to regex:', error);
      // Fall back to regex result
      return this.parseWithRegex(query);
    }
  }

  /**
   * Validate and normalize a spec section code
   * @param specCode Raw spec code (e.g., "23-05-00")
   * @returns Normalized code (e.g., "23 05 00") or null if invalid
   */
  static validateSpecSection(specCode: string): string | null {
    // Remove any separators and normalize
    const normalized = specCode
      .replace(/[\s\-_.]/g, '')
      .trim();

    // Should be 6 digits exactly
    if (!/^\d{6}$/.test(normalized)) {
      return null;
    }

    // Format as XX XX XX
    return `${normalized.slice(0, 2)} ${normalized.slice(2, 4)} ${normalized.slice(4)}`;
  }

  /**
   * Extract multiple spec sections from a query
   * @param query User's natural language query
   * @returns Array of normalized spec sections
   */
  private extractMultipleSpecSections(query: string): string[] {
    const regex = /\b(\d{2}[\s\-_.]?\d{2}[\s\-_.]?\d{2})\b/g;
    const matches = query.match(regex) || [];
    
    const normalized = matches
      .map(match => 
        match.replace(/[\s\-_.]/g, ' ').trim()
      )
      .filter((spec, index, self) => self.indexOf(spec) === index); // Unique only
    
    return normalized;
  }

  /**
   * Map spec sections to their CSI categories
   * @param specSections Array of spec sections
   * @returns Object mapping spec to category
   */
  private mapSpecToCategories(specSections: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    for (const spec of specSections) {
      const division = spec.slice(0, 2);
      const category = CSI_DIVISIONS[division];
      if (category) {
        mapping[spec] = category;
      }
    }
    
    return mapping;
  }

  /**
   * Classify the intent of the query
   * @param query User's natural language query
   * @returns Query intent type
   */
  private classifyQueryIntent(query: string): QueryContext['intent'] {
    const lowerQuery = query.toLowerCase();
    
    if (
      lowerQuery.includes('compare') ||
      lowerQuery.includes('difference') ||
      lowerQuery.includes('versus') ||
      lowerQuery.includes('vs ')
    ) {
      return 'comparison';
    }
    
    if (
      lowerQuery.includes('calculate') ||
      lowerQuery.includes('how many') ||
      lowerQuery.includes('quantity') ||
      lowerQuery.includes('size') ||
      lowerQuery.includes('dimensions')
    ) {
      return 'calculation';
    }
    
    if (
      lowerQuery.includes('explain') ||
      lowerQuery.includes('what is') ||
      lowerQuery.includes('describe') ||
      lowerQuery.includes('tell me')
    ) {
      return 'explanation';
    }
    
    return 'search';
  }

  /**
   * Classify the type of query based on structure
   * @param query User's natural language query
   * @returns Query type classification
   */
  private classifyQueryType(query: string): QueryContext['queryType'] {
    const lowerQuery = query.toLowerCase();
    
    // Check for numerical queries
    if (/\d+[\s-]*(mm|cm|m|inches|feet|lbs|kg|r-value|rating)/.test(query)) {
      return 'numerical';
    }
    
    // Check for structural/categorical queries
    if (
      lowerQuery.includes('type') ||
      lowerQuery.includes('material') ||
      lowerQuery.includes('system') ||
      lowerQuery.includes('category')
    ) {
      return 'categorical';
    }
    
    return 'structural';
  }

  /**
   * Extract entities (materials, systems, properties) from query
   * @param query User's natural language query
   * @returns Extracted entities by type
   */
  private extractEntities(query: string): QueryContext['entities'] {
    const materials = this.extractMaterials(query);
    const systems = this.extractSystems(query);
    const properties = this.extractProperties(query);
    const values = this.extractValues(query);
    
    return {
      materials: materials.length > 0 ? materials : undefined,
      systems: systems.length > 0 ? systems : undefined,
      properties: properties.length > 0 ? properties : undefined,
      values: values.length > 0 ? values : undefined,
    };
  }

  /**
   * Extract material entities
   */
  private extractMaterials(query: string): string[] {
    const materials = [
      'concrete', 'steel', 'glass', 'wood', 'aluminum', 'copper', 'brick',
      'stone', 'marble', 'granite', 'tile', 'ceramic', 'vinyl', 'linoleum',
      'carpet', 'asphalt', 'rubber', 'plastic', 'composite', 'fiber',
      'insulation', 'drywall', 'gypsum', 'plaster', 'mortar', 'cement',
      'paint', 'coating', 'sealant', 'caulk', 'membrane', 'sheathing'
    ];
    
    const found: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const material of materials) {
      if (lowerQuery.includes(material)) {
        found.push(material);
      }
    }
    
    return found;
  }

  /**
   * Extract system entities
   */
  private extractSystems(query: string): string[] {
    const systems = [
      'hvac', 'electrical', 'plumbing', 'structural', 'drainage', 'ventilation',
      'fire suppression', 'sprinkler', 'lighting', 'security', 'automation',
      'foundation', 'framing', 'roof', 'wall', 'floor', 'ceiling',
      'waterproofing', 'heating', 'cooling', 'air conditioning'
    ];
    
    const found: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const system of systems) {
      if (lowerQuery.includes(system)) {
        found.push(system);
      }
    }
    
    return found;
  }

  /**
   * Extract property entities (fire-rated, load-bearing, etc.)
   */
  private extractProperties(query: string): string[] {
    const properties = [
      'fire-rated', 'waterproof', 'insulated', 'load-bearing', 'structural',
      'thermal', 'acoustic', 'moisture-resistant', 'durable', 'sealed',
      'pressure-treated', 'certified', 'rated', 'approved'
    ];
    
    const found: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const property of properties) {
      if (lowerQuery.includes(property)) {
        found.push(property);
      }
    }
    
    return found;
  }

  /**
   * Extract numeric values and units
   */
  private extractValues(query: string): string[] {
    const valueRegex = /(\d+(?:\.\d+)?)\s*(mm|cm|m|in|ft|lbs|kg|psi|r-value|uvalue)/gi;
    const matches = query.match(valueRegex) || [];
    return [...new Set(matches)];
  }

  /**
   * Determine which parsing method was primarily used
   */
  private determinePrimaryParsingMethod(
    parsed: ParsedQuery,
    multiSpecs: string[]
  ): 'regex' | 'haiku' | 'hybrid' {
    // If we found multiple specs or complex extraction, likely used Haiku
    if (multiSpecs.length > 1 || parsed.confidence > 0.8) {
      return 'haiku';
    }
    
    // If we only found simple patterns, regex
    if (parsed.confidence > 0.4 && multiSpecs.length <= 1) {
      return 'regex';
    }
    
    // Otherwise hybrid approach
    return 'hybrid';
  }
}
