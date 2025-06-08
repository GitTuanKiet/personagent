import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';
import type { ElementHandle, Page } from 'playwright';

export const dragDropAction = new DynamicStructuredAction({
	name: 'drag_drop',
	description:
		'Drag and drop elements or between coordinates on the page - useful for canvas drawing, sortable lists, sliders, file uploads, and UI rearrangement',
	schema: z.object({
		element_source: z
			.string()
			.nullable()
			.optional()
			.describe('CSS selector or XPath of the element to drag from'),
		element_target: z
			.string()
			.nullable()
			.optional()
			.describe('CSS selector or XPath of the element to drop onto'),
		element_source_offset: z
			.object({
				x: z.number(),
				y: z.number(),
			})
			.nullable()
			.optional()
			.describe(
				'Precise position within the source element to start drag (in pixels from top-left corner)',
			),
		element_target_offset: z
			.object({
				x: z.number(),
				y: z.number(),
			})
			.nullable()
			.optional()
			.describe(
				'Precise position within the target element to drop (in pixels from top-left corner)',
			),
		coord_source_x: z
			.number()
			.nullable()
			.optional()
			.describe('Absolute X coordinate on page to start drag from (in pixels)'),
		coord_source_y: z
			.number()
			.nullable()
			.optional()
			.describe('Absolute Y coordinate on page to start drag from (in pixels)'),
		coord_target_x: z
			.number()
			.nullable()
			.optional()
			.describe('Absolute X coordinate on page to drop at (in pixels)'),
		coord_target_y: z
			.number()
			.nullable()
			.optional()
			.describe('Absolute Y coordinate on page to drop at (in pixels)'),
		steps: z
			.number()
			.min(1)
			.max(20)
			.default(10)
			.nullable()
			.optional()
			.describe('Number of intermediate points for smoother movement (5-20 recommended)'),
		delay_ms: z
			.number()
			.min(0)
			.max(20)
			.default(5)
			.nullable()
			.optional()
			.describe('Delay in milliseconds between steps (0 for fastest, 10-20 for more natural)'),
	}),
	func: async (input) => {
		const instance = getBrowserInstance();
		const page: Page = await instance.getCurrentPage();
		async function getDragElements(page: Page, sourceSelector: string, targetSelector: string) {
			let sourceElement: ElementHandle | null = null;
			let targetElement: ElementHandle | null = null;
			try {
				const sourceLocator = page.locator(sourceSelector);
				const targetLocator = page.locator(targetSelector);
				if ((await sourceLocator.count()) > 0) {
					sourceElement = await sourceLocator.first().elementHandle();
				}
				if ((await targetLocator.count()) > 0) {
					targetElement = await targetLocator.first().elementHandle();
				}
			} catch (e) {}
			return [sourceElement, targetElement];
		}
		async function getElementCoordinates(
			sourceElement: ElementHandle,
			targetElement: ElementHandle,
			sourcePosition?: { x: number; y: number } | null,
			targetPosition?: { x: number; y: number } | null,
		) {
			let sourceCoords: [number, number] | null = null;
			let targetCoords: [number, number] | null = null;
			try {
				if (sourcePosition) {
					sourceCoords = [sourcePosition.x, sourcePosition.y];
				} else {
					const sourceBox = await sourceElement.boundingBox();
					if (sourceBox) {
						sourceCoords = [
							Math.round(sourceBox.x + sourceBox.width / 2),
							Math.round(sourceBox.y + sourceBox.height / 2),
						];
					}
				}
				if (targetPosition) {
					targetCoords = [targetPosition.x, targetPosition.y];
				} else {
					const targetBox = await targetElement.boundingBox();
					if (targetBox) {
						targetCoords = [
							Math.round(targetBox.x + targetBox.width / 2),
							Math.round(targetBox.y + targetBox.height / 2),
						];
					}
				}
			} catch (e) {}
			return [sourceCoords, targetCoords];
		}
		async function executeDragOperation(
			page: Page,
			sourceX: number,
			sourceY: number,
			targetX: number,
			targetY: number,
			steps: number,
			delayMs: number,
		): Promise<[boolean, string]> {
			try {
				await page.mouse.move(sourceX, sourceY);
				await page.mouse.down();
				for (let i = 1; i <= steps; i++) {
					const ratio = i / steps;
					const intermediateX = Math.round(sourceX + (targetX - sourceX) * ratio);
					const intermediateY = Math.round(sourceY + (targetY - sourceY) * ratio);
					await page.mouse.move(intermediateX, intermediateY);
					if (delayMs > 0) {
						await new Promise((res) => setTimeout(res, delayMs));
					}
				}
				await page.mouse.move(targetX, targetY);
				await page.mouse.move(targetX, targetY);
				await page.mouse.up();
				return [true, 'Drag operation completed successfully'];
			} catch (e) {
				return [false, `Error during drag operation: ${String(e)}`];
			}
		}
		try {
			let sourceX = null,
				sourceY = null,
				targetX = null,
				targetY = null;
			const steps = Math.max(1, input.steps ?? 10);
			const delayMs = Math.max(0, input.delay_ms ?? 5);
			if (input.element_source && input.element_target) {
				const [sourceElement, targetElement] = await getDragElements(
					page,
					input.element_source,
					input.element_target,
				);
				if (!sourceElement || !targetElement) {
					return `Failed to find ${!sourceElement ? 'source' : 'target'} element`;
				}
				const [sourceCoords, targetCoords] = await getElementCoordinates(
					sourceElement,
					targetElement,
					input.element_source_offset,
					input.element_target_offset,
				);
				if (!sourceCoords || !targetCoords) {
					return `Failed to determine ${!sourceCoords ? 'source' : 'target'} coordinates`;
				}
				[sourceX, sourceY] = sourceCoords;
				[targetX, targetY] = targetCoords;
			} else if (
				[
					input.coord_source_x,
					input.coord_source_y,
					input.coord_target_x,
					input.coord_target_y,
				].every((coord) => coord !== undefined && coord !== null)
			) {
				sourceX = input.coord_source_x;
				sourceY = input.coord_source_y;
				targetX = input.coord_target_x;
				targetY = input.coord_target_y;
			} else {
				return 'Must provide either source/target selectors or source/target coordinates';
			}
			if (
				[sourceX, sourceY, targetX, targetY].some((coord) => coord === null || coord === undefined)
			) {
				return 'Failed to determine source or target coordinates';
			}
			const [success, message] = await executeDragOperation(
				page,
				sourceX!,
				sourceY!,
				targetX!,
				targetY!,
				steps,
				delayMs,
			);
			if (!success) {
				return message;
			}
			let msg;
			if (input.element_source && input.element_target) {
				msg = `🖱️ Dragged element '${input.element_source}' to '${input.element_target}'`;
			} else {
				msg = `🖱️ Dragged from (${sourceX}, ${sourceY}) to (${targetX}, ${targetY})`;
			}
			return msg;
		} catch (e) {
			const errorMsg = `Failed to perform drag and drop: ${String(e)}`;
			return errorMsg;
		}
	},
});
