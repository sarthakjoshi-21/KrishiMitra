/** Maps a farmer name/ID to the canonical email stored in Supabase.
 *  Convention: <normalised_name>@farmer.krishimitra.in
 *  e.g. "Ramesh Patil" → "ramesh.patil@farmer.krishimitra.in"
 */
export function toFarmerEmail(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '') + '@farmer.krishimitra.in'
  )
}
