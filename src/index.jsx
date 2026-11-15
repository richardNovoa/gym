import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import store from './store';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ExerciseList from './lib/components/exercises/ExerciseList';
import WorkoutPage from './lib/components/workouts/WorkoutPage';
import AllWorkouts from './lib/components/workouts/AllWorkouts';
import AuthGate from './auth/AuthGate';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AllWorkouts />
  },
  {
    path: '/exercises',
    element: <ExerciseList />
  },
  {
    path: '/workouts/:id',
    element: <WorkoutPage />
  }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthGate>
        <RouterProvider router={router}>
          <App />
        </RouterProvider>
      </AuthGate>
    </Provider>
  </React.StrictMode>
);
