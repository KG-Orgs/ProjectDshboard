/**
 * Integration Example: Query Processing with RAG Pipeline
 * 
 * This example demonstrates how to integrate the enhanced QueryParser
 * with the RAG orchestrator for intelligent document retrieval and responding.
 */

import { QueryParser } from './services/queryParser';
import { ragOrchestrator } from './services/ragOrchestrator';
import { QueryContext } from './types/rag';

/**
 * Example 1: Basic Query Processing
 * Demonstrates simple query parsing with regex patterns
 */
export async function exampleBasicParsing() {
  console.log('=== Example 1: Basic Query Processing ===\n');

  const parser = new QueryParser();
  const queries = [
    'What does spec section 23 05 00 say about insulation?',
    'Find fire-rated materials in 07 21 00',
    'Compare roofing requirements in 07 30 00 vs 07 40 00',
  ];

  for (const query of queries) {
    const parsed = await parser.parseQuery(query);
    console.log(`Query: "${query}"`);
    console.log(`Spec Section: ${parsed.specSection || 'N/A'}`);
    console.log(`Topics: ${parsed.topics.join(', ') || 'None'}`);
    console.log(`Confidence: ${(parsed.confidence * 100).toFixed(0)}%\n`);
  }
}

/**
 * Example 2: Enhanced Context Parsing
 * Demonstrates comprehensive QueryContext generation
 */
export async function exampleContextParsing() {
  console.log('=== Example 2: Enhanced Context Parsing ===\n');

  const parser = new QueryParser();
  const userId = 'user-demo-001';
  const projectId = 'proj-office-building-2024';
  const sessionId = 'session-abc123';

  const query =
    'What are the approved fire-rated concrete systems for structural support in section 03 30 00?';

  const context = await parser.parseQueryWithContext(
    query,
    userId,
    projectId,
    sessionId
  );

  console.log('Parsed Query Context:');
  console.log(`  Raw Query: "${context.parsedQuery.rawQuery}"`);
  console.log(`  Spec Section: ${context.parsedQuery.specSection}`);
  console.log(`  Parsing Method: ${context.parsingMethod}`);
  console.log(`  Parsing Duration: ${context.parsingDuration}ms`);
  console.log(`  Intent: ${context.intent}`);
  console.log(`  Query Type: ${context.queryType}`);
  console.log(`  Confidence: ${(context.parsedQuery.confidence * 100).toFixed(0)}%`);

  if (context.entities.materials) {
    console.log(`  Materials: ${context.entities.materials.join(', ')}`);
  }
  if (context.entities.properties) {
    console.log(`  Properties: ${context.entities.properties.join(', ')}`);
  }
  if (context.entities.systems) {
    console.log(`  Systems: ${context.entities.systems.join(', ')}`);
  }

  console.log(`\nSearch Filters:`);
  console.log(`  Project: ${context.searchFilters.projectId}`);
  console.log(`  Spec Section: ${context.searchFilters.specSection}`);
  if (context.searchFilters.categories) {
    console.log(`  Categories: ${context.searchFilters.categories.join(', ')}`);
  }
}

/**
 * Example 3: Multi-Spec Section Handling
 * Demonstrates handling queries with multiple specification sections
 */
export async function exampleMultiSpecParsing() {
  console.log('=== Example 3: Multi-Spec Section Parsing ===\n');

  const parser = new QueryParser();
  const query =
    'How do the HVAC requirements in 23 05 00 integrate with electrical systems in 26 05 00?';

  const context = await parser.parseQueryWithContext(query);

  console.log(`Query: "${query}"\n`);
  console.log('Extracted Specifications:');

  if (context.multiSpecSections) {
    for (const spec of context.multiSpecSections) {
      const category =
        context.specSectionCategories?.[spec] || 'Unknown';
      console.log(`  - ${spec}: ${category}`);
    }
  }

  console.log(`\nQuery Intent: ${context.intent}`);
}

/**
 * Example 4: Entity Extraction
 * Demonstrates advanced entity extraction capabilities
 */
export async function exampleEntityExtraction() {
  console.log('=== Example 4: Entity Extraction ===\n');

  const parser = new QueryParser();
  const query =
    'What is the R-value requirement for fire-rated concrete and steel insulation systems in HVAC ducts?';

  const context = await parser.parseQueryWithContext(query);

  console.log(`Query: "${query}"\n`);
  console.log('Extracted Entities:');
  console.log('  Materials:');
  context.entities.materials?.forEach(m => console.log(`    - ${m}`));

  console.log('  Systems:');
  context.entities.systems?.forEach(s => console.log(`    - ${s}`));

  console.log('  Properties:');
  context.entities.properties?.forEach(p => console.log(`    - ${p}`));

  console.log('  Values:');
  context.entities.values?.forEach(v => console.log(`    - ${v}`));
}

