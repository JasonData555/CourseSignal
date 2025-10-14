import OpenAI from 'openai';
import { query } from '../db/connection';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface RecommendationInput {
  userId: string;
  summary: {
    totalRevenue: number;
    totalStudents: number;
    avgOrderValue: number;
    totalPurchases: number;
    trends: {
      revenue: number;
      students: number;
      avgOrderValue: number;
    };
  };
  sources: Array<{
    source: string;
    revenue: number;
    visitors: number;
    students: number;
    conversionRate: string;
    avgOrderValue: string;
    revenuePerVisitor: string;
  }>;
}

export interface AIRecommendation {
  id: string;
  type: 'opportunity' | 'warning' | 'insight';
  title: string;
  description: string;
  metric?: string;
  action?: string;
  priority: number; // 1-5, where 5 is highest priority
}

// Cache structure
interface CachedRecommendation {
  recommendations: AIRecommendation[];
  generatedAt: Date;
  ttl: number; // milliseconds
}

const recommendationCache = new Map<string, CachedRecommendation>();

/**
 * Get AI-powered recommendations for a user's dashboard
 * Falls back to rule-based recommendations if OpenAI is unavailable
 */
export async function getRecommendations(
  input: RecommendationInput,
  useAI: boolean = true
): Promise<AIRecommendation[]> {
  const { userId, summary, sources } = input;

  // Check cache first
  const cacheKey = `${userId}-${JSON.stringify({ summary, sources })}`;
  const cached = recommendationCache.get(cacheKey);

  if (cached && Date.now() - cached.generatedAt.getTime() < cached.ttl) {
    return cached.recommendations;
  }

  // Try AI-powered recommendations if enabled and available
  if (useAI && openai) {
    try {
      const aiRecommendations = await generateAIRecommendations(input);

      // Cache for 1 hour
      recommendationCache.set(cacheKey, {
        recommendations: aiRecommendations,
        generatedAt: new Date(),
        ttl: 60 * 60 * 1000, // 1 hour
      });

      return aiRecommendations;
    } catch (error) {
      console.error('AI recommendation generation failed, falling back to rule-based:', error);
      // Fall through to rule-based recommendations
    }
  }

  // Fallback: Rule-based recommendations
  const ruleBasedRecommendations = generateRuleBasedRecommendations(input);

  // Cache rule-based recommendations for shorter period (15 minutes)
  recommendationCache.set(cacheKey, {
    recommendations: ruleBasedRecommendations,
    generatedAt: new Date(),
    ttl: 15 * 60 * 1000, // 15 minutes
  });

  return ruleBasedRecommendations;
}

/**
 * Generate recommendations using OpenAI GPT-4o-mini
 */
async function generateAIRecommendations(input: RecommendationInput): Promise<AIRecommendation[]> {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  const { summary, sources } = input;

  // Build structured prompt
  const prompt = `You are an expert revenue analytics advisor for course creators. Analyze the following data and provide 3-5 actionable recommendations.

METRICS SUMMARY:
- Total Revenue: $${summary.totalRevenue.toFixed(2)}
- Total Students: ${summary.totalStudents}
- Average Order Value: $${summary.avgOrderValue.toFixed(2)}
- Total Purchases: ${summary.totalPurchases}

TRENDS (vs previous period):
- Revenue: ${summary.trends.revenue > 0 ? '+' : ''}${summary.trends.revenue.toFixed(1)}%
- Students: ${summary.trends.students > 0 ? '+' : ''}${summary.trends.students.toFixed(1)}%
- AOV: ${summary.trends.avgOrderValue > 0 ? '+' : ''}${summary.trends.avgOrderValue.toFixed(1)}%

TRAFFIC SOURCES:
${sources.map(s => `
- ${s.source}:
  * Visitors: ${s.visitors}
  * Revenue: $${s.revenue.toFixed(2)}
  * Students: ${s.students}
  * Conversion Rate: ${s.conversionRate}%
  * Avg Order Value: $${s.avgOrderValue}
  * Revenue per Visitor: $${s.revenuePerVisitor}
`).join('\n')}

Please provide 3-5 recommendations as a JSON array with this exact structure:
[
  {
    "id": "unique-id",
    "type": "opportunity" | "warning" | "insight",
    "title": "Short title (max 60 chars)",
    "description": "Clear description of the insight (max 150 chars)",
    "metric": "Optional metric to highlight (e.g., '+25% conversion')",
    "action": "Specific action to take (max 100 chars)",
    "priority": 1-5 (where 5 is highest priority)
  }
]

GUIDELINES:
- Focus on actionable insights, not generic advice
- Prioritize recommendations by potential revenue impact
- Be specific to the data provided
- Use "opportunity" for growth potential, "warning" for concerns, "insight" for interesting patterns
- Consider conversion rates, traffic quality, and revenue trends
- Only return valid JSON, no additional text`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a data analyst specializing in course creator revenue attribution. Provide concise, actionable recommendations based on metrics.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  // Parse JSON response
  const parsed = JSON.parse(content);
  const recommendations = Array.isArray(parsed) ? parsed : parsed.recommendations || [];

  // Validate and sanitize
  return recommendations
    .filter((rec: any) => rec.title && rec.description && rec.type)
    .map((rec: any, index: number) => ({
      id: rec.id || `ai-rec-${index}`,
      type: ['opportunity', 'warning', 'insight'].includes(rec.type) ? rec.type : 'insight',
      title: String(rec.title).substring(0, 60),
      description: String(rec.description).substring(0, 150),
      metric: rec.metric ? String(rec.metric).substring(0, 50) : undefined,
      action: rec.action ? String(rec.action).substring(0, 100) : undefined,
      priority: typeof rec.priority === 'number' ? Math.max(1, Math.min(5, rec.priority)) : 3,
    }))
    .sort((a: AIRecommendation, b: AIRecommendation) => b.priority - a.priority)
    .slice(0, 5); // Max 5 recommendations
}

