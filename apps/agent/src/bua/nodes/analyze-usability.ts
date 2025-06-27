import { HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getConfig } from '@langchain/langgraph';
import type { BUAState, UsabilityIssue } from '../state.js';
import { ensureConfiguration } from '../configuration.js';
import type { PersonaConfiguration } from '../configuration.js';

// Define Zod schema for structured output
const UsabilityIssueSchema = z.object({
	description: z.string().describe('Clear description of the usability problem'),
	severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Severity level of the issue'),
	impact: z
		.enum(['minor', 'moderate', 'major', 'blocker'])
		.describe('Impact level on user experience'),
	recommendation: z.string().describe('Specific actionable suggestion to fix the issue'),
	context: z.string().describe('Reference to specific actions/steps that revealed this issue'),
	category: z
		.enum(['navigation', 'forms', 'content', 'accessibility', 'errors', 'performance'])
		.describe('Category of the usability issue'),
});

const UsabilityAnalysisSchema = z.object({
	issues: z.array(UsabilityIssueSchema).describe('Array of usability issues found during analysis'),
	summary: z.string().describe('Brief summary of the overall usability assessment'),
	taskCompletion: z
		.boolean()
		.describe('Whether the user successfully completed their intended task'),
	totalSteps: z.number().describe('Total number of steps taken during the session'),
});

/**
 * Generate persona-specific usability analysis prompt
 */
function buildPersonaAwarePrompt(
	actionHistory: string,
	totalActions: number,
	totalSteps: number,
	isDone: boolean,
	persona?: PersonaConfiguration,
): string {
	const personaSection = persona
		? `
## 👤 User Persona Analysis Context:
**Name**: ${persona.name}
**Description**: ${persona.description || 'No description provided'}
**Age Group**: ${persona.ageGroup || 'Unknown'} 
**Digital Skill Level**: ${persona.digitalSkillLevel || 'Unknown'}
**Behavior Traits**: ${persona.behaviorTraits?.join(', ') || 'None specified'}
**Language**: ${persona.language}
**Preferences**: ${JSON.stringify(persona.preferences || {}, null, 2)}

**🧠 Persona-Specific Analysis Guidelines:**
${getPersonaSpecificGuidelines(persona)}
`
		: `
## 👤 User Persona Analysis Context:
**No persona information provided** - Perform general usability analysis.
`;

	return `You are a UX expert analyzing user interactions with a web application. Based on the user's actions and behaviors during their session, identify potential usability issues.

${personaSection}

## 📋 General Analysis Guidelines:
1. **Task Efficiency**: Look for unnecessary steps, confusion, or repeated actions
2. **Navigation Issues**: Identify problems with finding elements, unclear UI patterns  
3. **Form & Input Problems**: Issues with form validation, unclear labels, input difficulties
4. **Information Architecture**: Problems with content findability, unclear categorization
5. **Accessibility**: Issues that might affect users with different abilities
6. **Error Handling**: Poor error messages, unclear feedback
7. **Mobile/Responsive Issues**: If applicable, responsive design problems

## 📊 Session Data:
- **Total Steps**: ${totalSteps}
- **Task Completion Status**: ${isDone ? 'Completed' : 'Incomplete'}  
- **Total Actions Performed**: ${totalActions}

## 🎬 Detailed Action History:
${actionHistory || 'No actions recorded'}

## 🎯 Analysis Instructions:
${
	persona
		? `
Analyze the user's interaction patterns **through the lens of the ${persona.name} persona**. Consider their:
- **Age group (${persona.ageGroup})** and typical technology comfort level
- **Digital skill level (${persona.digitalSkillLevel})** when evaluating interaction complexity
- **Behavior traits (${persona.behaviorTraits?.join(', ')})** and how they influence interaction patterns
- **Language preference (${persona.language})** for content comprehension issues
- **Personal preferences** and how UI elements align with their expectations

Identify usability issues that would **specifically impact this persona type** and provide recommendations tailored to their characteristics.
`
		: `
Analyze the user's interaction patterns and identify general usability issues that would impact typical users.
`
}

For each issue, provide:
- Clear description of the problem
- Appropriate severity and impact levels  
- Actionable recommendations for improvement
- Context showing which specific actions revealed the issue
- Proper categorization

Focus on actionable insights that would improve the user experience${persona ? ` for ${persona.name}-type users` : ''}.`;
}

/**
 * Get persona-specific analysis guidelines
 */
