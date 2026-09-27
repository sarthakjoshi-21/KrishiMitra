/** Helper to generate fallback email if needed for legacy compatibility */
export function toFarmerEmail(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '') + '@farmer.krishimitra.in'
  )
}
