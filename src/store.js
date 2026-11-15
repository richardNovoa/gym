import { configureStore } from '@reduxjs/toolkit';
import exerciseReducer from './events/exercise';
import workoutReducer from './events/workout';

export default configureStore({
  reducer: {
    exercises: exerciseReducer,
    workouts: workoutReducer
  }
});
