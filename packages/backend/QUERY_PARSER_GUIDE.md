# Feature 6.1: Query Processing & Parsing

## Overview

The enhanced Query Processing & Parsing service (6.1) provides comprehensive extraction of structured information from user queries to enable intelligent search, filtering, and result ranking in the Chat/RAG system.

## Key Features

### 1. **Regex-Based Pattern Matching**
- Fast, lightweight extraction of spec sections and construction topics
- Confidence scoring to determine parsing accuracy
- Multiple spec section detection

### 2. **Claude Haiku Fallback**
- When regex confidence is below 70%, falls back to Claude Haiku
- More accurate for complex, natural language queries
- Graceful degradation with timeout handling

### 3. **Advanced Entity Extraction**
- **Materials**: concrete, steel, wood, insulation, etc.
- **Systems**: HVAC, electrical, plumbing, structural, etc.
- **Properties**: fire-rated, waterproof, load-bearing, etc.
- **Numeric Values**: Extracts measurements with units (e.g., "25mm R-value")

### 4. **Query Intent Classification**
- `search`: General information retrieval
- `comparison`: Comparing specifications or materials
- `calculation`: Numerical or quantity queries
- `explanation`: Descriptive or definitional queries

### 5. **Query Type Classification**
- `numerical`: Queries with measurements or calculations
- `categorical`: Queries focused on categories or classifications  
- `structural`: Queries about construction components

### 6. **QueryContext Object**
Complete context object with:
- Parsed query data
- Multi-spec section mapping
- CSI MasterFormat category mapping
- Entity extraction results
- Search filter hints
- Parsing metadata (duration, method used)

## Usage Examples

### Basic Query Parsing

```typescript
import { QueryParser } from './services/queryParser';

const parser = new QueryParser();

// Simple regex-based parsing
const parsed = await parser.parseQuery(
  'What does spec section 23 05 00 say about insulation requirements?'
);

console.log(parsed);
// Output:
// {
//   rawQuery: 'What does spec section 23 05 00 say about insulation requirements?',
//   specSection: '23 05 00',
//   topics: ['insulation'],
//   keywords: ['requirements'],
//   confidence: 0.7
// }
```

### Enhanced QueryContext Parsing

```typescript
const context = await parser.parseQueryWithContext(
  'What are the fire-rated concrete requirements in 07 21 00 vs 03 30 00?',
  'user-123',      // userId
  'proj-456',      // projectId
  'session-789'    // sessionId
);

console.log(context);
// Output:
// {
//   parsedQuery: { ... },
//   parsingMethod: 'regex',
//   parsingDuration: 5,
//   multiSpecSections: ['07 21 00', '03 30 00'],
//   specSectionCategories: {
//     '07 21 00': 'Thermal & Moisture Protection',
//     '03 30 00': 'Concrete'
//   },
//   intent: 'comparison',
//   queryType: 'categorical',
//   searchFilters: {
//     projectId: 'proj-456',
//     categories: ['Thermal & Moisture Protection', 'Concrete']
//   },
//   entities: {
//     materials: ['concrete'],
//     properties: ['fire-rated'],
//     systems: undefined,
//     values: undefined
//   },
//   timestamp: '2024-04-11T...',
//   userId: 'user-123',
//   projectId: 'proj-456',
//   sessionId: 'session-789'
// }
```

### Integrating with RAG Pipeline

```typescript
import { ragOrchestrator } from './services/ragOrchestrator';
import { QueryParser } from './services/queryParser';

const parser = new QueryParser();

async function executeRAGWithParsing(userQuery: string, projectId: string) {
  // Parse query with full context
  const queryContext = await parser.parseQueryWithContext(
    userQuery,
    undefined,
    projectId
  );

  console.log(`Query Intent: ${queryContext.intent}`);
  console.log(`Parsing Method: ${queryContext.parsingMethod}`);
  console.log(`Spec Sections: ${queryContext.multiSpecSections?.join(', ')}`);
  
  // Execute RAG with parsed context for intelligent search
  const response = await ragOrchestrator.executeRAG(
    userQuery,
    projectId,
    [], // conversation history
    (event) => {
      // Handle streaming events
      console.log('RAG Event:', event.type);
    },
    queryContext // Pass context for smarter filtering/ranking
  );

  console.log('Response:', response.responseText);
  console.log('Sources:', response.citations);
  console.log('Cost: $' + response.tokenUsage.estimatedCost.toFixed(4));
}

executeRAGWithParsing(
  'What insulation types are approved in section 07 21 00?',
  'proj-dashboard-2024'
);
```

### Spec Section Validation

