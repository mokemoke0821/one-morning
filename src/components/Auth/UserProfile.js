import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

function UserProfile() {
  const { currentUser } = useAuth();
  const playerName = localStorage.getItem('playerName') || '匿名プレイヤー';

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <div className="user-profile">
      <div className="user-info">
        <span className="player-name">{playerName}</span>
        <span className="user-id">{currentUser && currentUser.uid ? `(ID: ${currentUser.uid.substring(0, 6)}...)` : ''}</span>
      </div>
      <button 
        onClick={handleLogout}
        className="logout-button"
      >
        ログアウト
      </button>
    </div>
  );
}

export default UserProfile;
