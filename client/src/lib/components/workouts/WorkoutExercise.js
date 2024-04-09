import React from 'react';
import WorkoutExerciseRow from './WorkoutExerciseRow';

const WorkoutExercise = ({ exercise, sets }) => {
  return (
    <div>
      <div>{exercise.name}</div>
      {sets.map((set) => (
        <WorkoutExerciseRow
          previous={set.previous}
          reps={set.reps}
          weight={set.weight}
          isChecked={set.isChecked}
        />
      ))}
    </div>
  );
};

export default WorkoutExercise;
