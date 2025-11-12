import Papa from 'papaparse'

export interface CSVData {
  headers: string[]
  rows: Record<string, string>[]
}

export function parseCSV(file: File): Promise<CSVData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.meta.fields || results.meta.fields.length === 0) {
          reject(new Error('No headers found in CSV'))
          return
        }

        const headers = results.meta.fields
        const rows = results.data as Record<string, string>[]

        if (rows.length === 0) {
          reject(new Error('No data rows found in CSV'))
          return
        }

        resolve({ headers, rows })
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`))
      }
    })
  })
}

export interface BuiltInVariables {
  _row: string
  _index: string
  _row_reverse: string
  _total: string
  _date: string
  _timestamp: string
}

export function getBuiltInVariables(rowIndex: number, totalRows: number): BuiltInVariables {
  const now = new Date()
  return {
    _row: String(rowIndex + 1),
    _index: String(rowIndex),
    _row_reverse: String(totalRows - rowIndex),
    _total: String(totalRows),
    _date: now.toISOString().split('T')[0],
    _timestamp: String(now.getTime())
  }
}

export function replaceVariables(
  pattern: string,
  row: Record<string, string>,
  rowIndex?: number,
  totalRows?: number
): string {
  let result = pattern

  const builtIns = rowIndex !== undefined && totalRows !== undefined
    ? getBuiltInVariables(rowIndex, totalRows)
    : {}

  const allVariables = { ...row, ...builtIns }

  const variablePattern = /\{([^}]+)\}/g
  const matches = pattern.matchAll(variablePattern)

  for (const match of matches) {
    const variableName = match[1]
    const value = allVariables[variableName] || ''
    result = result.replace(`{${variableName}}`, value)
  }

  return result
}

export function extractVariablesFromPattern(pattern: string): string[] {
  const variablePattern = /\{([^}]+)\}/g
  const matches = Array.from(pattern.matchAll(variablePattern))
  return matches.map(m => m[1])
}
