import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const SearchInput = ({ data, setResults }) => {
  const [input, setInput] = React.useState('');

  const fetchData = (value) => {
    const filteredData = data.filter((result) => result.name.includes(value));
    if (value.length > 0) {
      setResults(filteredData);
    } else {
      setResults([]);
    }
  };

  const handleChange = (value) => {
    setInput(value);
    fetchData(value);
  };

  return (
    <div className='rounded-lg m-4 border-gray-300 border focus-within:border-blue-600 focus-within:ring-blue-400 w-full'>
      <div className='flex gap-2 p-1 items-center'>
        <FontAwesomeIcon icon={faSearch} className='text-blue-400 ml-1' />
        <input
          placeholder='Enter search'
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          className='focus-visible:outline-none'
        />
      </div>
    </div>
  );
};

export default SearchInput;
