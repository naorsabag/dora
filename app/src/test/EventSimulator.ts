import { KeyboardButton, MouseButton } from "./TestConsts";

export class EventSimulator {

	constructor(private _element?: any) {
		this._element = _element || document.getElementsByTagName("BODY")[0];
	}

	get element(): any {
		return this._element;
	}

	set element(elm: any) {
		this._element = elm;
	}

	public simulateLeftClick(pointerX, pointerY, keyboardButton?: KeyboardButton) {
		this.simulate("down", pointerX, pointerY, undefined, keyboardButton);
		this.simulate("up", pointerX, pointerY, undefined, keyboardButton);
	}

	public simulateRightClick(pointerX, pointerY, mouseButton?: MouseButton) {
		this.simulate("down", pointerX, pointerY, undefined, undefined, mouseButton);
		this.simulate("up", pointerX, pointerY, undefined, undefined, mouseButton);
	}

	public simulateDrag(startX, startY, endX, endY) {
		this.simulate("down", startX, startY);
		this.simulate("move", endX, endY);
		this.simulate("up", endX, endY);
	}

	public simulate(eventName: string, pointerX: number, pointerY: number, zoom?: number,
		keyboardButton?: KeyboardButton, mouseButton?: MouseButton): void {
		pointerX += this._element.getBoundingClientRect().left;
		pointerY += this._element.getBoundingClientRect().top;

		let oEvent: WheelEvent | PointerEvent | MouseEvent;
		let prefix: string = "";

		if (eventName === "wheel") {
			oEvent = new WheelEvent("wheel", {
				deltaX: 0,
				deltaY: zoom,
				deltaZ: 0,
				clientX: pointerX,
				clientY: pointerY,
				altKey: keyboardButton === KeyboardButton.ALT,
				ctrlKey: keyboardButton === KeyboardButton.CTRL,
				shiftKey: keyboardButton === KeyboardButton.SHIFT
			});
		}
		else if (typeof PointerEvent !== "undefined") {

			if (eventName !== "dblclick") {
				prefix = "pointer";
			}

			oEvent = new PointerEvent(prefix + eventName, {
				pointerId: 1,
				bubbles: true,
				cancelable: true,
				clientX: pointerX,
				clientY: pointerY,
				isPrimary: true,
				altKey: keyboardButton === KeyboardButton.ALT,
				ctrlKey: keyboardButton === KeyboardButton.CTRL,
				shiftKey: keyboardButton === KeyboardButton.SHIFT,
				button: mouseButton === MouseButton.RIGHT ? MouseButton.RIGHT : undefined
			});
		} else {
			if (eventName !== "dblclick") {
				prefix = "mouse";
			}

			oEvent = new MouseEvent(prefix + eventName, {
				bubbles: true,
				cancelable: true,
				clientX: pointerX,
				clientY: pointerY,
				altKey: keyboardButton === KeyboardButton.ALT,
				ctrlKey: keyboardButton === KeyboardButton.CTRL,
				shiftKey: keyboardButton === KeyboardButton.SHIFT,
				button: mouseButton === MouseButton.RIGHT ? MouseButton.RIGHT : undefined
			});
		}

		this._element.dispatchEvent(oEvent);
	}
}