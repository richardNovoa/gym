import React from 'react';
import { useParams } from 'react-router-dom';
import WorkoutExerciseRow from './WorkoutExerciseRow';

const WorkoutPage = ({ exercise, sets }) => {
  const { id } = useParams();
  return (
    <div>
      <div className='text-black'>{exercise.name}</div>
      <div>
        {sets.map((set) => (
          <WorkoutExerciseRow
            previous={set.previous}
            reps={set.reps}
            weight={set.weight}
            isChecked={set.isChecked}
            key={set._id}
          />
        ))}
      </div>
    </div>
  );
};
{
  /* {exercises.map((exercise) => (
        <WorkoutExercise
          sets={exercise.sets}
          exercise={exercise.exercise}
          key={exercise._id}
        />
      ))} */
}
export default WorkoutPage;
