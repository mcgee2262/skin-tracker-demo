export interface Challenge {
  id: string
  start_date: string
  length_days: number
}

export interface Checkin {
  id: string
  challenge_id: string
  check_date: string
  day_number: number
  photo_path: string | null
  spot_count: number
  am_done: boolean
  pm_done: boolean
  differin_night: boolean
  score: number | null
  tags: string[]
}

export interface Spot {
  x: number
  y: number
}

export type ProductStatus = 'not_purchased' | 'purchased' | 'running_low' | 'unknown'

export interface Product {
  id: string
  house: 'mom' | 'dad'
  name: string
  use_note: string | null
  price_text: string | null
  url: string | null
  status: ProductStatus
  sort: number
}
