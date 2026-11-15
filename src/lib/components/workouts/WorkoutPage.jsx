import React from 'react';
import ExerciseRow from '../exercises/ExerciseRow';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getWorkoutById } from '../../../events/workout';

const WorkoutPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const workout = useSelector((state) => state.workouts.workout);

  React.useEffect(() => {
    dispatch(getWorkoutById(id));
  }, [dispatch, id]);

  return (
    <div>
      {workout ? (
        <WorkoutContent name={workout.name} exercises={workout.exercises} />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

const WorkoutContent = ({ name, exercises }) => {
  return (
    <div>
      <div>{name}</div>
      {exercises.map((exercise) => (
        <ExerciseGroup exercise={exercise.exercise} sets={exercise.sets} />
      ))}
    </div>
  );
};

const ExerciseGroup = ({ exercise, sets }) => {
  return (
    <div>
      <div>{exercise.name}</div>
      {sets.map((set) => (
        <ExerciseRow
          previous={set.previous}
          reps={set.reps}
          weight={set.weight}
          isChecked={set.isChecked}
        />
      ))}
    </div>
  );
};

export default WorkoutPage;
