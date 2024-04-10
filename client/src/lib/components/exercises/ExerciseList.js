import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getExercises } from '../../../events/exercise';
import ExerciseCard from './ExerciseCard';

const ExerciseList = () => {
  const dispatch = useDispatch();
  const exercises = useSelector((state) => state.exercises.exercises); // Access exercises from state

  React.useEffect(() => {
    dispatch(getExercises()); // Fetch exercises on component mount
  }, [dispatch]);

  return (
    <div>
      {exercises.length > 0 ? (
        exercises.map((exercise) => (
          <ExerciseCard exercise={exercise} key={exercise._id} />
        ))
      ) : (
        <p>Loading exercises...</p> // Display loading message while fetching
      )}
    </div>
  );
};

export default ExerciseList;
