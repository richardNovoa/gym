import React from 'react';
import { Link } from 'react-router-dom';

const SearchResult = ({ results }) => {
  return (
    <div className='w-full bg-white flex flex-col shadow rounded absolute'>
      {results.map((result) => (
        <Link
          to={`/workouts/${result._id}`}
          className='py-2 px-4 hover:bg-gray-100'
          key={result._id}>
          {result.name}
        </Link>
      ))}
    </div>
  );
};

export default SearchResult;
