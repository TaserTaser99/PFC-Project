import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { router } from './routes.js'

const app = express()
app.use(cors())
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicPath = path.resolve(__dirname, '../public')

app.use(express.static(publicPath))
app.use('/api', router)

app.get('/', (_, res) => {
  res.sendFile(path.join(publicPath, 'index.html'))
})

const port = Number(process.env.PORT ?? 3002)
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
