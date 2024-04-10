import React from 'react';
import { Link } from 'react-router-dom';
import WorkoutExerciseRow from './WorkoutExerciseRow';

const WorkoutCard = ({ name, exercises, id }) => {
  return (
    <Link to={`/workouts/${id}`}>
      <div className='flex flex-col rounded-lg bg-zinc-100 h-32 w-40 p-2'>
        <h1 className='font-semibold'>{name}</h1>
        <div className='mt-2'>
          {exercises.map((exercise) => (
            <span className='text-sm'>{exercise.exercise.name}</span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default WorkoutCard;
