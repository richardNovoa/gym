import { describe, expect, it } from 'vitest'
import { exerciseMatches, filterExercises } from './search'

const curl = {
  name: 'Barbell Curl',
  equipment: 'barbell',
  primary_muscles: ['biceps'],
  secondary_muscles: ['forearms'],
  owner_id: null,
}

describe('exercise search', () => {
  it('matches name, muscle, or equipment without caring about case', () => {
    expect(exerciseMatches(curl, 'CURL')).toBe(true)
    expect(exerciseMatches(curl, 'Biceps')).toBe(true)
    expect(exerciseMatches(curl, 'BARBELL')).toBe(true)
    expect(exerciseMatches(curl, 'forearms')).toBe(true)
    expect(exerciseMatches(curl, 'legs')).toBe(false)
    expect(exerciseMatches(curl, '   ')).toBe(true)
  })

  it('floats your own exercises when the query is empty', () => {
    const rows = filterExercises(
      [
        curl,
        { ...curl, name: 'Cable Curl', owner_id: 'me' },
        { ...curl, name: 'Hammer Curl', owner_id: null },
      ],
      '',
      'me',
    )
    expect(rows.map((row) => row.name)).toEqual(['Cable Curl', 'Barbell Curl', 'Hammer Curl'])
  })
})
