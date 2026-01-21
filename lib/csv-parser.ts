import Papa from 'papaparse'

export interface AdRow {
  ad_name: string
  campaign_name?: string
  angle?: string
  cpl: number
  spend: number
  leads: number
  ctr?: number
  roas?: number
  date: string
}

export function parseCSV(csvText: string): Promise<AdRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: {
        cpl: true,
        spend: true,
        leads: true,
        ctr: true,
        roas: true,
      },
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[]
        
        // Clean & validate
        const cleaned = data
          .filter(row => row.ad_name && row.cpl && row.spend && row.leads)
          .map(row => ({
            ad_name: row.ad_name.trim(),
            campaign_name: row.campaign_name?.trim() || undefined,
            angle: row.angle?.trim() || undefined,
            cpl: parseFloat(row.cpl) || 0,
            spend: parseFloat(row.spend) || 0,
            leads: parseInt(row.leads) || 0,
            ctr: row.ctr ? parseFloat(row.ctr) : undefined,
            roas: row.roas ? parseFloat(row.roas) : undefined,
            date: row.date?.trim() || new Date().toISOString().split('T')[0],
          }))

        resolve(cleaned)
      },
      error: (error : Error) => reject(error),
    })
  })
}