import React from 'react';

const WorkoutExerciseRow = ({ previous, reps, weight, isChecked }) => {
  return (
    <div className='flex gap-4'>
      <div>{previous}</div>
      <div>
        <input
          type='text'
          className='bg-gray-200 w-8 px-2'
          placeholder='0'
          value={reps}
        />
      </div>
      <div>
        <input
          type='text'
          className='bg-gray-200 w-16 px-2'
          placeholder='0'
          value={weight}
        />
      </div>
      <div>
        <input
          type='checkbox'
          className='bg-gray-200 w-6 px-2'
          placeholder='0'
          value={isChecked}
        />
      </div>
    </div>
  );
};

export default WorkoutExerciseRow;
