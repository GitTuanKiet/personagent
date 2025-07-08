import type { BrowserToolCall, ThreadState } from '@/types';
import type { ActionConfig, ExportData, ExportFormat, CanvasState } from './types';
import { ACTION_CONFIG, DEFAULT_ACTION_CONFIG, SEVERITY_BORDERS } from './constants';

/**
 * Get action configuration for a given action name
 */
export function getActionConfig(actionName: string): ActionConfig {
	const actionKey = actionName.toLowerCase() as keyof typeof ACTION_CONFIG;
	return ACTION_CONFIG[actionKey] || DEFAULT_ACTION_CONFIG;
}

/**
 * Get browser action description based on action type and arguments
 */
export function getBrowserActionDescription(action: BrowserToolCall): string {
	const args = action.args || {};

	switch (action.name.toLowerCase()) {
		case 'click_element_by_index':
			return `Click element #${args.index}${args.reason ? ` - ${args.reason}` : ''}`;
		case 'done':
			return `Task completed${args.reason ? ` - ${args.reason}` : ''}`;
		case 'drag_drop':
			return `Drag and drop from ${args.from_selector || 'source'} to ${args.to_selector || 'target'}`;
		case 'dropdown_options':
			return `Get dropdown options for ${args.selector || 'dropdown'}`;
		case 'execute_javascript':
			return `Execute JavaScript${args.script ? `: ${args.script.substring(0, 50)}...` : ''}`;
		case 'get_content':
			return `Get page content${args.selector ? ` from ${args.selector}` : ''}`;
		case 'input_text':
			return `Type "${args.text}" into ${args.selector || 'input field'}`;
		case 'navigate_or_back':
			return args.url ? `Navigate to ${args.url}` : 'Go back';
		case 'scroll':
			return `Scroll ${args.direction || 'down'}${args.amount ? ` by ${args.amount}` : ''}`;
		case 'send_keys':
			return `Send keys: ${args.keys || 'N/A'}`;
		case 'tab_manager':
			return `Tab action: ${args.action || 'N/A'}`;
		case 'wait':
			return `Wait ${args.seconds || 1} seconds`;
		case 'thinking':
			return `Thinking: ${args.thought || 'Processing...'}`;
		default:
			return action.name.replace(/_/g, ' ').toLowerCase();
	}
}

/**
 * Get severity border class for action
 */
export function getSeverityBorder(severity: string): string {
	return SEVERITY_BORDERS[severity as keyof typeof SEVERITY_BORDERS] || SEVERITY_BORDERS.low;
}

/**
 * Calculate total action count from scripts
 */
export function getTotalActionCount(scripts: ThreadState['scripts']): number {
	if (!scripts) return 0;
	return Object.values(scripts).reduce((total, step) => total + (step.length || 0), 0);
}

/**
 * Get canvas state based on simulation state
 */
export function getCanvasState(
	scripts: ThreadState['scripts'],
	isRunning: boolean,
	isDone: boolean,
	hasIssues: boolean,
): CanvasState {
	if (!scripts) return 'empty';
	if (isRunning || !isDone) return 'executing';
	if (isDone && hasIssues) return 'issues-detected';
	if (isDone) return 'completed';
	return 'executing';
}

/**
 * Export simulation data in various formats
 */
