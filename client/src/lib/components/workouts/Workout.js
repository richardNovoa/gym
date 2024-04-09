import React from 'react';
import WorkoutExercise from './WorkoutExercise';

const Workout = ({ exercises }) => {
  return (
    <div>
      {exercises.map((exercise) => (
        <WorkoutExercise sets={exercise.sets} exercise={exercise.exercise} />
      ))}
    </div>
  );
};

export default Workout;
