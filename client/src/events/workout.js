import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const baseUrl = process.env.REACT_APP_API_BASE_URL;

export const getWorkouts = createAsyncThunk(
  'workouts/getWorkouts', // Use a namespace for better organization
  async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/workouts`, { mode: 'cors' });
      console.log(baseUrl);
      return res.data;
      // Return the fetched data
    } catch (err) {
      return Promise.reject(err); // Reject with the error for handling in reducer
    }
  }
);

export const getWorkoutById = createAsyncThunk(
  'workouts/getWorkoutById', // Use a namespace for better organization
  async (id) => {
    try {
      const res = await axios.get(`${baseUrl}/api/workouts/${id}`, {
        mode: 'cors'
      }); // Include ID in URL
      return res.data;
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
    workout: null,
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
      })
      // getWorkoutById
      .addCase(getWorkoutById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getWorkoutById.fulfilled, (state, action) => {
        state.workout = action.payload;
        state.error = null;
        state.loading = false;
      })
      .addCase(getWorkoutById.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      });
  }
});

export default workoutReducer.reducer;
