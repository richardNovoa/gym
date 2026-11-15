import React from 'react';

const ExerciseCard = ({ exercise }) => {
  const slug = exercise.name.replace(/ /g, '_');
  return (
    <div className='flex text-left'>
      <img
        src={`https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/${slug}/images/0.jpg`}
        className='w-48 object-cover object-top h-32'
        alt=''
      />
      <div className='pl-4'>
        <h2 className='text-xl font-regular'>{exercise.name}</h2>
        <p>{exercise.equipment}</p>
        <p>{exercise.primaryMuscles}</p>
        <p>{exercise.category}</p>
      </div>
    </div>
  );
};

export default ExerciseCard;
