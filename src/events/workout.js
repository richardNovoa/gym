import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../lib/supabase';
import { toWorkout } from '../lib/shape';

const workoutSelect = `
  id, name,
  workout_exercises (
    id, position,
    exercise:exercises (
      id, name, force, level, mechanic, equipment, category,
      primary_muscles, secondary_muscles, instructions, images
    ),
    sets ( id, position, reps, weight, completed )
  )
`;

export const getWorkouts = createAsyncThunk(
  'workouts/getWorkouts', // Use a namespace for better organization
  async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(workoutSelect)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(toWorkout).filter(Boolean);
    } catch (err) {
      return Promise.reject(err); // Reject with the error for handling in reducer
    }
  }
);

export const getWorkoutById = createAsyncThunk(
  'workouts/getWorkoutById', // Use a namespace for better organization
  async (id) => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(workoutSelect)
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toWorkout(data) : null;
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
