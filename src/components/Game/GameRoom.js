import React, { useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import GameLobby from './GameLobby';
import NightPhase from './NightPhase';
import DiscussionPhase from './DiscussionPhase';
import GameResult from './GameResult';
import UserProfile from '../Auth/UserProfile';

function GameRoom() {
  const { 
    gameState,
    gameId,
    error
  } = useGame();
  
  // ゲーム状態に基づいて適切なコンポーネントを表示
  const renderGameState = () => {
    switch (gameState) {
      case 'waiting':
      case 'setup':
      case 'lobby':
        return <GameLobby />;
      case 'night':
        return <NightPhase />;
      case 'day':
        return <DiscussionPhase />;
      case 'result':
        return <GameResult />;
      default:
        return <GameLobby />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-blue-900 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">ワンモーニング人狼</h1>
            {gameId && (
              <p className="text-xs text-blue-200">ゲームID: {gameId}</p>
            )}
          </div>
          <UserProfile />
        </div>
      </header>
      
      {/* メインコンテンツ */}
      <main className="flex-1 py-6">
        {renderGameState()}
      </main>
      
      {/* フッター */}
      <footer className="bg-gray-800 text-white text-sm py-3 text-center">
        <div className="max-w-6xl mx-auto">
          <p>ワンモーニング人狼 &copy; 2025 - 短時間で楽しめる人狼ゲーム</p>
        </div>
      </footer>
      
      {/* エラーメッセージ（ヘッダーに固定表示） */}
      {error && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-2 text-center">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default GameRoom;
