export type Restaurant = {
  restaurantId: number
  name: string
  address: string
  postalCode: string
  city: string
  phoneNumber: string
  siret: string
  nafCode: string | null
  pin: string
  logoUrl: string | null
}

export type CreateRestaurantRequest = {
  name: string
  address: string
  postalCode: string
  city: string
  phoneNumber: string
  siret: string
  pin: string
}

export type CreateRestaurantResponse = {
  id: number
  name: string
  address: string
  postalCode: string
  city: string
  phoneNumber: string
  siret: string
  pin: string
}
