import Papa from 'papaparse'

export interface CSVData {
  headers: string[]
  rows: Record<string, string>[]
  hasCustomHeaders: boolean
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
  options?: {
    encodeValues?: boolean
    booleanMapping?: 'preserve' | 'numeric' | 'omit'
  }
): string {
  const { encodeValues = true, booleanMapping = 'preserve' } = options || {}
  let result = pattern

  const builtIns = rowIndex !== undefined && totalRows !== undefined
    ? getBuiltInVariables(rowIndex, totalRows)
    : {}

  const allVariables: Record<string, string> = { ...row, ...builtIns }

  const variablePattern = /\{([^}]+)\}/g
  const matches = pattern.matchAll(variablePattern)

  for (const match of matches) {
    const variableName = match[1]
    let value = allVariables[variableName] || ''

    // Handle boolean mapping
    if (booleanMapping !== 'preserve') {
      const lowerValue = value.toLowerCase()
      if (lowerValue === 'true' || lowerValue === 'false') {
        if (booleanMapping === 'numeric') {
          value = lowerValue === 'true' ? '1' : '0'
        } else if (booleanMapping === 'omit' && lowerValue === 'false') {
          value = ''
        }
      }
    }

    // Apply URL encoding if requested
    if (encodeValues && value) {
      value = encodeURIComponent(value)
    }

    result = result.replace(`{${variableName}}`, value)
  }

  return result
}

export function extractVariablesFromPattern(pattern: string): string[] {
  const variablePattern = /\{([^}]+)\}/g
  const matches = Array.from(pattern.matchAll(variablePattern))
  return matches.map(m => m[1])
}
