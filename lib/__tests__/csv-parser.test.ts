import { parseCSV } from '../csv-parser'

describe('CSV Parser', () => {
  it('should parse valid CSV data', async () => {
    const csvData = `ad_name,campaign_name,angle,cpl,spend,leads,ctr,roas,date
Ad Test 1,Campaign A,PROBLEME,8.5,250,30,0.025,2.5,2024-01-20
Ad Test 2,Campaign B,MECANISME,12.0,300,25,0.018,1.8,2024-01-21`

    const result = await parseCSV(csvData)

    expect(result.data).toHaveLength(2)
    expect(result.errors).toHaveLength(0)
    expect(result.data[0]).toMatchObject({
      ad_name: 'Ad Test 1',
      campaign_name: 'Campaign A',
      angle: 'PROBLEME',
      cpl: 8.5,
      spend: 250,
      leads: 30,
      ctr: 0.025,
      roas: 2.5,
      date: '2024-01-20',
    })
  })

  it('should handle missing optional fields', async () => {
    const csvData = `ad_name,cpl,spend,leads,date
Ad Test,10.5,200,20,2024-01-20`

    const result = await parseCSV(csvData)

    expect(result.data).toHaveLength(1)
    expect(result.errors).toHaveLength(0)
    expect(result.data[0]).toMatchObject({
      ad_name: 'Ad Test',
      cpl: 10.5,
      spend: 200,
      leads: 20,
      date: '2024-01-20',
    })
    expect(result.data[0].campaign_name).toBeUndefined()
    expect(result.data[0].angle).toBeUndefined()
  })

  it('should throw error for missing required columns', async () => {
    const csvData = `ad_name,cpl
Ad Test,10.5`

    await expect(parseCSV(csvData)).rejects.toThrow(/Colonnes manquantes/)
  })

  it('should parse numbers correctly', async () => {
    const csvData = `ad_name,cpl,spend,leads,date
Ad Test,10.50,250.00,30,2024-01-20`

    const result = await parseCSV(csvData)

    expect(result.data[0].cpl).toBe(10.5)
    expect(result.data[0].spend).toBe(250)
    expect(result.data[0].leads).toBe(30)
  })

  it('should validate date format', async () => {
    const csvData = `ad_name,cpl,spend,leads,date
Ad Test,10.5,250,30,2024-01-20`

    const result = await parseCSV(csvData)

    expect(result.data[0].date).toBe('2024-01-20')
    expect(result.errors).toHaveLength(0)
  })

  it('should detect invalid CPL values', async () => {
    const csvData = `ad_name,cpl,spend,leads,date
Ad Test,invalid,250,30,2024-01-20`

    const result = await parseCSV(csvData)

    expect(result.data).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].field).toBe('cpl')
    expect(result.errors[0].message).toContain('CPL invalide')
  })

  it('should detect invalid date format', async () => {
    const csvData = `ad_name,cpl,spend,leads,date
Ad Test,10.5,250,30,01/20/2024`

    const result = await parseCSV(csvData)

    expect(result.data).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].field).toBe('date')
    expect(result.errors[0].message).toContain('Date invalide')
  })

  it('should detect negative values', async () => {
    const csvData = `ad_name,cpl,spend,leads,date
Ad Test,-10.5,250,30,2024-01-20`

    const result = await parseCSV(csvData)

    expect(result.data).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].message).toContain('nombre positif')
  })

  it('should generate corrected CSV when there are partial errors', async () => {
    const csvData = `ad_name,cpl,spend,leads,date
Ad Valid,10.5,250,30,2024-01-20
Ad Invalid,invalid,250,30,2024-01-21
Ad Valid 2,12.0,300,25,2024-01-22`

    const result = await parseCSV(csvData)

    expect(result.data).toHaveLength(2)
    expect(result.errors).toHaveLength(1)
    expect(result.correctedCSV).toBeDefined()
    expect(result.correctedCSV).toContain('Ad Valid')
    expect(result.correctedCSV).toContain('Ad Valid 2')
  })

  it('should track line numbers in errors', async () => {
    const csvData = `ad_name,cpl,spend,leads,date
Ad Test 1,10.5,250,30,2024-01-20
Ad Test 2,invalid,250,30,2024-01-21
Ad Test 3,12.0,250,30,2024-01-22`

    const result = await parseCSV(csvData)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].line).toBe(3) // Line 3 because line 1 is headers
  })

  it('should handle empty ad_name', async () => {
    const csvData = `ad_name,cpl,spend,leads,date
,10.5,250,30,2024-01-20`

    const result = await parseCSV(csvData)

    expect(result.data).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].field).toBe('ad_name')
  })
})
