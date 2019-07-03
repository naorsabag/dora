export class HttpUtils {
	public static get(url: string): Promise<any> {
		return new Promise((resolve, reject) => {
			let serverDefsReq = new XMLHttpRequest();

			serverDefsReq.open("GET", url, true);
			serverDefsReq.onload = () => {
				if (serverDefsReq.status !== 200) {
					throw new DOMException("Failed to get data from server");
				} else {
					resolve(serverDefsReq.responseText);
				}
			};
			serverDefsReq.onerror = () => reject(new DOMException("Failed to get data from server"));

			serverDefsReq.send(null);
		});
	}
}