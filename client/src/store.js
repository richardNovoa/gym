import { configureStore } from '@reduxjs/toolkit';
import exerciseReducer from './events/exercise';

export default configureStore({
  reducer: {
    exercises: exerciseReducer
  }
});
