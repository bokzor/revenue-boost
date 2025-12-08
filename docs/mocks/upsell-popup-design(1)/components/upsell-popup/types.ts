export interface Product {
  id: string
  name: string
  description: string
  image: string
  originalPrice: number
  salePrice: number
  badge?: string
  rating?: number
  reviewCount?: number
  features?: string[]
}

export interface UpsellPopupProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onAccept: (product: Product) => void
  onDecline: () => void
  currency?: string
}
