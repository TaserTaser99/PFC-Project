import serverless from 'serverless-http'
import { app } from '../src/server.ts'

const handler = serverless(app)
export default handler
