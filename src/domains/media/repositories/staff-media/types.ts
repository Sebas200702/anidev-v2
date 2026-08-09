/**
 * @module domains/media/repositories/staff-media/types
 * @remarks Parameter shapes for staff media repository queries.
 */

/** Parameters for filtering staff media by entity ID and media type. */
export interface GetStaffMediaByTypeParams {
  mediaType: string
  staffId: number
}
