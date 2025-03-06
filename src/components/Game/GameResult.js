import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import Button from '../UI/Button';
import Card from '../UI/Card';

function GameResult() {
  const { currentUser } = useAuth();
  const { 
    gameResult, 
    players, 
    centerCards,
    roleInfo,
    isHost,
    resetGame,
    leaveGame
  } = useGame();
  
  // 自分のプレイヤー情報
  const myPlayer = players.find(p => p?.id === currentUser?.uid);
  
  // 結果タイプに応じたスタイル・メッセージ
  const getResultStyle = () => {
    if (!gameResult) return {};
    
    const resultType = gameResult.type;
    
    if (['villagerWin', 'exposerWin'].includes(resultType)) {
      return {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        icon: '🎉',
        title: resultType === 'villagerWin' ? '村人陣営の勝利！' : '露出狂の勝利！'
      };
    } else if (['werewolfWin'].includes(resultType)) {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-900',
        icon: '🐺',
        title: '人狼陣営の勝利！'
      };
    } else if (resultType === 'foxLoss') {
      return {
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-900',
        icon: '🦊',
        title: '狐の敗北！'
      };
    } else if (resultType === 'unknownLoss') {
      return {
        bgColor: 'bg-gray-800',
        borderColor: 'border-gray-900',
        textColor: 'text-white',
        icon: '⚠️',
        title: '全員敗北...'
      };
    } else if (resultType === 'forceEnded') {
      return {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        textColor: 'text-yellow-800',
        icon: '🛑',
        title: 'ゲーム強制終了'
      };
    } else {
      return {
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-800',
        icon: '📋',
        title: '結果発表'
      };
    }
  };
  
  // 自分が勝ったかどうか
  const didIWin = () => {
    if (!gameResult || !myPlayer) return false;
    
    const resultType = gameResult.type;
    
    // 特殊勝利条件 (狐は必ず敗北)
    if (resultType === 'foxLoss' && myPlayer.role === 'fox') return false;
    if (resultType === 'exposerWin' && (gameResult.winnerIds?.includes(myPlayer.id))) return true;
    
    // 村人チーム勝利
    if (resultType === 'villagerWin' && 
        ['villager', 'seer', 'guard', 'medium'].includes(myPlayer.role)) return true;
    
    // 人狼チーム勝利
    if (resultType === 'werewolfWin' && myPlayer.role === 'werewolf') return true;
    
    return false;
  };
  
  // 役職カードリストを生成
  const renderRoleCards = () => {
    return (
      <div className="flex flex-wrap justify-center gap-3 my-6">
        <div className="w-full">
          <h3 className="font-medium mb-2 text-center">プレイヤーの役職</h3>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {players.map(player => (
              <div key={player.id} className="text-center" style={{minWidth: '70px'}}>
                <Card role={player.role} size="sm" />
                <div className="mt-1 text-sm font-medium truncate max-w-[80px]">{player.name}</div>
                <div className="text-xs text-gray-500">{roleInfo[player.role]?.name || player.role}</div>
              </div>
            ))}
          </div>
        </div>
        
        {centerCards && centerCards.length > 0 && (
          <div className="mt-6 w-full">
            <h3 className="font-medium mb-2 text-center">中央カード</h3>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {centerCards.map((role, index) => (
                <div key={index} className="text-center" style={{minWidth: '70px'}}>
                  <Card role={role} size="sm" />
                  <div className="mt-1 text-xs text-gray-500">{roleInfo[role]?.name || role}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // 勝ち負け表示
  const renderWinLoseStatus = () => {
    const win = didIWin();
    
    return (
      <div className={`mt-6 p-4 rounded-lg text-center ${win ? 'bg-green-100' : 'bg-red-100'}`}>
        <span className="text-xl font-bold">
          {win ? '🏆 あなたの勝利です！' : '😢 あなたの敗北です...'}
        </span>
      </div>
    );
  };
  
  // ゲームを再開する（ホストのみ）
  const handleResetGame = async () => {
    await resetGame();
  };
  
  // ロビーを離れる
  const handleLeaveGame = async () => {
    await leaveGame();
  };
  
  const resultStyle = getResultStyle();
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">ゲーム結果</h1>
        
        {/* 結果サマリー */}
        <div className={`${resultStyle.bgColor} ${resultStyle.borderColor} border rounded-lg p-6 text-center ${resultStyle.textColor}`}>
          <div className="text-5xl mb-3">{resultStyle.icon}</div>
          <h2 className="text-2xl font-bold mb-2">{resultStyle.title}</h2>
          <p className="text-lg">{gameResult?.message}</p>
          
          {/* 追放されたプレイヤー情報 */}
          {gameResult?.eliminatedPlayer && (
            <div className="mt-4 p-3 bg-white bg-opacity-40 rounded-lg inline-block">
              <p className="font-medium">追放されたプレイヤー</p>
              <p>
                {gameResult.eliminatedPlayer.name} ({roleInfo[gameResult.eliminatedPlayer.role]?.name || gameResult.eliminatedPlayer.role})
              </p>
            </div>
          )}
        </div>
        
        {/* 役職カード一覧 */}
        {renderRoleCards()}
        
        {/* 勝敗表示 */}
        {gameResult?.type !== 'elimination' && renderWinLoseStatus()}
        
        {/* 操作ボタン */}
        <div className="mt-8 flex justify-center space-x-4">
          {isHost && (
            <Button
              onClick={handleResetGame}
              variant="primary"
            >
              もう一度遊ぶ
            </Button>
          )}
          
          <Button
            onClick={handleLeaveGame}
            variant="light"
          >
            ロビーを離れる
          </Button>
        </div>
      </div>
    </div>
  );
}

export default GameResult;
