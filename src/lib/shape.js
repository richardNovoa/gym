function one(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function asNumberString(value) {
  if (value == null || value === '') return '';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '';
  return String(parsed);
}

export function toExercise(row) {
  if (!row || !row.id) return null;
  return {
    _id: row.id,
    name: row.name ?? '',
    force: row.force ?? null,
    level: row.level ?? null,
    mechanic: row.mechanic ?? null,
    equipment: row.equipment ?? null,
    primaryMuscles: row.primary_muscles ?? [],
    secondaryMuscles: row.secondary_muscles ?? [],
    instructions: row.instructions ?? [],
    category: row.category ?? null
  };
}

export function toWorkout(row) {
  if (!row || !row.id) return null;
  const groups = Array.isArray(row.workout_exercises) ? row.workout_exercises : [];
  const exercises = groups
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((group) => {
      const exercise = toExercise(one(group.exercise));
      const sets = (Array.isArray(group.sets) ? group.sets : [])
        .slice()
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((set) => ({
          _id: set.id,
          reps: asNumberString(set.reps),
          weight: asNumberString(set.weight),
          isChecked: set.completed === true
        }));
      return {
        _id: group.id,
        exercise: exercise ?? { _id: group.id, name: '' },
        sets
      };
    });

  return {
    _id: row.id,
    name: row.name ?? '',
    exercises
  };
}
