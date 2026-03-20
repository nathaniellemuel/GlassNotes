/**
 * AI API Request/Response Examples
 * Reference guide for all endpoints and data structures
 */

// ============================================================================
// SUMMARIZE
// ============================================================================

/**
 * REQUEST
 */
{
  "text": "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. ML algorithms build a model based on sample data, known as training data, to make predictions or decisions without following static program instructions. Applications include email filtering, recommendation systems, and autonomous vehicles.",
  "action": "summarize"
}

/**
 * RESPONSE (Success)
 */
{
  "success": true,
  "data": "Machine learning (ML) is a branch of AI that allows systems to learn from data and improve automatically. ML algorithms create models from training data to make predictions without explicit programming. Uses include email filters, recommendations, and self-driving cars."
}

// ============================================================================
// TRANSLATE
// ============================================================================

/**
 * REQUEST (English to Spanish)
 */
{
  "text": "The weather is beautiful today. I enjoy walking in the park.",
  "action": "translate"
}

/**
 * RESPONSE
 */
{
  "success": true,
  "data": "El clima es hermoso hoy. Disfruto caminar en el parque."
}

/**
 * REQUEST (Spanish to English)
 */
{
  "text": "Hola, ¿cómo estás? Me gustaría aprender más sobre este tema.",
  "action": "translate"
}

/**
 * RESPONSE
 */
{
  "success": true,
  "data": "Hello, how are you? I would like to learn more about this topic."
}

// ============================================================================
// GRAMMAR FIX
// ============================================================================

/**
 * REQUEST
 */
{
  "text": "Their going to the store tomorow. She dont like coffe but he like it.",
  "action": "grammar"
}

/**
 * RESPONSE
 */
{
  "success": true,
  "data": "They're going to the store tomorrow. She doesn't like coffee, but he likes it."
}

// ============================================================================
// IMPROVE WRITING
// ============================================================================

/**
 * REQUEST
 */
{
  "text": "The app is good. It works fast. Users like it. The design is nice.",
  "action": "improve"
}

/**
 * RESPONSE
 */
{
  "success": true,
  "data": "The application delivers exceptional performance and user satisfaction. Its intuitive design creates an engaging experience, with users consistently praising the seamless and responsive interface."
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/**
 * Empty Text
 */
{
  "success": false,
  "error": "Missing required fields: text and action"
}

/**
 * Text Too Short
 */
{
  "success": false,
  "error": "Please provide at least 5 characters of text to process."
}

/**
 * Invalid Action
 */
{
  "success": false,
  "error": "The requested action is not supported for note-taking."
}

/**
 * Server Error
 */
{
  "success": false,
  "error": "Failed to process request. Please try again later."
}

/**
 * Connection Error (from client)
 */
{
  "success": false,
  "error": "Connection failed: Network request failed"
}

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

interface AIRequest {
  text: string;
  action: 'summarize' | 'translate' | 'grammar' | 'improve';
}

interface AIResponse {
  success: boolean;
  data?: string;
  error?: string;
}

interface AIProcessResult {
  success: boolean;
  data?: string;
  error?: string;
}

type AIAction = 'summarize' | 'translate' | 'grammar' | 'improve';

// ============================================================================
// CURL EXAMPLES
// ============================================================================

/*
# Summarize Request
curl -X POST http://localhost:3000/api/ai/process \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your long text here...",
    "action": "summarize"
  }'

# Grammar Fix Request
curl -X POST http://localhost:3000/api/ai/process \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Thier text with erors",
    "action": "grammar"
  }'

# Health Check
curl http://localhost:3000/health
*/

// ============================================================================
// VALIDATION RULES
// ============================================================================

/*
TEXT VALIDATION:
- Minimum: 5 characters
- Maximum: 10,000 characters
- Cannot be only whitespace

ACTION VALIDATION:
- Must be one of: summarize, translate, grammar, improve
- Case sensitive
- Required field

RESPONSE CODES:
- 200: Success (check success field in body)
- 400: Bad request (missing/invalid fields)
- 500: Server error (API call failed)
*/

// ============================================================================
// RATE LIMITING (Future Implementation)
// ============================================================================

/*
Recommended limits:
- Per user: 30 requests per minute
- Per IP: 100 requests per minute
- Per endpoint: 1000 requests per minute

Can be implemented with express-rate-limit:

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
});

app.post('/api/ai/process', limiter, (req, res) => {
  // Route handler
});
*/
