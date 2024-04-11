import React from 'react';

const SearchResult = ({ results }) => {
  return (
    <div>
      {results.map((result) => (
        <div key={result._id}>{result.name}</div>
      ))}
    </div>
  );
};

export default SearchResult;