/**
 * Generate recommendations using rule-based logic (fallback)
 */
function generateRuleBasedRecommendations(input: RecommendationInput): AIRecommendation[] {
  const { summary, sources } = input;
  const recs: AIRecommendation[] = [];

  if (sources.length === 0) {
    return recs;
  }

  // Sort sources by conversion rate
  const sortedByConversion = [...sources].sort(
    (a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate)
  );
  const topSource = sortedByConversion[0];
  const worstSource = sortedByConversion[sortedByConversion.length - 1];

  // Sort by revenue
  const sortedByRevenue = [...sources].sort((a, b) => b.revenue - a.revenue);
  const topRevenueSource = sortedByRevenue[0];

  // Recommendation 1: Revenue trend
  if (summary.trends.revenue < -10) {
    recs.push({
      id: 'revenue-decline',
      type: 'warning',
      title: 'Revenue declining',
      description: `Revenue is down ${Math.abs(summary.trends.revenue).toFixed(1)}% from last period.`,
      action: 'Review recent changes to your marketing strategy',
      priority: 5,
    });
  } else if (summary.trends.revenue > 20) {
    recs.push({
      id: 'revenue-growth',
      type: 'opportunity',
      title: 'Strong revenue growth',
      description: `Your revenue is up ${summary.trends.revenue.toFixed(1)}% compared to last period.`,
      metric: `+$${((summary.totalRevenue * summary.trends.revenue) / (100 + summary.trends.revenue)).toFixed(0)}`,
      action: 'Keep doing what you\'re doing!',
      priority: 4,
    });
  }

  // Recommendation 2: Best performing source
  if (sources.length >= 2 && parseFloat(topSource.conversionRate) > parseFloat(worstSource.conversionRate) * 1.5) {
    recs.push({
      id: 'best-source',
      type: 'opportunity',
      title: `${topSource.source} is your top performer`,
      description: `This channel converts at ${topSource.conversionRate}%, significantly better than others.`,
      action: `Consider increasing investment in ${topSource.source}`,
      priority: 4,
    });
  }

  // Recommendation 3: Underperforming source with traffic
  if (parseFloat(worstSource.conversionRate) < 1 && worstSource.visitors > 100) {
    recs.push({
      id: 'worst-source',
      type: 'warning',
      title: `${worstSource.source} has low conversion`,
      description: `With ${worstSource.visitors} visitors but only ${worstSource.conversionRate}% conversion, there's opportunity.`,
      action: `Review your ${worstSource.source} strategy or landing pages`,
      priority: 3,
    });
  }

  // Recommendation 4: AOV trends
  if (summary.trends.avgOrderValue > 15) {
    recs.push({
      id: 'aov-increase',
      type: 'insight',
      title: 'Average order value increasing',
      description: `Students are spending ${summary.trends.avgOrderValue.toFixed(1)}% more per purchase.`,
      action: 'Consider promoting higher-tier courses more prominently',
      priority: 3,
    });
  } else if (summary.trends.avgOrderValue < -15) {
    recs.push({
      id: 'aov-decrease',
      type: 'warning',
      title: 'Average order value declining',
      description: `AOV is down ${Math.abs(summary.trends.avgOrderValue).toFixed(1)}% from last period.`,
      action: 'Review pricing strategy or promote higher-value offers',
      priority: 3,
    });
  }

  // Recommendation 5: Top revenue source
  if (topRevenueSource.revenue > 0) {
    const revenuePercent = (topRevenueSource.revenue / summary.totalRevenue) * 100;
    recs.push({
      id: 'top-revenue-source',
      type: 'insight',
      title: `${topRevenueSource.source} drives most revenue`,
      description: `This channel represents ${revenuePercent.toFixed(1)}% of your total revenue.`,
      metric: `$${topRevenueSource.revenue.toFixed(0)}`,
      action: 'Protect and optimize this critical channel',
      priority: 2,
    });
  }

  // Sort by priority and return top 5
  return recs.sort((a: AIRecommendation, b: AIRecommendation) => b.priority - a.priority).slice(0, 5);
}

/**
 * Clear cache for a specific user (useful after significant data changes)
 */
export function clearRecommendationCache(userId: string) {
  const keysToDelete: string[] = [];

  for (const key of recommendationCache.keys()) {
    if (key.startsWith(`${userId}-`)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => recommendationCache.delete(key));
}

/**
 * Get user's AI preference from database
 */
export async function getUserAIPreference(userId: string): Promise<boolean> {
  try {
    const result = await query(
      'SELECT ai_recommendations_enabled FROM users WHERE id = $1',
      [userId]
    );

    // Default to true if column doesn't exist yet
    return result.rows[0]?.ai_recommendations_enabled !== false;
  } catch (error) {
    // If column doesn't exist, default to true
    return true;
  }
}

/**
 * Update user's AI preference
 */
export async function updateUserAIPreference(userId: string, enabled: boolean): Promise<void> {
  await query(
    'UPDATE users SET ai_recommendations_enabled = $1 WHERE id = $2',
    [enabled, userId]
  );
}
