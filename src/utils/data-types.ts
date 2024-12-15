export type AnalysisObjectType = {
  german: { wins: number; losses: number }
  american: { wins: number; losses: number }
  dak: { wins: number; losses: number }
  british: { wins: number; losses: number }
  matchCount: number
  gameTime: number
  gameTimeSpread: Record<string, number>
  maps: Record<string, number>
  factionMatrix: Record<string, { wins: number; losses: number }>
}

export type MapAnalysisObjectType = Record<string, AnalysisObjectType>

export interface MapStatsDataObject {
  "1v1": MapAnalysisObjectType
  "2v2": MapAnalysisObjectType
  "3v3": MapAnalysisObjectType
  "4v4": MapAnalysisObjectType
}

export interface MapStatsDataType {
  latestPatchInfo: {
    from: string
    to: string
    value: string
    label: string
    group: string
  }
  mapStats: {
    analysis: MapStatsDataObject
    fromTimeStampSeconds: number
    toTimeStampSeconds: number
    type: "mapStats"
    wasMissingData: boolean
    filters?: Array<string>
  }
  mapInfo: Record<
    string,
    {
      name: string
    }
  >
}