export function exportSimulationData(
	scripts: ThreadState['scripts'],
	usabilityIssues: ThreadState['usabilityIssues'],
	format: ExportFormat = 'json',
	filename?: string,
): void {
	if (!scripts) return;

	const totalActions = getTotalActionCount(scripts);
	const totalSteps = Object.keys(scripts).length;

	const exportData: ExportData = {
		scripts,
		usabilityIssues,
		timestamp: new Date().toISOString(),
		metadata: {
			totalActions,
			totalSteps,
			success: !usabilityIssues?.length,
		},
	};

	const baseFilename = filename || `simulation-export-${Date.now()}`;

	switch (format) {
		case 'json':
			downloadFile(JSON.stringify(exportData, null, 2), `${baseFilename}.json`, 'application/json');
			break;
		case 'csv':
			downloadFile(convertToCSV(exportData), `${baseFilename}.csv`, 'text/csv');
			break;
		case 'html':
			downloadFile(convertToHTML(exportData), `${baseFilename}.html`, 'text/html');
			break;
	}
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Convert export data to CSV format
 */
function convertToCSV(data: ExportData): string {
	const headers = ['Step', 'Action Index', 'Action Name', 'Description', 'Arguments'];
	const rows = [headers.join(',')];

	Object.entries(data.scripts || {}).forEach(([step, actions]) => {
		actions.forEach((action, index) => {
			const description = getBrowserActionDescription(action);
			const args = JSON.stringify(action.args || {}).replace(/"/g, '""');
			const row = [step, index.toString(), action.name, `"${description}"`, `"${args}"`];
			rows.push(row.join(','));
		});
	});

	return rows.join('\n');
}

/**
 * Convert export data to HTML format
 */
function convertToHTML(data: ExportData): string {
	const { scripts, usabilityIssues, timestamp, metadata } = data;

	let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Simulation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; }
        .metadata { background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
        .step { margin-bottom: 30px; }
        .step-header { background: #e9ecef; padding: 10px; border-radius: 5px; font-weight: bold; }
        .action { margin: 10px 0; padding: 10px; border-left: 3px solid #007bff; background: #f8f9fa; }
        .issues { margin-top: 30px; }
        .issue { margin: 10px 0; padding: 10px; border-left: 3px solid #dc3545; background: #f8d7da; }
        .issue.high { border-left-color: #dc3545; }
        .issue.medium { border-left-color: #ffc107; }
        .issue.low { border-left-color: #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Simulation Report</h1>
        <p>Generated on: ${new Date(timestamp).toLocaleString()}</p>
    </div>
    
    <div class="metadata">
        <h2>Summary</h2>
        <p><strong>Total Steps:</strong> ${metadata?.totalSteps || 0}</p>
        <p><strong>Total Actions:</strong> ${metadata?.totalActions || 0}</p>
        <p><strong>Success:</strong> ${metadata?.success ? 'Yes' : 'No'}</p>
        <p><strong>Issues Found:</strong> ${usabilityIssues?.length || 0}</p>
    </div>`;

	// Add actions
	if (scripts) {
		html += '<h2>Actions</h2>';
		Object.entries(scripts).forEach(([step, actions]) => {
			html += `
            <div class="step">
                <div class="step-header">Step ${step} (${actions.length} actions)</div>`;

			actions.forEach((action, index) => {
				const description = getBrowserActionDescription(action);
				html += `
                <div class="action">
                    <strong>${index + 1}. ${action.name.replace(/_/g, ' ')}</strong><br>
                    ${description}<br>
                    <small>Arguments: ${JSON.stringify(action.args || {}, null, 2)}</small>
                </div>`;
			});

			html += '</div>';
		});
	}

	// Add issues
	if (usabilityIssues?.length) {
		html += `
        <div class="issues">
            <h2>Usability Issues</h2>`;

		usabilityIssues.forEach((issue, index) => {
			html += `
            <div class="issue ${issue.severity}">
                <strong>${index + 1}. ${issue.title || issue.description}</strong><br>
                <p>${issue.description}</p>
                ${issue.recommendation ? `<p><strong>Recommendation:</strong> ${issue.recommendation}</p>` : ''}
                <small>Severity: ${issue.severity} | Category: ${issue.category}</small>
            </div>`;
		});

		html += '</div>';
	}

	html += '</body></html>';
	return html;
}

/**
 * Search actions based on query and options
 */
export function searchActions(
	scripts: ThreadState['scripts'],
	query: string,
	caseSensitive = false,
	regex = false,
): Array<{ step: number; actionIndex: number; action: BrowserToolCall }> {
	if (!scripts || !query.trim()) return [];

	const searchQuery = caseSensitive ? query : query.toLowerCase();
	const results: Array<{ step: number; actionIndex: number; action: BrowserToolCall }> = [];

	Object.entries(scripts).forEach(([stepStr, actions]) => {
		const step = parseInt(stepStr);
		actions.forEach((action, actionIndex) => {
			const searchableText = [
				action.name,
				getBrowserActionDescription(action),
				JSON.stringify(action.args || {}),
			].join(' ');

			const textToSearch = caseSensitive ? searchableText : searchableText.toLowerCase();

			let match = false;
			if (regex) {
				try {
					const regExp = new RegExp(searchQuery, caseSensitive ? 'g' : 'gi');
					match = regExp.test(textToSearch);
				} catch {
					// Fallback to simple string search if regex is invalid
					match = textToSearch.includes(searchQuery);
				}
			} else {
				match = textToSearch.includes(searchQuery);
			}

			if (match) {
				results.push({ step, actionIndex, action });
			}
		});
	});

	return results;
}

/**
 * Format duration in human readable format
 */
export function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
	} else if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	} else {
		return `${seconds}s`;
	}
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout;
	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
}
