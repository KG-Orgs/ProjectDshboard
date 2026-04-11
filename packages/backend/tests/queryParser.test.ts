/**
 * Tests for 6.1 Query Processing & Parsing Service
 */

import { QueryParser } from '../src/services/queryParser';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('QueryParser', () => {
  let parser: QueryParser;

  beforeEach(() => {
    parser = new QueryParser(false); // Disable Haiku fallback for faster tests
  });

  describe('parseQuery - Regex Extraction', () => {
    it('should extract spec section from query', async () => {
      const query = 'What does spec section 23 05 00 say about insulation?';
      const result = await parser.parseQuery(query);

      expect(result.specSection).toBe('23 05 00');
      expect(result.confidence).toBeGreaterThan(0.4);
    });

    it('should normalize spec section formats', async () => {
      const queries = [
        'Check spec 23-05-00',
        'See spec 23.05.00',
        'Look at 23_05_00',
      ];

      for (const query of queries) {
        const result = await parser.parseQuery(query);
        expect(result.specSection).toBe('23 05 00');
      }
    });

    it('should extract construction topics', async () => {
      const query =
        'What are the requirements for roofing and waterproofing materials?';
      const result = await parser.parseQuery(query);

      expect(result.topics).toContain('roofing');
      expect(result.topics).toContain('waterproofing');
    });

    it('should extract keywords from query', async () => {
      const query =
        'What materials are needed for concrete foundations and structural steel?';
      const result = await parser.parseQuery(query);

      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.keywords).toContain('materials');
      expect(result.keywords).toContain('needed');
    });

    it('should calculate confidence score', async () => {
      const simpleQuery = 'Find 23 05 00';
      const complexQuery =
        'What are the requirements for roofing insulation in spec 07 21 00?';

      const simpleResult = await parser.parseQuery(simpleQuery);
      const complexResult = await parser.parseQuery(complexQuery);

      expect(simpleResult.confidence).toBeGreaterThan(0);
      expect(complexResult.confidence).toBeGreaterThanOrEqual(simpleResult.confidence);
    });
  });

  describe('validateSpecSection', () => {
    it('should validate and normalize spec sections', () => {
      expect(QueryParser.validateSpecSection('23-05-00')).toBe('23 05 00');
      expect(QueryParser.validateSpecSection('23 05 00')).toBe('23 05 00');
      expect(QueryParser.validateSpecSection('23.05.00')).toBe('23 05 00');
      expect(QueryParser.validateSpecSection('230500')).toBe('23 05 00');
    });

    it('should return null for invalid spec sections', () => {
      expect(QueryParser.validateSpecSection('invalid')).toBeNull();
      expect(QueryParser.validateSpecSection('12-34')).toBeNull();
      expect(QueryParser.validateSpecSection('AB-CD-EF')).toBeNull();
    });
  });

  describe('parseQueryWithContext', () => {
    it('should generate QueryContext with full metadata', async () => {
      const query = 'What are the fire-rated insulation requirements in spec 07 21 00?';
      const context = await parser.parseQueryWithContext(
        query,
        'user-123',
        'proj-456',
        'session-789'
      );

      expect(context.parsedQuery).toBeDefined();
      expect(context.parsingMethod).toBeDefined();
      expect(context.parsingDuration).toBeGreaterThanOrEqual(0);
      expect(context.timestamp).toBeDefined();
      expect(context.userId).toBe('user-123');
      expect(context.projectId).toBe('proj-456');
      expect(context.sessionId).toBe('session-789');
    });

    it('should extract multiple spec sections', async () => {
      const query =
        'Compare spec 23 05 00 HVAC requirements with spec 26 05 00 electrical requirements';
      const context = await parser.parseQueryWithContext(query);

      expect(context.multiSpecSections).toBeDefined();
      expect(Array.isArray(context.multiSpecSections)).toBe(true);
      if (context.multiSpecSections) {
        expect(context.multiSpecSections.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should map spec sections to CSI categories', async () => {
      const query = 'What does spec 23 05 00 say about requirements?';
      const context = await parser.parseQueryWithContext(query);

      expect(context.specSectionCategories).toBeDefined();
      if (context.specSectionCategories && context.specSectionCategories['23 05 00']) {
        expect(context.specSectionCategories['23 05 00']).toContain('HVAC');
      }
    });

    it('should classify query intent correctly', async () => {
      const searchQuery = 'Find insulation requirements';
      const compareQuery = 'Compare materials in 23 05 00 vs 07 21 00';
      const calcQuery = 'How many R-value is required?';
      const explainQuery = 'Explain what fire-rated means';

      const searchCtx = await parser.parseQueryWithContext(searchQuery);
      const compareCtx = await parser.parseQueryWithContext(compareQuery);
      const calcCtx = await parser.parseQueryWithContext(calcQuery);
      const explainCtx = await parser.parseQueryWithContext(explainQuery);

      expect(searchCtx.intent).toBe('search');
      expect(compareCtx.intent).toBe('comparison');
      expect(calcCtx.intent).toBe('calculation');
      expect(explainCtx.intent).toBe('explanation');
    });

    it('should classify query type correctly', async () => {
      const numericalQuery = 'What is the required R-value of 25 mm insulation?';
      const categoricalQuery = 'What type of materials are used?';
      const structuralQuery = 'Find specifications for structural components';

      const numericalCtx =
        await parser.parseQueryWithContext(numericalQuery);
      const categoricalCtx =
        await parser.parseQueryWithContext(categoricalQuery);
      const structuralCtx =
        await parser.parseQueryWithContext(structuralQuery);

      expect(numericalCtx.queryType).toBe('numerical');
      expect(categoricalCtx.queryType).toBe('categorical');
      expect(structuralCtx.queryType).toBe('structural');
    });

    it('should extract entities (materials, systems, properties)', async () => {
      const query =
        'What fire-rated concrete materials are used in the structural system?';
      const context = await parser.parseQueryWithContext(query);

      expect(context.entities).toBeDefined();
      expect(context.entities.materials).toContain('concrete');
      expect(context.entities.systems).toContain('structural');
      expect(context.entities.properties).toContain('fire-rated');
    });

    it('should extract numeric values with units', async () => {
      const query = 'What is the R-value of 50mm insulation at 25 psi?';
      const context = await parser.parseQueryWithContext(query);

      expect(context.entities.values).toBeDefined();
      if (context.entities.values) {
        expect(
          context.entities.values.some(v => v.includes('50') && v.includes('mm'))
        ).toBe(true);
        expect(
          context.entities.values.some(v => v.includes('25') && v.includes('psi'))
        ).toBe(true);
      }
    });

    it('should set search filters based on parsed data', async () => {
      const query = 'Find specifications for 23 05 00 in project ABC';
      const context = await parser.parseQueryWithContext(
        query,
        undefined,
        'proj-ABC'
      );

      expect(context.searchFilters).toBeDefined();
      expect(context.searchFilters.specSection).toBe('23 05 00');
      expect(context.searchFilters.projectId).toBe('proj-ABC');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty queries', async () => {
      const result = await parser.parseQuery('');
      expect(result).toBeDefined();
      expect(result.rawQuery).toBe('');
    });

    it('should handle queries without spec sections', async () => {
      const query = 'Tell me about general construction requirements';
      const result = await parser.parseQuery(query);

      expect(result.specSection).toBeUndefined();
      expect(result.topics.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle special characters in query', async () => {
      const query = 'What about spec 23-05-00 & fire-rated (!) materials?';
      const result = await parser.parseQuery(query);

      expect(result.specSection).toBe('23 05 00');
      expect(result.topics).toContain('fire-rated');
    });

    it('should deduplicate keywords and topics', async () => {
      const query =
        'insulation insulation concrete concrete concrete steel requirements';
      const result = await parser.parseQuery(query);

      const topicCounts = result.topics.filter(t => t === 'insulation').length;
      expect(topicCounts).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance', () => {
    it('should parse queries quickly with regex', async () => {
      const query = 'Find spec 23 05 00 insulation requirements';
      const startTime = Date.now();
      await parser.parseQuery(query);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should be < 100ms for regex
    });

    it('should include parsing duration in context', async () => {
      const query = 'What materials are needed for 26 05 00';
      const context = await parser.parseQueryWithContext(query);

      expect(context.parsingDuration).toBeGreaterThanOrEqual(0);
      expect(context.parsingDuration).toBeLessThan(500);
    });
  });
});
