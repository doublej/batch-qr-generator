import Papa from 'papaparse'

export interface CSVData {
  headers: string[]
  rows: Record<string, string>[]
  hasCustomHeaders?: boolean
}

export function parseCSV(file: File, firstRowIsHeader: boolean): Promise<CSVData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: firstRowIsHeader,
      skipEmptyLines: true,
      complete: (results) => {
        let headers: string[]
        let rows: Record<string, string>[]

        if (firstRowIsHeader) {
          if (!results.meta.fields || results.meta.fields.length === 0) {
            reject(new Error('No headers found in CSV'))
            return
          }
          headers = results.meta.fields
          rows = results.data as Record<string, string>[]
        } else {
          const rawRows = results.data as string[][]
          if (rawRows.length === 0) {
            reject(new Error('No data rows found in CSV'))
            return
          }

          const columnCount = rawRows[0].length
          headers = Array.from({ length: columnCount }, (_, i) => `col_${i + 1}`)

          rows = rawRows.map(row => {
            const obj: Record<string, string> = {}
            headers.forEach((header, idx) => {
              obj[header] = row[idx] || ''
            })
            return obj
          })
        }

        if (rows.length === 0) {
          reject(new Error('No data rows found in CSV'))
          return
        }

        resolve({ headers, rows, hasCustomHeaders: !firstRowIsHeader })
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
  totalRows?: number,
  urlEncode: boolean = false
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
    const rawValue = allVariables[variableName] || ''
    const value = urlEncode ? encodeURIComponent(rawValue) : rawValue
    result = result.replace(`{${variableName}}`, value)
  }

  return result
}

export function extractVariablesFromPattern(pattern: string): string[] {
  const variablePattern = /\{([^}]+)\}/g
  const matches = Array.from(pattern.matchAll(variablePattern))
  return matches.map(m => m[1])
}

export interface ValidationResult {
  valid: boolean
  missingVariables: string[]
  rowsWithMissingData: Array<{ rowIndex: number; missingFields: string[] }>
}

export function validatePatterns(
  urlPattern: string,
  labelPattern: string,
  csvData: { headers: string[]; rows: Record<string, string>[] }
): ValidationResult {
  const builtInVars = ['_row', '_index', '_row_reverse', '_total', '_date', '_timestamp']
  const availableFields = [...csvData.headers, ...builtInVars]

  const urlVariables = extractVariablesFromPattern(urlPattern)
  const labelVariables = extractVariablesFromPattern(labelPattern)
  const allVariables = [...new Set([...urlVariables, ...labelVariables])]

  // Check for undefined variables
  const missingVariables = allVariables.filter(v => !availableFields.includes(v))

  // Check for rows with empty/missing data
  const dataVariables = allVariables.filter(v => !builtInVars.includes(v))
  const rowsWithMissingData: Array<{ rowIndex: number; missingFields: string[] }> = []

  csvData.rows.forEach((row, index) => {
    const missingFields = dataVariables.filter(v => !row[v] || row[v].trim() === '')
    if (missingFields.length > 0) {
      rowsWithMissingData.push({ rowIndex: index, missingFields })
    }
  })

  return {
    valid: missingVariables.length === 0 && rowsWithMissingData.length === 0,
    missingVariables,
    rowsWithMissingData
  }
}
