import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../lib/supabase';
import { toExercise } from '../lib/shape';

export const getExercises = createAsyncThunk(
  'exercises/getExercises', // Use a namespace for better organization
  async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select(
          'id, name, force, level, mechanic, equipment, category, primary_muscles, secondary_muscles, instructions, images'
        )
        .order('name')
        .limit(2000);
      if (error) throw new Error(error.message);
      return (data ?? []).map(toExercise).filter(Boolean);
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
