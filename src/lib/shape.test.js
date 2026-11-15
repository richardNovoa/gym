import { describe, expect, it } from 'vitest';
import { toExercise, toWorkout } from './shape';

describe('supabase rows for the original screens', () => {
  it('keeps the exercise fields the cards already read', () => {
    expect(
      toExercise({
        id: 'ex-1',
        name: 'Barbell Curl',
        equipment: 'barbell',
        primary_muscles: ['biceps'],
        secondary_muscles: ['forearms'],
        category: 'strength',
        force: 'pull',
        level: 'beginner',
        mechanic: 'isolation',
        instructions: ['Stand up.']
      })
    ).toEqual({
      _id: 'ex-1',
      name: 'Barbell Curl',
      equipment: 'barbell',
      primaryMuscles: ['biceps'],
      secondaryMuscles: ['forearms'],
      category: 'strength',
      force: 'pull',
      level: 'beginner',
      mechanic: 'isolation',
      instructions: ['Stand up.']
    });
  });

  it('nests exercises and sets in the workout page shape', () => {
    const workout = toWorkout({
      id: 'wo-1',
      name: 'Push',
      workout_exercises: [
        {
          id: 'we-2',
          position: 1,
          exercise: { id: 'ex-2', name: 'Dip', primary_muscles: ['triceps'] },
          sets: [{ id: 's-3', position: 0, reps: 8, weight: '0', completed: false }]
        },
        {
          id: 'we-1',
          position: 0,
          exercise: { id: 'ex-1', name: 'Bench Press', primary_muscles: ['chest'] },
          sets: [
            { id: 's-2', position: 1, reps: null, weight: '135.00', completed: true },
            { id: 's-1', position: 0, reps: 12, weight: 95, completed: false }
          ]
        }
      ]
    });

    expect(workout._id).toBe('wo-1');
    expect(workout.exercises.map((item) => item.exercise.name)).toEqual(['Bench Press', 'Dip']);
    expect(workout.exercises[0].sets).toEqual([
      { _id: 's-1', reps: '12', weight: '95', isChecked: false },
      { _id: 's-2', reps: '', weight: '135', isChecked: true }
    ]);
  });
});