```typescript
// Normalize and validate spec sections
const spec1 = QueryParser.validateSpecSection('23-05-00');  // '23 05 00'
const spec2 = QueryParser.validateSpecSection('23.05.00');  // '23 05 00'
const spec3 = QueryParser.validateSpecSection('invalid');   // null

console.log(spec1, spec2, spec3);
```

## API Reference

### QueryParser Class

#### Constructor
```typescript
constructor(enableHaikuFallback: boolean = true)
```

#### Methods

##### `parseQuery(query: string): Promise<ParsedQuery>`
Parses a query using regex patterns with optional Haiku fallback.

**Parameters:**
- `query`: User's natural language query

**Returns:** `ParsedQuery` object with extracted metadata

**Example:**
```typescript
const result = await parser.parseQuery('Find 23 05 00');
```

##### `parseQueryWithContext(query: string, userId?: string, projectId?: string, sessionId?: string): Promise<QueryContext>`
Generates a comprehensive QueryContext with full metadata.

**Parameters:**
- `query`: User's natural language query
- `userId`: Optional user ID
- `projectId`: Optional project ID
- `sessionId`: Optional session ID

**Returns:** `QueryContext` object with full metadata

**Example:**
```typescript
const context = await parser.parseQueryWithContext(
  'Compare 23 05 00 with 26 05 00',
  'user-123',
  'proj-456',
  'session-789'
);
```

##### `validateSpecSection(specCode: string): string | null` (static)
Validates and normalizes a spec section code.

**Parameters:**
- `specCode`: Raw spec code (various formats accepted)

**Returns:** Normalized code (XX XX XX format) or null if invalid

## Type Definitions

### ParsedQuery
```typescript
interface ParsedQuery {
  rawQuery: string;
  specSection?: string;        // e.g., "23 05 00"
  topics: string[];            // Construction topics found
  keywords: string[];          // Extracted keywords
  confidence: number;          // 0-1 confidence score
}
```

### QueryContext
```typescript
interface QueryContext {
  parsedQuery: ParsedQuery;
  parsingMethod: 'regex' | 'haiku' | 'hybrid';
  parsingDuration: number;
  multiSpecSections?: string[];
  specSectionCategories?: Record<string, string>;
  intent?: 'search' | 'comparison' | 'calculation' | 'explanation';
  queryType?: 'categorical' | 'numerical' | 'structural';
  searchFilters: {
    projectId?: string;
    specSection?: string;
    specSectionRange?: { start: string; end: string };
    categories?: string[];
  };
  entities: {
    materials?: string[];
    systems?: string[];
    properties?: string[];
    values?: string[];
  };
  timestamp: string;
  userId?: string;
  projectId?: string;
  sessionId?: string;
}
```

## Performance Notes

- **Regex Parsing**: < 5ms typically
- **Haiku Fallback**: ~500-1500ms (includes API call)
- **Total Context Generation**: < 20ms (excluding Haiku)

## CSI MasterFormat Divisions

The parser includes mappings for all CSI MasterFormat divisions:

- **00**: Procurement & Contracting Requirements
- **01**: General Requirements
- **03**: Concrete
- **04**: Masonry
- **05**: Metals
- **06**: Wood, Plastics, & Composites
- **07**: Thermal & Moisture Protection
- **08**: Openings
- **09**: Finishes
- **23**: Heating, Ventilating, & Air Conditioning
- **26**: Electrical
- **27**: Communications
- ... and more

## Configuration

The query parser respects the RAGConfig settings:

```typescript
{
  queryParser: {
    enableHaikuFallback: true  // Enable/disable Haiku fallback
  }
}
```

## Error Handling

The parser includes graceful error handling:

```typescript
try {
  const context = await parser.parseQueryWithContext(query);
  // Use context for search filtering and ranking
} catch (error) {
  console.error('Query parsing failed:', error);
  // Fall back to basic search with raw query
}
```

## Testing

Comprehensive tests are included in `queryParser.test.ts`:

```bash
npm test -- queryParser.test.ts
```

Tests cover:
- Regex pattern matching
- Multiple spec section extraction
- Entity extraction
- Intent and type classification
- QueryContext generation
- Edge cases and special characters
- Performance benchmarks

## Future Enhancements

Potential improvements for future versions:

1. **Machine Learning Classification**: Use trained models for intent classification
2. **Multi-Language Support**: Parse queries in multiple languages
3. **Custom Taxonomy**: Allow projects to define custom topics and materials
4. **Caching Layer**: Cache frequent queries and their parsed contexts
5. **User Feedback Loop**: Learn from user interactions to improve parsing
6. **Semantic Similarity**: Use embeddings for better entity matching
