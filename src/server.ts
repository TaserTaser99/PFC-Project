import express from 'express'
import cors from 'cors'
import { router } from './routes.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api', router)

app.get('/', (_, res) => {
  res.send('PFC Course Advisor API')
})

const port = Number(process.env.PORT ?? 4000)
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
