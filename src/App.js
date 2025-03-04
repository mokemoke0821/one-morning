import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import GameRoom from './components/Game/GameRoom';
import Login from './components/Auth/Login';
import { useAuth } from './contexts/AuthContext';
import './App.css';

// 認証状態に基づいてルートを保護するためのコンポーネント
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">ロード中...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <GameRoom />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </GameProvider>
    </AuthProvider>
  );
}

// 未認証ユーザー向けのルート（認証済みならホームにリダイレクト）
function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">ロード中...</div>;
  }
  
  if (currentUser) {
    return <Navigate to="/" />;
  }
  
  return children;
}

export default App;
