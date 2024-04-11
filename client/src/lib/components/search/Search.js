import React from 'react';
import SearchInput from './SearchInput';
import SearchResult from './SearchResult';

const Search = ({ data }) => {
  const [results, setResults] = React.useState([]);
  return (
    <div>
      <SearchInput data={data} setResults={setResults} />
      <SearchResult results={results} />
    </div>
  );
};

export default Search;
