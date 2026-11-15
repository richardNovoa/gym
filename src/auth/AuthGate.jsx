import React, { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  const [mode, setMode] = useState('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!supabaseConfigured) {
    return (
      <p className='m-4'>
        Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local, then restart.
      </p>
    );
  }

  if (session === undefined) {
    return <p className='m-4'>Loading...</p>;
  }

  if (!session) {
    return (
      <div className='m-4 text-lg'>
        <form
          className='flex w-80 flex-col gap-2'
          onSubmit={async (event) => {
            event.preventDefault();
            setMessage('');
            setPending(true);
            try {
              if (mode === 'register') {
                const { data, error } = await supabase.auth.signUp({
                  email: email.trim(),
                  password,
                  options: { data: { name: name.trim() } }
                });
                if (error) throw error;
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                  setMessage('An account with that email already exists. Sign in.');
                  setMode('sign-in');
                  return;
                }
                if (!data.session) {
                  setMessage('Check your email to confirm the account, then sign in.');
                  setMode('sign-in');
                }
                return;
              }
              const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password
              });
              if (error) throw error;
            } catch (err) {
              setMessage(err instanceof Error ? err.message : 'Something went wrong.');
            } finally {
              setPending(false);
            }
          }}
        >
          {mode === 'register' ? (
            <input
              className='rounded-lg border border-gray-300 p-1'
              placeholder='Name'
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          ) : null}
          <input
            className='rounded-lg border border-gray-300 p-1'
            placeholder='Email'
            type='email'
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className='rounded-lg border border-gray-300 p-1'
            placeholder='Password'
            type='password'
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className='rounded-lg border border-gray-300 p-1' disabled={pending} type='submit'>
            {mode === 'sign-in' ? 'Sign in' : 'Register'}
          </button>
        </form>
        <button
          type='button'
          className='mt-2 text-sm text-blue-400'
          onClick={() => {
            setMode(mode === 'sign-in' ? 'register' : 'sign-in');
            setMessage('');
          }}
        >
          {mode === 'sign-in' ? 'Register' : 'Sign in'}
        </button>
        {message ? <p className='mt-2 text-sm'>{message}</p> : null}
      </div>
    );
  }

  return (
    <>
      <button type='button' className='m-4 text-sm text-blue-400' onClick={() => supabase.auth.signOut()}>
        Sign out
      </button>
      {children}
    </>
  );
}
