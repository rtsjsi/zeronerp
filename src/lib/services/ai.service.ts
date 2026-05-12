/**
 * AI Service — Single entry point for all Claude API calls
 * 
 * All AI interactions in the app MUST go through this service.
 * Never call the Anthropic SDK directly from components or route handlers.
 * 
 * Features:
 * - Centralised error handling with graceful fallback
 * - Response caching for repeated queries
 * - Cost management via token limits
 * - Streaming support for long responses
 */

import Anthropic from '@anthropic-ai/sdk';

// ─── Client Singleton ───────────────────────────────

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// ─── Types ──────────────────────────────────────────

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiResponse {
  success: boolean;
  content: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  error?: string;
}

export interface AiStreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: string) => void;
}

// ─── Simple query cache ─────────────────────────────

const queryCache = new Map<string, { response: AiResponse; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(systemPrompt: string, userMessage: string): string {
  return `${systemPrompt.slice(0, 100)}:${userMessage}`;
}

// ─── Core Methods ───────────────────────────────────

/**
 * Send a single message to Claude and receive a complete response.
 * @param systemPrompt — system-level instructions
 * @param userMessage  — the user's query
 * @param maxTokens    — maximum output tokens (default 1024)
 */
export async function aiChat(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024,
): Promise<AiResponse> {
  try {
    // Check cache first
    const cacheKey = getCacheKey(systemPrompt, userMessage);
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.response;
    }

    const client = getClient();
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const content = textBlock ? textBlock.text : '';

    const response: AiResponse = {
      success: true,
      content,
      tokensUsed: {
        input: message.usage.input_tokens,
        output: message.usage.output_tokens,
      },
    };

    // Cache the response
    queryCache.set(cacheKey, { response, timestamp: Date.now() });

    return response;
  } catch (error) {
    console.error('[AI Service Error]', error);
    return {
      success: false,
      content: '',
      tokensUsed: { input: 0, output: 0 },
      error: error instanceof Error ? error.message : 'AI service unavailable',
    };
  }
}

/**
 * Send a multi-turn conversation to Claude.
 */
export async function aiConversation(
  systemPrompt: string,
  messages: AiChatMessage[],
  maxTokens = 2048,
): Promise<AiResponse> {
  try {
    const client = getClient();
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const content = textBlock ? textBlock.text : '';

    return {
      success: true,
      content,
      tokensUsed: {
        input: message.usage.input_tokens,
        output: message.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error('[AI Service Error]', error);
    return {
      success: false,
      content: '',
      tokensUsed: { input: 0, output: 0 },
      error: error instanceof Error ? error.message : 'AI service unavailable',
    };
  }
}

/**
 * Parse document text (from OCR) into structured data using Claude.
 * Returns a JSON object with extracted fields.
 */
export async function aiParseDocument(
  ocrText: string,
  documentType: string,
  fieldHints: string[],
): Promise<AiResponse> {
  const systemPrompt = `You are a document parser for an ERP system. Extract structured data from the OCR text of a ${documentType}.
Return a valid JSON object with these fields: ${fieldHints.join(', ')}.
If a field is not found in the text, set it to null.
All monetary amounts should be in paise (multiply rupee values by 100).
Dates should be in ISO 8601 format.
Only return the JSON object, no explanation.`;

  return aiChat(systemPrompt, ocrText, 2048);
}

/**
 * Translate a natural language query into a safe read-only SQL query.
 * Returns the SQL string (never executes it directly).
 */
export async function aiNaturalLanguageToQuery(
  question: string,
  availableTables: string[],
  schemaContext: string,
): Promise<AiResponse> {
  const systemPrompt = `You are a SQL query generator for a PostgreSQL ERP database.
Convert the user's natural language question into a safe, read-only SELECT query.

Available tables: ${availableTables.join(', ')}
Schema context: ${schemaContext}

Rules:
- ONLY generate SELECT queries. Never INSERT, UPDATE, DELETE, DROP, ALTER, or any DDL/DML.
- Always include a LIMIT clause (max 100 rows).
- Always filter by tenantId (use :tenantId as a placeholder).
- Monetary values are stored in paise — divide by 100 for rupee display.
- Return ONLY the SQL query, no explanation.
- If the question cannot be answered with the available tables, return "UNSUPPORTED".`;

  return aiChat(systemPrompt, question, 1024);
}

/**
 * Clear the query cache (useful after data changes).
 */
export function clearAiCache(): void {
  queryCache.clear();
}
