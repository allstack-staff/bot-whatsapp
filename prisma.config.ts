import { defineConfig } from '@prisma/config'
import * as dotenv from 'dotenv'

dotenv.config()

const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'

export default defineConfig({
    datasource: {
        url: databaseUrl,
    },
})
