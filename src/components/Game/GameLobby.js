import React, { useState } from 'react';
import Button from '../UI/Button';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChatBox from '../Chat/ChatBox';
import AdminPanel from '../Admin/AdminPanel';

function GameLobby() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    isHost,
    isAdmin, 
    players, 
    availableGames,
    roleDistribution,
    gameId,
    error,
    setError,
    createGame,
    joinGame,
    leaveGame,
    startGame,
    adminDeleteGame
  } = useGame();
  
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');
  const [playerCount, setPlayerCount] = useState(6);
  const [selectedGameId, setSelectedGameId] = useState(null);
  
  // 新しいゲームを作成
  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('プレイヤー名を入力してください');
      return;
    }
    
    localStorage.setItem('playerName', playerName);
    await createGame(playerName, playerCount);
  };
  
  // 既存のゲームに参加
  const handleJoinGame = async (game) => {
    if (!playerName.trim()) {
      setError('プレイヤー名を入力してください');
      return;
    }
    
    localStorage.setItem('playerName', playerName);
    await joinGame(game, playerName);
  };
  
  // ロビーを離れる
  const handleLeaveGame = async () => {
    console.log("ロビーを離れるボタンがクリックされました");
    try {
      const result = await leaveGame();
      if (result) {
        console.log("ロビーを離れる処理が成功しました。ログイン画面にリダイレクトします。");
        navigate('/');  // メイン画面へリダイレクト
      } else {
        console.error("ロビーを離れる処理に失敗しました");
        setError("ロビーを離れることができませんでした。もう一度お試しください。");
      }
    } catch (error) {
      console.error("ロビーを離れるエラー:", error);
      setError(`エラーが発生しました: ${error.message}`);
    }
  };
  
  // ゲーム開始
  const handleStartGame = async () => {
    if (players.length < 4) {
      setError('ゲームを開始するには最低4人のプレイヤーが必要です');
      return;
    }

    if (players.length > 8) {
      setError('プレイヤー数が多すぎます。最大8人までプレイできます');
      return;
    }
    
    await startGame();
  };
  
  // 管理者によるゲーム削除
  const handleAdminDeleteGame = async (gameId) => {
    if (!isAdmin) {
      setError('管理者権限がありません');
      return;
    }
    
    if (window.confirm('このゲームを削除しますか？この操作は元に戻せません。')) {
      const result = await adminDeleteGame(gameId);
      if (result) {
        console.log(`ゲームID: ${gameId} が管理者により削除されました`);
      }
    }
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左側：プレイヤー情報とゲーム作成 */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">ゲームセットアップ</h2>
          
          {/* プレイヤー名入力 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プレイヤー名
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="あなたの名前を入力"
            />
          </div>
          
          {/* ホスト用のプレイヤー数選択 */}
          {!players.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プレイヤー数（4～8人）
              </label>
              <select
                value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="4">4人</option>
                <option value="5">5人</option>
                <option value="6">6人</option>
                <option value="7">7人</option>
                <option value="8">8人</option>
              </select>
              
              {/* 役職配分の表示 */}
              {roleDistribution[playerCount] && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-semibold mb-2">役職配分:</h3>
                  <ul className="text-xs space-y-1">
                    <li>人狼: {roleDistribution[playerCount].werewolf}人</li>
                    <li>村人: {roleDistribution[playerCount].villager}人</li>
                    <li>占い師: {roleDistribution[playerCount].seer}人</li>
                    <li>護衛: {roleDistribution[playerCount].guard}人</li>
                    {roleDistribution[playerCount].medium > 0 && <li>霊媒師: {roleDistribution[playerCount].medium}人</li>}
                    {roleDistribution[playerCount].fox > 0 && <li>狐: {roleDistribution[playerCount].fox}人</li>}
                    {roleDistribution[playerCount].exposer > 0 && <li>露出狂: {roleDistribution[playerCount].exposer}人</li>}
                    {roleDistribution[playerCount].unknown > 0 && <li>見てはいけないもの: {roleDistribution[playerCount].unknown}枚</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* ゲーム作成ボタン */}
          {!players.length > 0 ? (
            <Button
              onClick={handleCreateGame}
              fullWidth
              variant="primary"
              className="mb-4"
            >
              新しいゲームを作成
            </Button>
          ) : (
            <div className="mb-4">
              <Button
                onClick={handleLeaveGame}
                variant="danger"
                fullWidth
                className="hover:bg-red-800 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  ロビーを離れる
                </span>
              </Button>
            </div>
          )}
        </div>
        
        {/* 右側：既存ゲーム一覧または参加中のゲーム情報 */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          {players.length > 0 ? (
            <>
              <h2 className="text-xl font-bold mb-4">参加中のゲーム</h2>
              
              {/* プレイヤーリスト */}
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">参加プレイヤー ({players.length}人)</h3>
                <ul className="bg-gray-50 rounded-md divide-y divide-gray-200">
                  {players.map((player) => (
                    <li key={player.id} className="py-2 px-3 flex justify-between items-center">
                      <span className="font-medium">{player.name}</span>
                      <div className="flex items-center">
                        {currentUser && player.id === currentUser.uid && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">あなた</span>
                        )}
                        {player.isHost && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">ホスト</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* ホスト用のゲーム開始ボタン */}
              {isHost && (
                <div className="mt-4">
                  <Button
                    onClick={handleStartGame}
                    variant="success"
                    fullWidth
                    disabled={players.length < 4 || players.length > 8}
                  >
                    ゲームを開始する 
                    {players.length < 4 && `(あと${4-players.length}人必要)`}
                    {players.length > 8 && `(プレイヤー数が多すぎます)`}
                  </Button>
                </div>
              )}
              
              {/* 非ホスト向けメッセージ */}
              {!isHost && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-md text-sm">
                  <p>ホストがゲームを開始するのをお待ちください。現在 {players.length} 人が参加中です。</p>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4">公開ゲーム一覧</h2>
              
              {availableGames && availableGames.length > 0 ? (
                <div className="space-y-3">
                  {availableGames.map((game) => {
                    const hostPlayer = game.players.find(p => p.isHost);
                    return (
                      <div key={game.id} className="border border-gray-200 rounded-md p-3 hover:border-blue-300">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="font-medium">ホスト: {hostPlayer?.name || '不明'}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {game.players?.length || 0}/{game.playerCount}人
                          </span>
                        </div>
                        <Button
                          onClick={() => handleJoinGame(game)}
                          variant="outline"
                          size="sm"
                          fullWidth
                          disabled={game.players.length >= game.playerCount || game.players.length >= 8}
                        >
                          参加する
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-500">現在利用可能なゲームはありません</p>
                  <p className="text-sm text-gray-400 mt-1">新しいゲームを作成してみましょう！</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* 管理者機能 */}
      {isAdmin && (
        <>
          {/* 管理者ゲーム削除ボタン表示 */}
          {availableGames && availableGames.length > 0 && (
            <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">ゲーム管理</h2>
              <div className="space-y-3">
                {availableGames.map((game) => {
                  const hostPlayer = game.players.find(p => p.isHost);
                  return (
                    <div key={game.id} className="border border-gray-200 rounded-md p-3 hover:border-red-300 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="font-medium">ゲームID: {game.id}</span>
                          <div className="text-sm text-gray-500">ホスト: {hostPlayer?.name || '不明'}</div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {game.players?.length || 0}/{game.playerCount}人
                        </span>
                      </div>
                      <Button
                        onClick={() => handleAdminDeleteGame(game.id)}
                        variant="danger"
                        size="sm"
                        fullWidth
                      >
                        <span className="flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          管理者権限で削除
                        </span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* 管理者パネル - 参加中のゲームに対する操作 */}
          {gameId && <AdminPanel gameId={gameId} />}
        </>
      )}
      
      {/* チャットボックス（参加中のゲームがある場合のみ表示） */}
      {gameId && players.length > 0 && (
        <div className="mt-6">
          <ChatBox gameId={gameId} />
        </div>
      )}
      
      {/* エラーメッセージ */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}

export default GameLobby;
