import { spawn } from 'child_process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Start Prisma Studio
console.log('Starting Prisma Studio on port 5555...')
console.log('Access it at: http://localhost:5555')

const studio = spawn('npx', ['prisma', 'studio', '--port', '5555', '--browser', 'none'], {
  stdio: 'inherit',
  shell: true,
})

studio.on('error', (error) => {
  console.error('Error starting Prisma Studio:', error)
  process.exit(1)
})

studio.on('exit', (code) => {
  console.log(`Prisma Studio exited with code ${code}`)
  process.exit(code || 0)
})

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\nShutting down Prisma Studio...')
  studio.kill()
  prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\nShutting down Prisma Studio...')
  studio.kill()
  prisma.$disconnect()
  process.exit(0)
})
