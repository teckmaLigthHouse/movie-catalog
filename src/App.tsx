import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Login from './Pages/Login';
import Home from './Pages/Home';
import type { Session } from '@supabase/supabase-js';
import { Header } from './components/Header';
import Search from './Pages/Search';
import Category from './Pages/Category';
import Details from './Pages/Details';
import { NotFound } from './Pages/NotFound';
import { Footer } from './components/Footer';
import UserProfile from './Pages/UserPage';
import Series from './Pages/Series';
import Movies from './Pages/Movies';
import TVDetails from './Pages/TVDetails';
import TVCategory from './Pages/TVCategory';

function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Carregando...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute session={session}>
              <Header />
              <Home />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute session={session}>
              <Header />
              <Search />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/category/:id"
          element={
            <ProtectedRoute session={session}>
              <Header />
              <Category />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/details/:id"
          element={
            <ProtectedRoute session={session}>
              <Header />
              <Details />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute session={session}>
              <Header />
              <UserProfile />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/series"
          element={
            <ProtectedRoute session={session}>
              <Header />
              <Series />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies"
          element={
            <ProtectedRoute session={session}>
              <Header />
              <Movies />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tv/:id"
          element={
            <ProtectedRoute session={session}>
              <Header />
              <TVDetails />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tv/category/:id"
          element={
            <ProtectedRoute session={session}>
              <Header />
              <TVCategory />
              <Footer />
            </ProtectedRoute>
          }
        />

        <Route path="" element={<Navigate to={session ? "/home" : "/login"} replace />} />
        <Route path="*" element={<NotFound />} />,
      </Routes>
    </BrowserRouter>
  );
}

export default App;