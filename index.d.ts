import {ServerResponse, IncomingMessage} from "http"

declare module 'node-http-proxy-json' {
	/**
	 * Modify the response of json
	 * @param res {Response} The http response
	 * @param proxyRes {proxyRes|String} String: The http header content-encoding: gzip/deflate
	 * @param callback {Function} Custom modified logic
	 */
	export default function modifyResponse (
		res: ServerResponse,
		proxyRes: IncomingMessage | String | undefined,
		callback: (body: any) => any
	): null
}