/**
 * Example 5: Intent-Based RAG Execution
 * Demonstrates how to use parsed query context for intelligent RAG execution
 */
export async function exampleIntentBasedRAG(
  query: string,
  projectId: string
) {
  console.log(`=== Example 5: Intent-Based RAG Execution ===\n`);
  console.log(`Query: "${query}"\n`);

  const parser = new QueryParser();

  // Parse with context
  const context = await parser.parseQueryWithContext(query, undefined, projectId);

  // Adjust search strategy based on intent
  let searchStrategy = 'hybrid'; // Default
  let maxResults = 5; // Default
  let prioritizeMetadata = false; // Default

  switch (context.intent) {
    case 'comparison':
      // For comparisons, get more results and prioritize metadata matches
      searchStrategy = 'metadata-weighted';
      maxResults = 10;
      prioritizeMetadata = true;
      console.log('Search Strategy: Comparison mode');
      console.log(`  - Retrieving up to ${maxResults} results`);
      console.log('  - Prioritizing metadata matches for filtering');
      break;

    case 'calculation':
      // For calculations, focus on exact spec sections and numerical values
      searchStrategy = 'exact-match';
      maxResults = 3;
      console.log('Search Strategy: Calculation mode');
      console.log(`  - Retrieving up to ${maxResults} results`);
      console.log('  - Focusing on numerical specifications');
      break;

    case 'explanation':
      // For explanations, get comprehensive context
      searchStrategy = 'semantic';
      maxResults = 8;
      console.log('Search Strategy: Explanation mode');
      console.log(`  - Retrieving up to ${maxResults} results`);
      console.log('  - Focusing on semantic relevance');
      break;

    default:
      console.log('Search Strategy: Search mode (default)');
      console.log(`  - Retrieving up to ${maxResults} results`);
  }

  console.log(`\nParsing Details:`);
  console.log(`  Parsing Method: ${context.parsingMethod}`);
  console.log(`  Duration: ${context.parsingDuration}ms`);
  console.log(`  Confidence: ${(context.parsedQuery.confidence * 100).toFixed(0)}%`);

  if (context.multiSpecSections) {
    console.log(
      `  Spec Sections: ${context.multiSpecSections.join(', ')}`
    );
  }

  console.log(
    `\nEntity Context:\n  Materials: ${context.entities.materials?.join(', ') || 'None'
    }\n  Systems: ${context.entities.systems?.join(', ') || 'None'\n  Properties: ${context.entities.properties?.join(', ') || 'None'}`
  );

  // Here you would execute the RAG pipeline with the determined strategy
  // const response = await ragOrchestrator.executeRAG(
  //   query,
  //   projectId,
  //   [],
  //   (event) => console.log('Event:', event.type),
  //   context // Pass context for smart filtering
  // );
  // console.log('\nRAG Response:', response.responseText);
}

/**
 * Example 6: Spec Section Validation
 * Demonstrates spec section validation and normalization
 */
export async function exampleSpecValidation() {
  console.log('=== Example 6: Spec Section Validation ===\n');

  const testSpecs = [
    '23 05 00',
    '23-05-00',
    '23.05.00',
    '230500',
    '26-05-00',
    'invalid',
    '12-34',
  ];

  console.log('Validating Spec Sections:\n');

  for (const spec of testSpecs) {
    const validated = QueryParser.validateSpecSection(spec);
    const status = validated ? 'Valid' : 'Invalid';
    const result = validated ? ` → ${validated}` : '';
    console.log(`  ${spec.padEnd(15)} : ${status}${result}`);
  }
}

/**
 * Main: Run all examples
 */
export async function runAllExamples() {
  try {
    await exampleBasicParsing();
    console.log('\n---\n');

    await exampleContextParsing();
    console.log('\n---\n');

    await exampleMultiSpecParsing();
    console.log('\n---\n');

    await exampleEntityExtraction();
    console.log('\n---\n');

    await exampleIntentBasedRAG(
      'Compare HVAC systems in 23 05 00 with electrical in 26 05 00',
      'proj-building-2024'
    );
    console.log('\n---\n');

    await exampleSpecValidation();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  runAllExamples();
}
