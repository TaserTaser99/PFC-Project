import serverless from 'serverless-http'

let initPromise = (async () => {
	try {
		const mod = await import('../dist/server.js')
		if (!mod || !mod.app) throw new Error('Missing exported `app` from dist/server.js')
		return serverless(mod.app)
	} catch (err) {
		console.error('Failed to initialize serverless handler:', err)
		throw err
	}
})()

export default async function handler(req, res) {
	let fn
	try {
		fn = await initPromise
	} catch (err) {
		console.error('Initialization error during function invocation:', err)
		res.statusCode = 500
		res.end('internal_server_error')
		return
	}

	try {
		return fn(req, res)
	} catch (err) {
		console.error('Handler invocation error:', err)
		try {
			res.statusCode = 500
			res.end('internal_server_error')
		} catch (e) {
			// ignore
		}
	}
}
