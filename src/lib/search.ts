export interface SearchableExercise {
  name: string
  equipment?: string | null
  primary_muscles?: string[] | null
  secondary_muscles?: string[] | null
  owner_id?: string | null
}

export function exerciseMatches(exercise: SearchableExercise, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const haystack = [
    exercise.name,
    exercise.equipment ?? '',
    ...(exercise.primary_muscles ?? []),
    ...(exercise.secondary_muscles ?? []),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(needle)
}

export function filterExercises<T extends SearchableExercise>(
  exercises: T[],
  query: string,
  userId?: string | null,
): T[] {
  return exercises
    .filter((exercise) => exerciseMatches(exercise, query))
    .sort((a, b) => {
      if (!query.trim() && userId) {
        const aOwn = a.owner_id === userId ? 0 : 1
        const bOwn = b.owner_id === userId ? 0 : 1
        if (aOwn !== bOwn) return aOwn - bOwn
      }
      return a.name.localeCompare(b.name)
    })
}
