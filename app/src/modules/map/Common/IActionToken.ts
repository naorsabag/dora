export interface IActionToken {
	cancel?: () => void;
	finish?: () => void;
}