function getPersonaSpecificGuidelines(persona: PersonaConfiguration): string {
	const guidelines: string[] = [];

	// Age group specific guidelines
	if (persona.ageGroup === 'teen') {
		guidelines.push(
			'• **Teen Users**: Look for impatience with slow loading, preference for intuitive gestures, and expectation of mobile-first design',
		);
	} else if (persona.ageGroup === 'senior') {
		guidelines.push(
			'• **Senior Users**: Pay attention to text size issues, complex navigation confusion, and preference for clear, simple interfaces',
		);
	} else if (persona.ageGroup === 'adult') {
		guidelines.push(
			'• **Adult Users**: Focus on efficiency, task completion speed, and professional interface expectations',
		);
	}

	// Digital skill level guidelines
	if (persona.digitalSkillLevel === 'low') {
		guidelines.push(
			'• **Low Digital Skills**: Identify areas where advanced features create confusion, unclear affordances, or missing guidance',
		);
	} else if (persona.digitalSkillLevel === 'medium') {
		guidelines.push(
			'• **Medium Digital Skills**: Look for inconsistent patterns, moderate complexity issues, and areas needing better feedback',
		);
	} else if (persona.digitalSkillLevel === 'high') {
		guidelines.push(
			'• **High Digital Skills**: Focus on efficiency bottlenecks, missing shortcuts, and areas where advanced users feel constrained',
		);
	}

	// Behavior trait specific guidelines
	if (persona.behaviorTraits?.includes('impatient')) {
		guidelines.push(
			'• **Impatient Behavior**: Flag slow loading times, excessive steps, or unclear progress indicators',
		);
	}
	if (persona.behaviorTraits?.includes('cautious')) {
		guidelines.push(
			'• **Cautious Behavior**: Look for insufficient confirmation dialogs, unclear consequences, or risky actions without warnings',
		);
	}
	if (persona.behaviorTraits?.includes('detail-oriented')) {
		guidelines.push(
			'• **Detail-Oriented**: Check for missing information, unclear specifications, or inadequate data presentation',
		);
	}
	if (persona.behaviorTraits?.includes('hesitatesWithForms')) {
		guidelines.push(
			'• **Form Hesitation**: Pay special attention to form complexity, validation clarity, and input guidance',
		);
	}
	if (persona.behaviorTraits?.includes('prefersTextOverIcon')) {
		guidelines.push(
			'• **Text Preference**: Identify unclear icons, missing text labels, or icon-only interfaces',
		);
	}

	return guidelines.length > 0
		? guidelines.join('\n')
		: '• Perform standard usability analysis based on general UX principles';
}

/**
 * Analyzes the user interaction session to identify usability issues using structured output
 */
export async function analyzeUsability(state: BUAState): Promise<Partial<BUAState>> {
	// Get configuration including persona information
	const config = getConfig();
	const { model, persona } = ensureConfiguration(config ?? {});

	// Initialize model with structured output
	const llm = new ChatOpenAI({
		model,
		temperature: 0.1,
	}).withStructuredOutput(UsabilityAnalysisSchema, {
		name: 'usability_analysis',
	});

	// Prepare action history for analysis
	const actionHistory = Object.entries(state.scripts)
		.sort(([a], [b]) => Number(a) - Number(b))
		.map(([step, actions]) => {
			return `**Step ${step}:**\n${actions
				.map((action) => `- ${action.name}: ${JSON.stringify(action.args, null, 2)}`)
				.join('\n')}`;
		})
		.join('\n\n');

	const totalActions = Object.values(state.scripts).reduce(
		(total, actions) => total + actions.length,
		0,
	);

	// Build persona-aware prompt
	const analysisPrompt = buildPersonaAwarePrompt(
		actionHistory,
		totalActions,
		state.nSteps,
		state.isDone,
		persona,
	);

	try {
		const analysisResult = await llm.invoke([new HumanMessage({ content: analysisPrompt })]);

		console.log(
			`🔍 Usability Analysis Complete: Found ${analysisResult.issues.length} issues${persona ? ` for persona "${persona.name}"` : ''}`,
		);

		// Convert to our internal UsabilityIssue format
		const usabilityIssues: UsabilityIssue[] = analysisResult.issues.map((issue) => ({
			description: issue.description,
			severity: issue.severity,
			impact: issue.impact,
			recommendation: issue.recommendation,
			context: issue.context,
			category: issue.category,
		}));

		// Create persona-aware summary message
		const personaInfo = persona
			? `\n**👤 Analyzed for Persona**: ${persona.name} (${persona.ageGroup}, ${persona.digitalSkillLevel} skills)`
			: '';

		const summaryMessage = new HumanMessage({
			content: `## 🔍 Usability Analysis Results${personaInfo}

**Summary**: ${analysisResult.summary}

**Session Overview**:
- Task Completed: ${analysisResult.taskCompletion ? '✅ Yes' : '❌ No'}
- Total Steps: ${analysisResult.totalSteps}
- Issues Found: ${analysisResult.issues.length}

**Identified Issues**:
${usabilityIssues
	.map(
		(issue, i) =>
			`**${i + 1}. ${issue.description}** \n` +
			`   - Severity: ${issue.severity.toUpperCase()} | Impact: ${issue.impact.toUpperCase()}\n` +
			`   - Category: ${issue.category}\n` +
			`   - Recommendation: ${issue.recommendation}\n` +
			`   - Context: ${issue.context}\n`,
	)
	.join('\n')}`,
		});

		return {
			messages: [summaryMessage],
			usabilityIssues,
		};
	} catch (error) {
		console.error('Usability analysis failed:', error);

		// Return fallback analysis with proper error handling
		const errorMessage = error instanceof Error ? error.message : String(error);
		const fallbackAnalysis = new HumanMessage({
			content: `⚠️ Usability analysis encountered an error: ${errorMessage}\n\nSession Summary:\n- Steps: ${state.nSteps}\n- Completed: ${state.isDone}\n- Total Actions: ${totalActions}${persona ? `\n- Persona: ${persona.name}` : ''}`,
		});

		const fallbackIssue: UsabilityIssue = {
			description: 'Usability analysis failed due to technical error',
			severity: 'low',
			impact: 'minor',
			recommendation: 'Review analysis configuration and retry',
			context: `Error during analysis: ${errorMessage}`,
			category: 'errors',
		};

		return {
			messages: [fallbackAnalysis],
			usabilityIssues: [fallbackIssue],
		};
	}
}
