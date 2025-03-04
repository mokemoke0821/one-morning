import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Modal, { AlertModal } from '../UI/Modal';

function NightPhase() {
  const { currentUser } = useAuth();
  const { 
    players, 
    centerCards,
    roleInfo,
    startDayPhase,
    useAbility
  } = useGame();
  
  const [showCard, setShowCard] = useState(false);
  const [showOtherWolves, setShowOtherWolves] = useState(false);
  const [abilityUsed, setAbilityUsed] = useState(false);
  const [currentStep, setCurrentStep] = useState('viewRole'); // viewRole, useAbility, waitingOthers
  const [targetSelection, setTargetSelection] = useState(false);
  const [centerCardSelection, setCenterCardSelection] = useState(false);
  
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary'
  });
  
  // 自分のプレイヤー情報
  const myPlayer = players.find(p => p?.id === currentUser?.uid);
  
  // 役職に応じた表示・機能を切り替え
  useEffect(() => {
    if (myPlayer && myPlayer.hasUsedAbility) {
      setAbilityUsed(true);
      setCurrentStep('waitingOthers');
    }
  }, [myPlayer]);
  
  // 役職カードを表示
  const handleViewCard = () => {
    setShowCard(true);
  };
  
  // 役職確認後の処理
  const handleConfirmRole = () => {
    setShowCard(false);
    
    // 人狼の場合は他の人狼を表示
    if (myPlayer?.role === 'werewolf') {
      setShowOtherWolves(true);
    } else {
      // 能力を持つ役職の場合
      if (['seer', 'guard', 'medium'].includes(myPlayer?.role)) {
        setCurrentStep('useAbility');
      } else {
        setCurrentStep('waitingOthers');
      }
    }
  };
  
  // 人狼確認後の処理
  const handleConfirmWolves = () => {
    setShowOtherWolves(false);
    setCurrentStep('waitingOthers');
  };
  
  // 能力使用画面の表示
  const handleShowAbilityUI = () => {
    if (myPlayer?.role === 'seer') {
      // 占い師: COしていないプレイヤーを選択
      setTargetSelection(true);
    } else if (myPlayer?.role === 'guard') {
      // 護衛: COしたプレイヤーを選択
      setTargetSelection(true);
    } else if (myPlayer?.role === 'medium') {
      // 霊媒師: 中央カードを選択
      setCenterCardSelection(true);
    }
  };
  
  // プレイヤー選択時の処理
  const handleSelectPlayer = async (targetId) => {
    if (abilityUsed) return;
    
    try {
      const result = await useAbility(myPlayer.id, targetId);
      
      if (result.success) {
        // 能力使用成功
        setTargetSelection(false);
        setAbilityUsed(true);
        setCurrentStep('waitingOthers');
        
        // 結果を表示
        const targetPlayer = players.find(p => p.id === targetId);
        const roleName = roleInfo[result.result.role]?.name || result.result.role;
        
        setAlertModal({
          isOpen: true,
          title: '能力使用結果',
          message: `${targetPlayer?.name}さんの役職は「${roleName}」です。`,
          variant: 'info'
        });
        
        // 特殊勝利条件の処理
        if (result.specialResult) {
          setAlertModal({
            isOpen: true,
            title: '特殊条件発動',
            message: result.specialResult.message,
            variant: result.specialResult.type.includes('Win') ? 'success' : 'danger'
          });
        }
      } else {
        // 能力使用失敗
        setAlertModal({
          isOpen: true,
          title: 'エラー',
          message: result.result || '能力の使用に失敗しました。',
          variant: 'danger'
        });
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'エラー',
        message: '能力使用中にエラーが発生しました。',
        variant: 'danger'
      });
    }
  };
  
  // 中央カード選択時の処理
  const handleSelectCenterCard = async (cardIndex) => {
    if (abilityUsed) return;
    
    try {
      const result = await useAbility(myPlayer.id, null, cardIndex);
      
      if (result.success) {
        // 能力使用成功
        setCenterCardSelection(false);
        setAbilityUsed(true);
        setCurrentStep('waitingOthers');
        
        // 結果を表示
        const roleName = roleInfo[result.result.role]?.name || result.result.role;
        
        setAlertModal({
          isOpen: true,
          title: '能力使用結果',
          message: `中央カード${cardIndex + 1}の役職は「${roleName}」です。`,
          variant: 'info'
        });
        
        // 特殊勝利条件の処理
        if (result.specialResult) {
          setAlertModal({
            isOpen: true,
            title: '特殊条件発動',
            message: result.specialResult.message,
            variant: result.specialResult.type.includes('Win') ? 'success' : 'danger'
          });
        }
      } else {
        // 能力使用失敗
        setAlertModal({
          isOpen: true,
          title: 'エラー',
          message: result.result || '能力の使用に失敗しました。',
          variant: 'danger'
        });
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'エラー',
        message: '能力使用中にエラーが発生しました。',
        variant: 'danger'
      });
    }
  };
  
  // 昼のフェーズに進む（ホストのみ）
  const handleStartDayPhase = async () => {
    await startDayPhase();
  };
  
  // 役職表示
  const renderRoleView = () => (
    <div className="text-center">
      <h2 className="text-xl font-bold mb-6">あなたの役職を確認してください</h2>
      
      {showCard ? (
        <div className="space-y-6">
          <div className="flex justify-center">
            <Card 
              role={myPlayer?.role || 'villager'}
              size="lg"
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg max-w-md mx-auto">
            <h3 className="font-bold text-lg mb-2">{roleInfo[myPlayer?.role]?.name || '役職不明'}</h3>
            <p className="text-gray-700">{roleInfo[myPlayer?.role]?.description || '役職説明が見つかりません'}</p>
          </div>
          
          <Button 
            onClick={handleConfirmRole}
            variant="primary"
            size="lg"
          >
            確認完了
          </Button>
        </div>
      ) : (
        <Button 
          onClick={handleViewCard}
          variant="primary"
          size="lg"
        >
          役職を確認する
        </Button>
      )}
    </div>
  );
  
  // 人狼仲間表示
  const renderWolvesList = () => {
    const otherWolves = players.filter(p => p.role === 'werewolf' && p.id !== myPlayer?.id);
    
    return (
      <div className="text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-6">人狼仲間</h2>
        
        {otherWolves.length > 0 ? (
          <div className="space-y-4 mb-6">
            <p className="text-gray-700">以下のプレイヤーも人狼です：</p>
            <ul className="bg-red-50 border border-red-200 rounded-lg p-4">
              {otherWolves.map(wolf => (
                <li key={wolf.id} className="py-2 font-medium text-red-900">{wolf.name}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-900">あなたが唯一の人狼です！</p>
          </div>
        )}
        
        <Button 
          onClick={handleConfirmWolves}
          variant="primary"
        >
          確認完了
        </Button>
      </div>
    );
  };
  
  // 能力使用画面
  const renderAbilityUI = () => {
    let abilityTitle = '';
    let abilityDescription = '';
    
    if (myPlayer?.role === 'seer') {
      abilityTitle = '占い師の能力';
      abilityDescription = 'まだ役職宣言（CO）していないプレイヤーを選択して占ってください。';
    } else if (myPlayer?.role === 'guard') {
      abilityTitle = '護衛の能力';
      abilityDescription = '既に役職宣言（CO）をしたプレイヤーを選択して護衛してください。';
    } else if (myPlayer?.role === 'medium') {
      abilityTitle = '霊媒師の能力';
      abilityDescription = '中央に置かれたカードを1枚選んで確認してください。';
    }
    
    return (
      <div className="text-center max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-2">{abilityTitle}</h2>
        <p className="text-gray-700 mb-6">{abilityDescription}</p>
        
        <Button 
          onClick={handleShowAbilityUI}
          variant="primary"
          className="mb-4"
        >
          能力を使用する
        </Button>
        
        <Button 
          onClick={() => setCurrentStep('waitingOthers')}
          variant="light"
        >
          スキップして待機する
        </Button>
      </div>
    );
  };
  
  // プレイヤー選択モーダル
  const renderPlayerSelectionModal = () => {
    let title = '';
    let eligiblePlayers = [];
    
    if (myPlayer?.role === 'seer') {
      title = '占うプレイヤーを選択';
      // 占い師は役職宣言していないプレイヤーのみ選択可能
      eligiblePlayers = players.filter(p => p.id !== myPlayer.id && !p.roleClaim);
    } else if (myPlayer?.role === 'guard') {
      title = '護衛するプレイヤーを選択';
      // 護衛は役職宣言したプレイヤーのみ選択可能
      eligiblePlayers = players.filter(p => p.id !== myPlayer.id && p.roleClaim);
    }
    
    return (
      <Modal
        isOpen={targetSelection}
        onClose={() => setTargetSelection(false)}
        title={title}
      >
        <div className="space-y-4">
          {eligiblePlayers.length > 0 ? (
            eligiblePlayers.map(player => (
              <div 
                key={player.id}
                className="border border-gray-200 hover:border-blue-400 rounded-md p-3 cursor-pointer transition-colors"
                onClick={() => handleSelectPlayer(player.id)}
              >
                <div className="font-medium">{player.name}</div>
                {player.roleClaim && (
                  <div className="text-sm text-gray-500">
                    CO: {roleInfo[player.roleClaim]?.name || player.roleClaim}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-md">
              <p className="text-gray-500">選択可能なプレイヤーがいません</p>
            </div>
          )}
        </div>
      </Modal>
    );
  };
  
  // 中央カード選択モーダル
  const renderCenterCardSelectionModal = () => (
    <Modal
      isOpen={centerCardSelection}
      onClose={() => setCenterCardSelection(false)}
      title="確認する中央カードを選択"
    >
      <div className="flex flex-wrap justify-center gap-4">
        {centerCards.map((cardRole, index) => (
          <div 
            key={index}
            className="text-center cursor-pointer"
            onClick={() => handleSelectCenterCard(index)}
          >
            <Card 
              role="back"
              size="md"
            />
            <div className="mt-2 font-medium">カード {index + 1}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
  
  // 待機画面
  const renderWaitingScreen = () => (
    <div className="text-center max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">他のプレイヤーを待っています</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800">全員の行動が完了するまでお待ちください。</p>
      </div>
      
      {myPlayer?.isHost && (
        <Button 
          onClick={handleStartDayPhase}
          variant="success"
        >
          昼のフェーズへ進む
        </Button>
      )}
    </div>
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
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">夜のフェーズ</h1>
        
        {/* 現在のステップに応じた表示 */}
        {currentStep === 'viewRole' && renderRoleView()}
        {showOtherWolves && renderWolvesList()}
        {currentStep === 'useAbility' && !abilityUsed && renderAbilityUI()}
        {currentStep === 'waitingOthers' && renderWaitingScreen()}
        
        {/* モーダル */}
        {renderPlayerSelectionModal()}
        {renderCenterCardSelectionModal()}
        {renderAlertModal()}
      </div>
    </div>
  );
}

export default NightPhase;
