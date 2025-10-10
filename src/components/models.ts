export interface Offering {
  $id: string
  value: number
  factorId: string
  serieId: string
}

export interface Serie {
  $id: string
  business: string
  color: string
  dash: string
  symbol: string
}

export interface Factor {
  $id: string
  name: string
}

export interface Chart {
  $id: string
  title: string
  description: string
  series: string[]
  factors: string[]
  editCode: string
}

export interface BMCanvas {
  $id: string
  title: string
  description: string
  notes: string[]
  logoColor: string
  logoImage: string // todo migrate as media
  // dates created updated?
  // Game data
  isGame?: boolean
  gameCompleted?: Date
  gameNbChecks?: number
}

// todo determine what is not synced?
export interface BMCNote {
  $id: string
  left: number
  top: number
  listLeft: number
  listTop: number
  angle: number
  height: number
  type: string
  text: string
  description: string
  colors: number[]
  image: string // todo migrate as media
  parent: string
  calcId: string
  values: Record<string, unknown>
  calcDisplayR?: string
  calcDisplayG?: string
  calcDisplayB?: string
  showLabel: boolean
  showAsSticky: boolean
  hidden: boolean
  children: string[]
}
