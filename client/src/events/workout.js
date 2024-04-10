import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const getWorkouts = createAsyncThunk(
  'workouts/getWorkouts', // Use a namespace for better organization
  async () => {
    try {
      const res = await axios.get('http://localhost:5002/api/workouts');
      return res.data;
      // Return the fetched data
    } catch (err) {
      return Promise.reject(err); // Reject with the error for handling in reducer
    }
  }
);

// Reducers
export const workoutReducer = createSlice({
  name: 'workouts',
  initialState: {
    workouts: [],
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getWorkouts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getWorkouts.fulfilled, (state, action) => {
        state.workouts = action.payload;
        state.error = null;
        state.loading = false;
      })
      .addCase(getWorkouts.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      });
  }
});

export default workoutReducer.reducer;
