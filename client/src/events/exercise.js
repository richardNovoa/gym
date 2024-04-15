import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const baseUrl = process.env.REACT_APP_API_BASE_URL;

export const getExercises = createAsyncThunk(
  'exercises/getExercises', // Use a namespace for better organization
  async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/exercises`);
      return res.data; // Return the fetched data
    } catch (err) {
      return Promise.reject(err); // Reject with the error for handling in reducer
    }
  }
);

// Reducers
export const exerciseReducer = createSlice({
  name: 'exercises',
  initialState: {
    exercises: [],
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getExercises.pending, (state) => {
        state.loading = true; // Set loading to true when request starts
      })
      .addCase(getExercises.fulfilled, (state, action) => {
        state.exercises = action.payload; // Overwrite exercises with fetched data
        state.error = null;
        state.loading = false; // Set loading to false after completion
      })
      .addCase(getExercises.rejected, (state, action) => {
        state.error = action.error.message; // Extract error message from error object
        state.loading = false; // Set loading to false after error
      });
  }
});

export default exerciseReducer.reducer;
