import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import Button from '../UI/Button';
import Modal from '../UI/Modal';

function AdminPanel({ gameId }) {
  const { 
    isAdmin, 
    players, 
    gameState,
    roleInfo,
    adminAddTestUsers,
    adminForcePhaseChange,
    adminShuffleRoles,
    adminSetPlayerRole
  } = useGame();
  
  // モーダル状態
  const [showTestUsersModal, setShowTestUsersModal] = useState(false);
  const [showPhaseChangeModal, setShowPhaseChangeModal] = useState(false);
  const [showRoleControlModal, setShowRoleControlModal] = useState(false);
  const [showGodViewModal, setShowGodViewModal] = useState(false);
  
  // テストユーザー追加用の状態
  const [testUserCount, setTestUserCount] = useState(1);
  const [werewolfCount, setWerewolfCount] = useState(0);
  const [villagerCount, setVillagerCount] = useState(0);
  const [seerCount, setSeerCount] = useState(0);
  const [guardCount, setGuardCount] = useState(0);
  
  // 役職変更用の状態
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  
  // テストユーザー追加処理
  const handleAddTestUsers = async () => {
    if (!gameId || !isAdmin) return;
    
    try {
      // 役職指定の設定
      const forcedRoles = [];
      for (let i = 0; i < werewolfCount; i++) forcedRoles.push('werewolf');
      for (let i = 0; i < villagerCount; i++) forcedRoles.push('villager');
      for (let i = 0; i < seerCount; i++) forcedRoles.push('seer');
      for (let i = 0; i < guardCount; i++) forcedRoles.push('guard');
      
      await adminAddTestUsers(gameId, testUserCount, forcedRoles);
      setShowTestUsersModal(false);
      
      // 入力値リセット
      setTestUserCount(1);
      setWerewolfCount(0);
      setVillagerCount(0);
      setSeerCount(0);
      setGuardCount(0);
    } catch (error) {
      console.error('テストユーザー追加エラー:', error);
      alert(`テストユーザー追加エラー: ${error.message}`);
    }
  };
  
  // フェーズ変更処理
  const handlePhaseChange = async (newPhase) => {
    if (!gameId || !isAdmin) return;
    
    try {
      await adminForcePhaseChange(gameId, newPhase);
      setShowPhaseChangeModal(false);
    } catch (error) {
      console.error('フェーズ変更エラー:', error);
      alert(`フェーズ変更エラー: ${error.message}`);
    }
  };
  
  // 役職変更処理
  const handleChangePlayerRole = async () => {
    if (!gameId || !isAdmin || !selectedPlayer || !selectedRole) return;
    
    try {
      await adminSetPlayerRole(gameId, selectedPlayer.id, selectedRole);
      setSelectedPlayer(null);
      setSelectedRole('');
    } catch (error) {
      console.error('役職変更エラー:', error);
      alert(`役職変更エラー: ${error.message}`);
    }
  };
  
  // 役職一括シャッフル処理
  const handleShuffleRoles = async () => {
    if (!gameId || !isAdmin) return;
    
    if (window.confirm('全プレイヤーの役職をシャッフルします。よろしいですか？')) {
      try {
        await adminShuffleRoles(gameId);
        setShowRoleControlModal(false);
      } catch (error) {
        console.error('役職シャッフルエラー:', error);
        alert(`役職シャッフルエラー: ${error.message}`);
      }
    }
  };
  
  // 管理者でない場合は何も表示しない
  if (!isAdmin) return null;
  
  return (
    <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-red-700">管理者パネル</h2>
        <span className="text-xs bg-red-700 text-white px-2 py-1 rounded">デバッグ専用</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={() => setShowTestUsersModal(true)}
          variant="outline"
          className="border-red-500 text-red-700 hover:bg-red-100"
        >
          テストユーザー追加
        </Button>
        
        <Button
          onClick={() => setShowPhaseChangeModal(true)}
          variant="outline"
          className="border-red-500 text-red-700 hover:bg-red-100"
        >
          フェーズ/時間操作
        </Button>
        
        <Button
          onClick={() => setShowRoleControlModal(true)}
          variant="outline"
          className="border-red-500 text-red-700 hover:bg-red-100"
        >
          役職操作
        </Button>
        
        <Button
          onClick={() => setShowGodViewModal(true)}
          variant="outline"
          className="border-red-500 text-red-700 hover:bg-red-100"
        >
          God View
        </Button>
      </div>
      
      {/* テストユーザー追加モーダル */}
      <Modal
        isOpen={showTestUsersModal}
        onClose={() => setShowTestUsersModal(false)}
        title="テストユーザー追加"
        footer={
          <div className="flex justify-end space-x-2">
            <Button 
              variant="light" 
              onClick={() => setShowTestUsersModal(false)}
            >
              キャンセル
            </Button>
            <Button 
              variant="danger" 
              onClick={handleAddTestUsers}
            >
              追加
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              追加するテストユーザー数
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={testUserCount}
              onChange={(e) => setTestUserCount(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">役職を指定する（オプション）</h3>
            <p className="text-sm text-gray-500 mb-3">
              指定しない場合はランダムに割り当てられます。指定数が追加数より少ない場合、残りはランダムになります。
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  人狼の数
                </label>
                <input
                  type="number"
                  min="0"
                  max={testUserCount}
                  value={werewolfCount}
                  onChange={(e) => setWerewolfCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  村人の数
                </label>
                <input
                  type="number"
                  min="0"
                  max={testUserCount}
                  value={villagerCount}
                  onChange={(e) => setVillagerCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  占い師の数
                </label>
                <input
                  type="number"
                  min="0"
                  max={testUserCount}
                  value={seerCount}
                  onChange={(e) => setSeerCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  護衛の数
                </label>
                <input
                  type="number"
                  min="0"
                  max={testUserCount}
                  value={guardCount}
                  onChange={(e) => setGuardCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            {/* 指定された役職の合計が追加数を超えていないかチェック */}
            {werewolfCount + villagerCount + seerCount + guardCount > testUserCount && (
              <div className="mt-2 text-red-500 text-sm">
                指定された役職の合計が追加ユーザー数を超えています
              </div>
            )}
          </div>
        </div>
      </Modal>
      
      {/* フェーズ/時間操作モーダル */}
      <Modal
        isOpen={showPhaseChangeModal}
        onClose={() => setShowPhaseChangeModal(false)}
        title="フェーズ/時間操作"
      >
        <div className="space-y-4">
          <h3 className="font-medium mb-2">現在のフェーズ: {gameState}</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handlePhaseChange('lobby')}
              variant={gameState === 'lobby' ? 'primary' : 'outline'}
              disabled={gameState === 'lobby'}
            >
              ロビーへ
            </Button>
            
            <Button
              onClick={() => handlePhaseChange('night')}
              variant={gameState === 'night' ? 'primary' : 'outline'}
              disabled={gameState === 'night'}
            >
              夜フェーズへ
            </Button>
            
            <Button
              onClick={() => handlePhaseChange('day')}
              variant={gameState === 'day' ? 'primary' : 'outline'}
              disabled={gameState === 'day'}
            >
              昼フェーズへ
            </Button>
            
            <Button
              onClick={() => handlePhaseChange('result')}
              variant={gameState === 'result' ? 'primary' : 'outline'}
              disabled={gameState === 'result'}
            >
              結果画面へ
            </Button>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-2">タイマー設定</h3>
            
            <div className="space-y-2">
              <Button
                onClick={async () => {
                  await adminForcePhaseChange(gameId, 'day', { timer: 120, isTimerRunning: true });
                }}
                variant="outline"
                fullWidth
              >
                昼フェーズ - 2分設定してスタート
              </Button>
              
              <Button
                onClick={async () => {
                  await adminForcePhaseChange(gameId, 'day', { timer: 30, isTimerRunning: true });
                }}
                variant="outline"
                fullWidth
              >
                昼フェーズ - 30秒設定してスタート
              </Button>
              
              <Button
                onClick={async () => {
                  await adminForcePhaseChange(gameId, 'day', { timer: 10, isTimerRunning: true });
                }}
                variant="outline"
                fullWidth
              >
                昼フェーズ - 10秒設定してスタート（テスト用）
              </Button>
              
              <Button
                onClick={async () => {
                  await adminForcePhaseChange(gameId, null, { isTimerRunning: false });
                }}
                variant="danger"
                fullWidth
              >
                タイマー一時停止
              </Button>
              
              <Button
                onClick={async () => {
                  await adminForcePhaseChange(gameId, null, { isTimerRunning: true });
                }}
                variant="success"
                fullWidth
              >
                タイマー再開
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* 役職操作モーダル */}
      <Modal
        isOpen={showRoleControlModal}
        onClose={() => setShowRoleControlModal(false)}
        title="役職操作"
      >
        <div className="space-y-4">
          <Button
            onClick={handleShuffleRoles}
            variant="danger"
            fullWidth
          >
            全プレイヤーの役職をシャッフル
          </Button>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">特定プレイヤーの役職変更</h3>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プレイヤーを選択
              </label>
              <select
                value={selectedPlayer?.id || ''}
                onChange={(e) => {
                  const player = players.find(p => p.id === e.target.value);
                  setSelectedPlayer(player || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">プレイヤーを選択...</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.role || '不明'})
                  </option>
                ))}
              </select>
            </div>
            
            {selectedPlayer && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  役職を選択
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
                >
                  <option value="">役職を選択...</option>
                  {Object.entries(roleInfo).map(([role, info]) => (
                    <option key={role} value={role}>
                      {info.name} ({role})
                    </option>
                  ))}
                </select>
                
                <Button
                  onClick={handleChangePlayerRole}
                  variant="danger"
                  fullWidth
                  disabled={!selectedRole}
                >
                  役職を変更
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
      
      {/* God View モーダル */}
      <Modal
        isOpen={showGodViewModal}
        onClose={() => setShowGodViewModal(false)}
        title="God View (すべての役職確認)"
        size="lg"
      >
        <div className="space-y-4">
          <div className="overflow-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">プレイヤー名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">実際の役職</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COした役職</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {players.map(player => (
                  <tr key={player.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{player.name}</div>
                        {player.isHost && (
                          <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">ホスト</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${player.role === 'werewolf' ? 'bg-red-100 text-red-800' : 
                        player.role === 'villager' ? 'bg-green-100 text-green-800' :
                        player.role === 'seer' ? 'bg-blue-100 text-blue-800' :
                        player.role === 'guard' ? 'bg-indigo-100 text-indigo-800' :
                        player.role === 'medium' ? 'bg-purple-100 text-purple-800' :
                        player.role === 'fox' ? 'bg-orange-100 text-orange-800' :
                        player.role === 'exposer' ? 'bg-pink-100 text-pink-800' :
                        'bg-gray-100 text-gray-800'}`}
                      >
                        {roleInfo[player.role]?.name || player.role || '未設定'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {player.roleClaim ? (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${player.roleClaim === 'werewolf' ? 'bg-red-100 text-red-800' : 
                          player.roleClaim === 'villager' ? 'bg-green-100 text-green-800' :
                          player.roleClaim === 'seer' ? 'bg-blue-100 text-blue-800' :
                          player.roleClaim === 'guard' ? 'bg-indigo-100 text-indigo-800' :
                          player.roleClaim === 'medium' ? 'bg-purple-100 text-purple-800' :
                          player.roleClaim === 'fox' ? 'bg-orange-100 text-orange-800' :
                          player.roleClaim === 'exposer' ? 'bg-pink-100 text-pink-800' :
                          'bg-gray-100 text-gray-800'}`}
                        >
                          {roleInfo[player.roleClaim]?.name || player.roleClaim}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">未CO</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.isAlive ? (
                        <span className="text-green-600">生存</span>
                      ) : (
                        <span className="text-red-600">死亡</span>
                      )}
                      {player.hasUsedAbility && (
                        <span className="ml-2 text-blue-600">（能力使用済）</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 中央カード情報 */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">中央カード情報</h3>
            <div className="flex space-x-2">
              {gameState !== 'lobby' && gameState !== 'waiting' ? (
                <>
                  {/* 中央カードの情報がある場合 */}
                  <div className="grid grid-cols-3 gap-3 w-full">
                    {Array.isArray(window.gameData?.centerCards) && window.gameData.centerCards.map((role, index) => (
                      <div key={index} className="p-3 border rounded-md text-center">
                        <div className="text-sm font-medium">カード {index + 1}</div>
                        <div className="font-bold">{roleInfo[role]?.name || role}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-gray-500">
                  ゲームが開始されると中央カードが表示されます
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminPanel;
