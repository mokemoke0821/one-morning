import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import Button from '../UI/Button';
import Timer from '../UI/Timer';
import Modal, { ConfirmModal, AlertModal } from '../UI/Modal';
import Card from '../UI/Card';

function DiscussionPhase() {
  const { currentUser } = useAuth();
  const { 
    players,
    timer,
    isTimerRunning,
    votes,
    isHost,
    roleInfo,
    updateGameData,
    declareRole,
    vote,
    calculateResults
  } = useGame();
  
  const [showRoleDeclaration, setShowRoleDeclaration] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [showVoting, setShowVoting] = useState(false);
  const [myVote, setMyVote] = useState('');
  const [confirmVote, setConfirmVote] = useState(false);
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary'
  });
  
  // 自分のプレイヤー情報
  const myPlayer = players.find(p => p?.id === currentUser?.uid);
  
  // タイマーが0になったら自動的に投票フェーズへ
  useEffect(() => {
    if (timer === 0 && isTimerRunning === false) {
      setShowVoting(true);
    }
  }, [timer, isTimerRunning]);
  
  // ホスト向けのタイマー操作
  const handleTimerControl = async (action) => {
    if (!isHost) return;
    
    if (action === 'pause') {
      await updateGameData({ isTimerRunning: false });
    } else if (action === 'resume') {
      await updateGameData({ isTimerRunning: true });
    } else if (action === 'skip') {
      await updateGameData({ isTimerRunning: false, timer: 0 });
      setShowVoting(true);
    }
  };
  
  // 役職宣言モーダルを開く
  const handleOpenRoleDeclaration = () => {
    // 既にCOしている場合は表示のみ
    if (myPlayer?.roleClaim) {
      setAlertModal({
        isOpen: true,
        title: '役職宣言済み',
        message: `あなたは既に「${roleInfo[myPlayer.roleClaim]?.name || myPlayer.roleClaim}」としてCOしています。`,
        variant: 'info'
      });
      return;
    }
    
    setShowRoleDeclaration(true);
  };
  
  // 役職宣言を実行
  const handleDeclareRole = async () => {
    if (!selectedRole) {
      setAlertModal({
        isOpen: true,
        title: 'エラー',
        message: '役職を選択してください。',
        variant: 'danger'
      });
      return;
    }
    
    // 村人チームの誠実な役職宣言チェック
    if (['villager', 'seer', 'guard', 'medium'].includes(myPlayer?.role) && 
        selectedRole !== myPlayer?.role) {
      setAlertModal({
        isOpen: true,
        title: '確認',
        message: '村人チームは正直に役職宣言をする必要があります。本当に続けますか？',
        variant: 'warning'
      });
      return;
    }
    
    try {
      const success = await declareRole(myPlayer.id, selectedRole);
      
      if (success) {
        setShowRoleDeclaration(false);
        setAlertModal({
          isOpen: true,
          title: '役職宣言完了',
          message: `あなたは「${roleInfo[selectedRole]?.name || selectedRole}」としてCOしました。`,
          variant: 'success'
        });
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'エラー',
        message: '役職宣言に失敗しました。',
        variant: 'danger'
      });
    }
  };
  
  // 投票モーダルを開く
  const handleOpenVoting = () => {
    // 既に投票済みの場合は警告
    if (votes[myPlayer?.id]) {
      const targetPlayer = players.find(p => p.id === votes[myPlayer.id]);
      
      setAlertModal({
        isOpen: true,
        title: '投票済み',
        message: `あなたは既に「${targetPlayer?.name || '不明'}」に投票しています。`,
        variant: 'info'
      });
      return;
    }
    
    setShowVoting(true);
  };
  
  // 投票対象選択
  const handleSelectVoteTarget = (player) => {
    setTargetPlayer(player);
    setConfirmVote(true);
  };
  
  // 投票実行
  const handleVote = async () => {
    if (!targetPlayer) return;
    
    try {
      const success = await vote(myPlayer.id, targetPlayer.id);
      
      if (success) {
        setConfirmVote(false);
        setShowVoting(false);
        setAlertModal({
          isOpen: true,
          title: '投票完了',
          message: `あなたは「${targetPlayer.name}」に投票しました。`,
          variant: 'success'
        });
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'エラー',
        message: '投票に失敗しました。',
        variant: 'danger'
      });
    }
  };
  
  // 投票結果集計（ホストのみ）
  const handleCalculateResults = async () => {
    await calculateResults();
  };
  
  // 役職宣言モーダル
  const renderRoleDeclarationModal = () => (
    <Modal
      isOpen={showRoleDeclaration}
      onClose={() => setShowRoleDeclaration(false)}
      title="役職宣言 (CO)"
      footer={
        <div className="flex justify-end space-x-2">
          <Button 
            variant="light" 
            onClick={() => setShowRoleDeclaration(false)}
          >
            キャンセル
          </Button>
          <Button 
            variant="primary" 
            onClick={handleDeclareRole}
            disabled={!selectedRole}
          >
            宣言する
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          あなたが宣言する役職を選択してください。
          {myPlayer?.role === 'werewolf' ? (
            <span className="block mt-2 text-red-500 font-medium">
              あなたは人狼です。どの役職でもCOできます。
            </span>
          ) : ['fox', 'exposer'].includes(myPlayer?.role) ? (
            <span className="block mt-2 text-orange-500 font-medium">
              あなたは特殊役職です。どの役職でもCOできます。
            </span>
          ) : (
            <span className="block mt-2 text-blue-500 font-medium">
              あなたは村人チームです。誠実に役職宣言をしましょう。
            </span>
          )}
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* 宣言できる役職一覧 */}
          {['villager', 'seer', 'guard', 'medium'].map(role => (
            <div 
              key={role}
              className={`p-3 border rounded-md cursor-pointer transition-colors ${
                selectedRole === role 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setSelectedRole(role)}
            >
              <div className="font-medium text-center mb-1">{roleInfo[role]?.name}</div>
              <div className="text-center text-2xl">{
                role === 'villager' ? '👨‍🌾' : 
                role === 'seer' ? '🔮' : 
                role === 'guard' ? '🛡️' : 
                role === 'medium' ? '📿' : '❓'
              }</div>
            </div>
          ))}
        </div>
        
        {/* 選択中の役職説明 */}
        {selectedRole && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-1">{roleInfo[selectedRole]?.name}</h3>
            <p className="text-sm">{roleInfo[selectedRole]?.description}</p>
          </div>
        )}
      </div>
    </Modal>
  );
  
  // 投票モーダル
  const renderVotingModal = () => (
    <Modal
      isOpen={showVoting}
      onClose={() => !votes[myPlayer?.id] && setShowVoting(false)}
      title="追放投票"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-gray-600 mb-4">
          追放するプレイヤーを選んでください。全員の投票結果により1人が追放されます。
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {players.filter(p => p.isAlive && p.id !== myPlayer?.id).map(player => (
            <div 
              key={player.id}
              className={`p-3 border rounded-md ${
                votes[myPlayer?.id] === player.id
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-red-300 cursor-pointer'
              }`}
              onClick={() => !votes[myPlayer?.id] && handleSelectVoteTarget(player)}
            >
              <div className="font-medium">{player.name}</div>
              {player.roleClaim && (
                <div className="text-xs mt-1 text-gray-500">
                  CO: {roleInfo[player.roleClaim]?.name || player.roleClaim}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* 現在の投票状況 */}
        <div className="mt-6">
          <h3 className="font-medium mb-2">現在の投票状況:</h3>
          <div className="bg-gray-50 p-3 rounded-md">
            {Object.keys(votes).length > 0 ? (
              <ul className="space-y-1">
                {Object.entries(votes).map(([voterId, targetId]) => {
                  const voter = players.find(p => p.id === voterId);
                  const target = players.find(p => p.id === targetId);
                  return (
                    <li key={voterId} className="flex justify-between">
                      <span className="font-medium">{voter?.name || '不明'}</span>
                      <span className="text-gray-500">→</span>
                      <span>{target?.name || '不明'}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500 text-center">まだ投票はありません</p>
            )}
          </div>
        </div>
        
        {/* ホスト用の集計ボタン */}
        {isHost && (
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={handleCalculateResults}
              variant="danger"
              fullWidth
              disabled={Object.keys(votes).length === 0}
            >
              投票を集計して結果を表示
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              注意: この操作でゲームの結果が確定します
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
  
  // 投票確認モーダル
  const renderConfirmVoteModal = () => (
    <ConfirmModal
      isOpen={confirmVote}
      onClose={() => setConfirmVote(false)}
      onConfirm={handleVote}
      title="投票確認"
      message={`「${targetPlayer?.name || ''}」に投票しますか？この操作は取り消せません。`}
      confirmText="投票する"
      confirmVariant="danger"
    />
  );
  
  // アラートモーダル
  const renderAlertModal = () => (
    <AlertModal
      isOpen={alertModal.isOpen}
      onClose={() => setAlertModal({...alertModal, isOpen: false})}
      title={alertModal.title}
      message={alertModal.message}
      variant={alertModal.variant}
    />
  );
  
  // 議論中の表示
  const renderDiscussion = () => (
    <div className="text-center">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">議論タイム</h2>
        <Timer 
          seconds={timer} 
          isRunning={isTimerRunning} 
          size="lg"
        />
      </div>
      
      {isHost && (
        <div className="flex justify-center space-x-2 mb-6">
          {isTimerRunning ? (
            <Button
              onClick={() => handleTimerControl('pause')}
              variant="warning"
              size="sm"
            >
              一時停止
            </Button>
          ) : (
            timer > 0 && (
              <Button
                onClick={() => handleTimerControl('resume')}
                variant="success"
                size="sm"
              >
                再開
              </Button>
            )
          )}
          <Button
            onClick={() => handleTimerControl('skip')}
            variant="danger"
            size="sm"
          >
            スキップ
          </Button>
        </div>
      )}
      
      <div className="mb-8">
        <p className="text-gray-600 mb-4">
          役職についてディスカッションし、人狼だと思われるプレイヤーを見つけ出しましょう。
        </p>
        
        <div className="flex justify-center space-x-3">
          <Button
            onClick={handleOpenRoleDeclaration}
            variant="primary"
          >
            役職宣言 (CO)
          </Button>
          <Button
            onClick={handleOpenVoting}
            variant="danger"
            disabled={isTimerRunning}
          >
            投票
          </Button>
        </div>
      </div>
      
      {/* プレイヤーリスト */}
      <div className="max-w-3xl mx-auto">
        <h3 className="text-lg font-semibold mb-3">プレイヤー一覧</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {players.map(player => (
            <div 
              key={player.id} 
              className={`
                border rounded-md p-3 
                ${player.id === currentUser?.uid ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}
                ${!player.isAlive ? 'opacity-50' : ''}
              `}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{player.name}</span>
                {player.isHost && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">ホスト</span>
                )}
              </div>
              
              {player.roleClaim ? (
                <div className="mt-1 text-sm bg-green-50 text-green-700 px-2 py-1 rounded">
                  CO: {roleInfo[player.roleClaim]?.name || player.roleClaim}
                </div>
              ) : (
                <div className="mt-1 text-sm text-gray-500">未CO</div>
              )}
              
              {player.id in votes && (
                <div className="mt-1 text-xs text-purple-600">
                  投票済み
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">昼のフェーズ</h1>
        
        {renderDiscussion()}
        
        {/* モーダル */}
        {renderRoleDeclarationModal()}
        {renderVotingModal()}
        {renderConfirmVoteModal()}
        {renderAlertModal()}
      </div>
    </div>
  );
}

export default DiscussionPhase;
