import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import WorkoutCard from './WorkoutCard';
import { getWorkouts } from '../../../events/workout';

const AllWorkouts = () => {
  const dispatch = useDispatch();
  const workouts = useSelector((state) => state.workouts.workouts); // Access exercises from state

  React.useEffect(() => {
    dispatch(getWorkouts()); // Fetch exercises on component mount
  }, [dispatch]);
  return (
    <div className='text-lg'>
      <h1 className='pl-6 mt-10'>Folder</h1>
      <div className='w-96 h-96 p-4 gap-4 flex flex-wrap '>
        {workouts.map((workout) => (
          <WorkoutCard
            key={workout._id}
            id={workout._id}
            name={workout.name}
            exercises={workout.exercises}
          />
        ))}
      </div>
    </div>
  );
};

export default AllWorkouts;
