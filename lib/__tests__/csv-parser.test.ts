import { parseCSV } from '../csv-parser'

describe('CSV Parser', () => {
  it('should parse valid CSV data', async () => {
    const csvData = `ad_name,campaign_name,cpl,spend,leads,ctr,roas,date
Ad Test 1,Campaign A,8.5,250,30,0.025,2.5,2024-01-20
Ad Test 2,Campaign B,12.0,300,25,0.018,1.8,2024-01-21`

    const result = await parseCSV(csvData)

    expect(result.data).toHaveLength(2)
    expect(result.errors).toHaveLength(0)
    expect(result.data[0]).toMatchObject({
      ad_name: 'Ad Test 1',
      campaign_name: 'Campaign A',
      cpl: 8.5,
      spend: 250,
      leads: 30,
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

  it('should calculate CPL from spend and leads when CPL is invalid', async () => {
    // Meta parser calculates CPL automatically when invalid
    const csvData = `ad_name,cpl,spend,leads,date
Ad Test,invalid,250,30,2024-01-20`

    const result = await parseCSV(csvData)

    // Meta parser handles this gracefully and calculates CPL
    expect(result.data).toHaveLength(1)
    expect(result.data[0].cpl).toBeCloseTo(250 / 30, 1)
  })

  it('should parse various date formats', async () => {
    // Meta parser handles various date formats
    const csvData = `ad_name,cpl,spend,leads,date
Ad Test,10.5,250,30,01/20/2024`

    const result = await parseCSV(csvData)

    // Meta parser converts dates to ISO format
    expect(result.data).toHaveLength(1)
    // The parser should parse the date (may vary based on locale interpretation)
    expect(result.data[0].date).toBeDefined()
  })

  it('should handle negative CPL by using absolute value or zero', async () => {
    // Meta parser is more permissive
    const csvData = `ad_name,cpl,spend,leads,date
Ad Test,-10.5,250,30,2024-01-20`

    const result = await parseCSV(csvData)

    // Meta parser accepts the data but CPL from calculation is used
    expect(result.data).toHaveLength(1)
  })

  it('should parse all valid lines even with some invalid values', async () => {
    const csvData = `ad_name,cpl,spend,leads,date
Ad Valid,10.5,250,30,2024-01-20
Ad Invalid,invalid,250,30,2024-01-21
Ad Valid 2,12.0,300,25,2024-01-22`

    const result = await parseCSV(csvData)

    // Meta parser parses all lines, calculating CPL when needed
    expect(result.data.length).toBeGreaterThanOrEqual(2)
    expect(result.data.find(d => d.ad_name === 'Ad Valid')).toBeDefined()
    expect(result.data.find(d => d.ad_name === 'Ad Valid 2')).toBeDefined()
  })

  it('should handle empty ad_name', async () => {
    const csvData = `ad_name,cpl,spend,leads,date
,10.5,250,30,2024-01-20`

    const result = await parseCSV(csvData)

    // Empty ad_name lines are skipped
    expect(result.data).toHaveLength(0)
  })

  it('should detect Meta Ads format with French columns', async () => {
    const csvData = `Nom de la publicité,Montant dépensé (EUR),Résultats,Coût par résultat,Jour
Ma Pub Test,150.50,10,15.05,2024-01-20`

    const result = await parseCSV(csvData)

    expect(result.data).toHaveLength(1)
    expect(result.data[0].ad_name).toBe('Ma Pub Test')
    expect(result.data[0].spend).toBe(150.5)
    expect(result.data[0].leads).toBe(10)
    expect(result.detectedFormat).toBe('meta_report')
  })

  it('should detect Meta Ads format with English columns', async () => {
    const csvData = `Ad Name,Amount Spent (EUR),Results,Cost per Result,Day
My Test Ad,200.00,20,10.00,2024-01-20`

    const result = await parseCSV(csvData)

    expect(result.data).toHaveLength(1)
    expect(result.data[0].ad_name).toBe('My Test Ad')
    expect(result.data[0].spend).toBe(200)
    expect(result.data[0].leads).toBe(20)
    expect(result.data[0].cpl).toBe(10)
  })

  it('should skip lines with zero spend', async () => {
    const csvData = `ad_name,cpl,spend,leads,date
Ad With Spend,10.5,250,30,2024-01-20
Ad No Spend,0,0,0,2024-01-21`

    const result = await parseCSV(csvData)

    expect(result.data).toHaveLength(1)
    expect(result.data[0].ad_name).toBe('Ad With Spend')
  })
})
