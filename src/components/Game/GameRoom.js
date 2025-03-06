import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import GameLobby from './GameLobby';
import NightPhase from './NightPhase';
import DiscussionPhase from './DiscussionPhase';
import GameResult from './GameResult';
import UserProfile from '../Auth/UserProfile';
import Modal from '../UI/Modal';
import ChatBox from '../Chat/ChatBox';
import Button from '../UI/Button';

function GameRoom() {
  const { 
    gameState,
    gameId,
    error
  } = useGame();

  const [showRules, setShowRules] = useState(false);
  
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
      case 'forceEnded': // 強制終了の場合も結果画面を表示
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
            <p className="text-sm text-blue-200">夜時間なし！議論中にCOして相手のカードを見られる、1日完結型人狼ゲーム！</p>
            {gameId && (
              <p className="text-xs text-blue-200">ゲームID: {gameId}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowRules(true)}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-sm"
            >
              ルール説明
            </button>
            <UserProfile />
          </div>
        </div>
      </header>
      
      {/* メインコンテンツ */}
      <main className="flex-1 py-6">
        {gameState === 'setup' || gameState === 'waiting' || gameState === 'lobby' ? (
          <div className="max-w-4xl mx-auto mb-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-yellow-800 mb-2">ワンモーニング人狼へようこそ！</h2>
            <p className="mb-2">よるじかん、なし！議論中にCOして相手のカードを見られる、1日完結型人狼ゲーム！</p>
            <p className="mb-2">2分でワイワイ大盛り上がり！1日完結型人狼ゲームの決定版！</p>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowRules(true)} 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                詳しいルールを見る
              </button>
            </div>
          </div>
        ) : null}

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

      {/* ルール説明モーダル */}
      <Modal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        title="ワンモーニング人狼のルール"
      >
        <div className="space-y-4 text-gray-700">
          <p className="font-bold text-blue-900">ワンモーニング人狼は「夜時間なし」「COで相手のカードを見る」「1日完結」が特徴の超ショート人狼ゲームです。</p>
          
          <h3 className="font-bold text-lg">ゲームの流れ</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>各プレイヤーは1枚のカードを受け取り、自分の役職を確認します</li>
            <li>昼フェーズでは制限時間内（2分）に自由に議論します</li>
            <li>自分の役職を宣言（CO）することで特殊能力が使えます</li>
            <li>最後に投票を行い、最多得票者を処刑します</li>
            <li>処刑されたプレイヤーの正体が明らかになり、勝敗が決まります</li>
          </ol>

          <h3 className="font-bold text-lg">役職とCO</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-semibold">村人チーム</span>：正直に役職をCOして人狼を処刑しましょう</li>
            <li><span className="font-semibold">人狼チーム</span>：村人に紛れて処刑を逃れましょう</li>
            <li><span className="font-semibold">占い師</span>：COしていないプレイヤーのカードを見ることができます</li>
            <li><span className="font-semibold">護衛</span>：COしたプレイヤーのカードを見ることができます</li>
            <li><span className="font-semibold">霊媒師</span>：中央に置かれたカードを1枚見ることができます</li>
            <li><span className="font-semibold">狐</span>：占い師か護衛に見られると即敗北です</li>
            <li><span className="font-semibold">露出狂</span>：占い師か護衛に見られると見た人と同時勝利です</li>
          </ul>

          <h3 className="font-bold text-lg">勝利条件</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-semibold">村人チーム</span>：人狼を全て処刑する</li>
            <li><span className="font-semibold">人狼チーム</span>：処刑を逃れ、人数が村人以上になる</li>
            <li><span className="font-semibold">狐</span>：占い師か護衛に見られないようにする</li>
            <li><span className="font-semibold">露出狂</span>：占い師か護衛に見られる（見た人と同時勝利）</li>
          </ul>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
            <p className="text-yellow-800 font-bold">ポイント！</p>
            <p>ワンモーニング人狼は騙り合いがカギです。あいてのカードをめくれる!?2分でワイワイ大盛り上がり！</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default GameRoom;
