import type { Page, ElementHandle } from 'patchright';

export async function getDragElements(page: Page, sourceSelector: string, targetSelector: string) {
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
export async function getElementCoordinates(
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
export async function executeDragOperation(
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
