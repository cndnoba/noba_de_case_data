const jsonServer = require('json-server')
const { readFileSync, readdirSync } = require('fs')
const { join } = require('path')

const server = jsonServer.create()

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  const parseLine = (line) => {
    const result = [], len = line.length
    let current = '', inQuotes = false

    for (let i = 0; i < len; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else current += char
    }
    result.push(current)
    return result
  }

  const headers = parseLine(lines[0]).map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = parseLine(line)
    const row = {}
    headers.forEach((h, i) => {
      const v = values[i]?.trim() || ''
      const n = Number(v)
      row[h] = !isNaN(n) && v !== '' ? n : v
    })
    return row
  })
}

// Load all CSV files from data folder
const dataDir = join(__dirname, '..', 'data')
const db = {}

readdirSync(dataDir)
  .filter(f => f.endsWith('.csv'))
  .forEach(file => {
    const table = file.replace('.csv', '')
    db[table] = parseCSV(readFileSync(join(dataDir, file), 'utf8'))
  })

server.use(jsonServer.defaults())
server.use(jsonServer.router(db))

module.exports = server