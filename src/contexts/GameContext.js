import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  query,
  where,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { useAuth } from './AuthContext';

const GameContext = createContext();

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gameId, setGameId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState('setup'); // setup, lobby, night, day, result
  const [players, setPlayers] = useState([]);
  const [availableGames, setAvailableGames] = useState([]);
  const [gameResult, setGameResult] = useState(null);
  const [votes, setVotes] = useState({});
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [centerCards, setCenterCards] = useState([]);
  
  // 役職リスト（4〜8人のプレイに最適化）
  const roleDistribution = {
    4: { werewolf: 1, villager: 1, seer: 1, guard: 1, medium: 0, fox: 0, exposer: 0, unknown: 0 },
    5: { werewolf: 1, villager: 2, seer: 1, guard: 1, medium: 0, fox: 0, exposer: 0, unknown: 0 },
    6: { werewolf: 1, villager: 3, seer: 1, guard: 1, medium: 0, fox: 0, exposer: 0, unknown: 0 },
    7: { werewolf: 2, villager: 3, seer: 1, guard: 1, medium: 0, fox: 0, exposer: 0, unknown: 0 },
    8: { werewolf: 2, villager: 3, seer: 1, guard: 1, medium: 1, fox: 0, exposer: 0, unknown: 0 }
  };

  // 役職情報
  const roleInfo = {
    werewolf: {
      name: 'おおかみ',
      team: 'werewolf',
      description: '村人チームに紛れ、追放されないように振る舞います。COの際は「おおかみ」「きつね」「関係ないやつら」から選べます'
    },
    villager: {
      name: 'むらびと',
      team: 'villager',
      description: '必ず正直に「むらびと」とCOして、人狼を見つけ出して追放しましょう'
    },
    seer: {
      name: 'うらないし',
      team: 'villager',
      description: '必ず正直に「うらないし」とCOし、まだCOしていないプレイヤーのカードを1枚見ることができます',
      ability: 'まだCOしていないプレイヤーのカードを確認'
    },
    guard: {
      name: 'ごえい',
      team: 'villager',
      description: '必ず正直に「ごえい」とCOし、すでにCOしたプレイヤーのカードを1枚見ることができます',
      ability: 'すでにCOしたプレイヤーのカードを確認'
    },
    medium: {
      name: 'れいばいし',
      team: 'villager',
      description: '必ず正直に「れいばいし」とCOし、中央に置かれたカードを1枚見ることができます',
      ability: '中央カードを1枚確認'
    },
    fox: {
      name: 'きつね',
      team: 'fox',
      description: 'うらないしかごえいにカードを見られると即敗北。COの際は「おおかみ」「きつね」「関係ないやつら」から選べます'
    },
    exposer: {
      name: 'ろしゅつきょう',
      team: 'exposer',
      description: 'うらないしかごえいにカードを見られると見た人と同時勝利。COの際は「おおかみ」「きつね」「関係ないやつら」から選べます'
    },
    unknown: {
      name: 'みてはいけないもの',
      team: 'unknown',
      description: 'れいばいしに中央カードとして見られると議論終了・投票へ。特殊勝利条件なし'
    }
  };

  // 利用可能なゲームを取得
  useEffect(() => {
    if (!currentUser) return;
    
    const gamesQuery = query(
      collection(db, 'games'),
      where('status', '==', 'waiting')
    );
    
    const unsubscribe = onSnapshot(gamesQuery, (snapshot) => {
      const games = [];
      snapshot.forEach((doc) => {
        games.push({ id: doc.id, ...doc.data() });
      });
      setAvailableGames(games);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // 特定のゲームを監視
  useEffect(() => {
    if (!gameId) return;
    
    const gameRef = doc(db, 'games', gameId);
    
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        const gameData = docSnap.data();
        setPlayers(gameData.players || []);
        setGameState(gameData.status || 'lobby');
        
        if (gameData.votes) {
          setVotes(gameData.votes);
        }
        
        if (gameData.result) {
          setGameResult(gameData.result);
        }
        
        if (gameData.timer !== undefined) {
          setTimer(gameData.timer);
          setIsTimerRunning(gameData.isTimerRunning || false);
        }

        if (gameData.centerCards) {
          setCenterCards(gameData.centerCards);
        }
      }
    });
    
    return () => unsubscribe();
  }, [gameId]);

  // 新しいゲームを作成
  const createGame = async (playerName, playerCount) => {
    if (!currentUser || !playerName) {
      setError('ゲームを作成するにはログインしてプレイヤー名を設定してください');
      return null;
    }
    
    try {
      const gameRef = await addDoc(collection(db, 'games'), {
        hostId: currentUser.uid,
        status: 'waiting',
        playerCount,
        createdAt: serverTimestamp(),
        players: [{
          id: currentUser.uid,
          name: playerName,
          role: '',
          roleClaim: '',
          isAlive: true,
          isHost: true,
          hasUsedAbility: false
        }]
      });
      
      setGameId(gameRef.id);
      setIsHost(true);
      setGameState('lobby');
      return gameRef.id;
    } catch (error) {
      setError(`ゲーム作成エラー: ${error.message}`);
      return null;
    }
  };

  // ゲームに参加
  const joinGame = async (gameToJoin, playerName) => {
    if (!currentUser || !playerName) {
      setError('ゲームに参加するにはログインしてプレイヤー名を設定してください');
      return false;
    }
    
    try {
      const gameRef = doc(db, 'games', gameToJoin.id);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        
        // プレイヤーが既に参加しているか確認
        const isPlayerAlreadyJoined = gameData.players.some(player => player.id === currentUser.uid);
        
        if (isPlayerAlreadyJoined) {
          setGameId(gameToJoin.id);
          setIsHost(gameData.hostId === currentUser.uid);
          return true;
        }
        
        // プレイヤー数の上限を確認
        if (gameData.players.length >= gameData.playerCount) {
          setError('このゲームは満員です');
          return false;
        }
        
        // このゲームのホストのIDを取得
        const hostId = gameData.hostId;
        
        // ゲームに参加するためのカスタム関数
        const joinGameFunction = async () => {
          try {
            // プレイヤーを追加
            const updatedPlayers = [
              ...gameData.players,
              {
                id: currentUser.uid,
                name: playerName,
                role: '',
                roleClaim: '',
                isAlive: true,
                isHost: false,
                hasUsedAbility: false
              }
            ];
            
            await updateDoc(gameRef, {
              players: updatedPlayers
            });
            
            setGameId(gameToJoin.id);
            setIsHost(false);
            return true;
          } catch (error) {
            console.error("ゲーム参加更新エラー:", error);
            throw error;
          }
        };
        
        // Firestoreのセキュリティルールの現状に基づいてゲーム参加処理
        try {
          return await joinGameFunction();
        } catch (error) {
          // エラーログ
          console.error("ゲーム参加エラー詳細:", error);
          setError(`ゲーム参加エラー: ${error.message}。権限が不足しています。`);
          return false;
        }
      }
      return false;
    } catch (error) {
      setError(`ゲーム参加エラー: ${error.message}`);
      return false;
    }
  };

  // ゲームを離れる
  const leaveGame = async () => {
    if (!gameId || !currentUser) return false;
    
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        
        // ホストの場合はゲームを削除
        if (gameData.hostId === currentUser.uid) {
          await deleteDoc(gameRef);
        } else {
          // ホストでない場合はプレイヤーリストから自分を削除
          const updatedPlayers = gameData.players.filter(player => player.id !== currentUser.uid);
          await updateDoc(gameRef, {
            players: updatedPlayers
          });
        }
      }
      
      setGameId(null);
      setIsHost(false);
      setGameState('setup');
      return true;
    } catch (error) {
      setError(`ゲーム退出エラー: ${error.message}`);
      return false;
    }
  };

  // ゲーム開始
  const startGame = async () => {
    if (!isHost || !gameId) return false;
    
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        let playersList = [...gameData.players];
        
        // 役職の割り当て
        const roles = [];
        const distribution = roleDistribution[playersList.length];
        
        if (!distribution) {
          setError('現在のプレイヤー数に対応する役職配分が設定されていません');
          return false;
        }
        
        for (const [role, count] of Object.entries(distribution)) {
          for (let i = 0; i < count; i++) {
            roles.push(role);
          }
        }
        
        // 役職をシャッフル
        for (let i = roles.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [roles[i], roles[j]] = [roles[j], roles[i]];
        }
        
        // 中央カードの設定
        const centerCardRoles = roles.slice(playersList.length);
        
        // プレイヤーに役職を割り当て
        playersList = playersList.map((player, index) => ({
          ...player,
          role: roles[index] || 'villager',
          roleClaim: '',
          hasUsedAbility: false
        }));
        
        await updateDoc(gameRef, {
          status: 'night',
          players: playersList,
          centerCards: centerCardRoles,
          timer: 0,
          isTimerRunning: false,
          votes: {},
          result: null
        });
        return true;
      }
      return false;
    } catch (error) {
      setError(`ゲーム開始エラー: ${error.message}`);
      return false;
    }
  };

  // 昼のフェーズ開始
  const startDayPhase = async () => {
    if (!gameId) return false;
    
    try {
      await updateDoc(doc(db, 'games', gameId), {
        status: 'day',
        votes: {},
        timer: 120, // 2分
        isTimerRunning: true
      });
      return true;
    } catch (error) {
      setError(`昼フェーズ開始エラー: ${error.message}`);
      return false;
    }
  };

  // 役職CO
  const declareRole = async (playerId, roleClaim) => {
    if (!gameId) return false;
    
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        const updatedPlayers = gameData.players.map(player => {
          if (player.id === playerId) {
            return { ...player, roleClaim };
          }
          return player;
        });
        
        await updateDoc(gameRef, {
          players: updatedPlayers
        });
        return true;
      }
      return false;
    } catch (error) {
      setError(`役職CO処理エラー: ${error.message}`);
      return false;
    }
  };

  // 能力使用
  const useAbility = async (playerId, targetId = null, centerCardIndex = null) => {
    if (!gameId) return { success: false, result: null };
    
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        const player = gameData.players.find(p => p.id === playerId);
        
        if (!player) {
          return { success: false, result: null };
        }
        
        if (player.hasUsedAbility) {
          return { success: false, result: '能力は既に使用済みです' };
        }
        
        let result = null;
        let specialResult = null;
        
        // 役職別の能力処理
        if (player.role === 'seer' && targetId) {
          // 占い師の能力: COしていないプレイヤーのカードを見る
          const targetPlayer = gameData.players.find(p => p.id === targetId);
          
          if (!targetPlayer) {
            return { success: false, result: '対象プレイヤーが見つかりません' };
          }
          
          if (targetPlayer.roleClaim) {
            return { success: false, result: '占い師は役職COしていないプレイヤーしか占えません' };
          }
          
          result = {
            playerName: targetPlayer.name,
            role: targetPlayer.role
          };
          
          // 狐/露出狂の特殊条件チェック
          if (targetPlayer.role === 'fox') {
            specialResult = {
              type: 'foxLoss',
              message: '狐が占われました！狐の敗北です。'
            };
          } else if (targetPlayer.role === 'exposer') {
            specialResult = {
              type: 'exposerWin',
              message: '露出狂が占われました！露出狂とあなたの同時勝利です。'
            };
          }
        }
        else if (player.role === 'guard' && targetId) {
          // 護衛の能力: COしたプレイヤーのカードを見る
          const targetPlayer = gameData.players.find(p => p.id === targetId);
          
          if (!targetPlayer) {
            return { success: false, result: '対象プレイヤーが見つかりません' };
          }
          
          if (!targetPlayer.roleClaim) {
            return { success: false, result: '護衛は役職CO済みのプレイヤーしか護衛できません' };
          }
          
          result = {
            playerName: targetPlayer.name,
            role: targetPlayer.role
          };
          
          // 狐/露出狂の特殊条件チェック
          if (targetPlayer.role === 'fox') {
            specialResult = {
              type: 'foxLoss',
              message: '狐が護衛されました！狐の敗北です。'
            };
          } else if (targetPlayer.role === 'exposer') {
            specialResult = {
              type: 'exposerWin',
              message: '露出狂が護衛されました！露出狂とあなたの同時勝利です。'
            };
          }
        }
        else if (player.role === 'medium' && centerCardIndex !== null) {
          // 霊媒師の能力: 中央カードを1枚見る
          if (centerCardIndex < 0 || centerCardIndex >= gameData.centerCards.length) {
            return { success: false, result: '無効なカードインデックスです' };
          }
          
          const centerRole = gameData.centerCards[centerCardIndex];
          
          result = {
            cardIndex: centerCardIndex,
            role: centerRole
          };
          
          // 「見てはいけないもの」特殊条件チェック
          if (centerRole === 'unknown') {
            specialResult = {
              type: 'unknownLoss',
              message: '「見てはいけないもの」が発見されました！全員敗北です。'
            };
          }
        }
        
        // 能力使用済みマーク
        const updatedPlayers = gameData.players.map(p => {
          if (p.id === playerId) {
            return { ...p, hasUsedAbility: true };
          }
          return p;
        });
        
        await updateDoc(gameRef, {
          players: updatedPlayers
        });
        
        // 特殊勝利/敗北条件が発生した場合の処理
        if (specialResult) {
          await updateDoc(gameRef, {
            status: 'result',
            result: {
              type: specialResult.type,
              message: specialResult.message,
              winnerIds: specialResult.type === 'exposerWin' 
                ? [playerId, targetId] 
                : specialResult.type === 'foxLoss'
                  ? []
                  : []
            }
          });
        }
        
        return { 
          success: true, 
          result,
          specialResult
        };
      }
      
      return { success: false, result: null };
    } catch (error) {
      setError(`能力使用エラー: ${error.message}`);
      return { success: false, result: null };
    }
  };

  // 投票処理
  const vote = async (voterId, targetId) => {
    if (!gameId) return false;
    
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        const votesData = gameData.votes || {};
        
        // 投票を更新
        votesData[voterId] = targetId;
        
        await updateDoc(gameRef, {
          votes: votesData
        });
        return true;
      }
      return false;
    } catch (error) {
      setError(`投票エラー: ${error.message}`);
      return false;
    }
  };

  // 投票の集計と結果判定
  const calculateResults = async () => {
    if (!gameId || !isHost) return false;
    
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        const votesData = gameData.votes || {};
        
        // 投票が無い場合
        if (Object.keys(votesData).length === 0) {
          await updateDoc(gameRef, {
            result: {
              type: 'noVotes',
              message: '投票が行われませんでした。',
              eliminatedPlayer: null
            },
            status: 'result'
          });
          return true;
        }
        
        // 投票集計
        const voteCounts = {};
        Object.values(votesData).forEach(targetId => {
          voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        });
        
        // 最多得票者を特定
        let maxVotes = 0;
        let eliminatedPlayers = [];
        
        Object.entries(voteCounts).forEach(([playerId, count]) => {
          if (count > maxVotes) {
            maxVotes = count;
            eliminatedPlayers = [playerId];
          } else if (count === maxVotes) {
            eliminatedPlayers.push(playerId);
          }
        });
        
        // 同数の場合はランダムに1人を選ぶ
        let eliminatedId = null;
        if (eliminatedPlayers.length > 0) {
          eliminatedId = eliminatedPlayers[Math.floor(Math.random() * eliminatedPlayers.length)];
        }
        
        // プレイヤーの状態を更新
        const updatedPlayers = gameData.players.map(player => {
          if (player.id === eliminatedId) {
            return { ...player, isAlive: false };
          }
          return player;
        });
        
        // 脱落したプレイヤー情報
        const eliminatedPlayer = eliminatedId ? updatedPlayers.find(player => player.id === eliminatedId) : null;
        
        // 勝敗判定
        const aliveWerewolves = updatedPlayers.filter(p => p.role === 'werewolf' && p.isAlive).length;
        const aliveVillagers = updatedPlayers.filter(p => p.role !== 'werewolf' && p.isAlive).length;
        
        let resultType = 'ongoing';
        let resultMessage = '';
        
        if (aliveWerewolves === 0) {
          resultType = 'villagerWin';
          resultMessage = '村人陣営の勝利！すべての人狼が追放されました。';
        } else if (aliveWerewolves >= aliveVillagers) {
          resultType = 'werewolfWin';
          resultMessage = '人狼陣営の勝利！人狼の数が村人以上になりました。';
        } else {
          resultType = 'elimination';
          if (eliminatedPlayer) {
            const roleName = roleInfo[eliminatedPlayer.role]?.name || eliminatedPlayer.role;
            resultMessage = `${eliminatedPlayer.name}さん(${roleName})が追放されました。`;
          } else {
            resultMessage = '追放者はいませんでした。';
          }
        }
        
        await updateDoc(gameRef, {
          players: updatedPlayers,
          result: {
            type: resultType,
            message: resultMessage,
            eliminatedPlayer: eliminatedPlayer ? {
              id: eliminatedPlayer.id,
              name: eliminatedPlayer.name,
              role: eliminatedPlayer.role
            } : null
          },
          status: resultType === 'ongoing' ? 'day' : 'result'
        });
        
        return true;
      }
      return false;
    } catch (error) {
      setError(`結果計算エラー: ${error.message}`);
      return false;
    }
  };

  // ゲームをリセット
  const resetGame = async () => {
    if (!gameId || !isHost) return false;
    
    try {
      await updateDoc(doc(db, 'games', gameId), {
        status: 'waiting',
        votes: {},
        result: null,
        timer: 0,
        isTimerRunning: false,
        centerCards: [],
        players: players.map(player => ({
          ...player,
          role: '',
          roleClaim: '',
          isAlive: true,
          hasUsedAbility: false
        }))
      });
      return true;
    } catch (error) {
      setError(`ゲームリセットエラー: ${error.message}`);
      return false;
    }
  };

  // ゲーム情報の更新
  const updateGameData = async (updateData) => {
    if (!gameId) return false;
    
    try {
      await updateDoc(doc(db, 'games', gameId), updateData);
      return true;
    } catch (error) {
      setError(`ゲーム更新エラー: ${error.message}`);
      return false;
    }
  };

  const value = {
    // 状態
    loading,
    error,
    gameId,
    isHost,
    gameState,
    players,
    availableGames,
    gameResult,
    votes,
    timer,
    isTimerRunning,
    centerCards,
    
    // 定数
    roleDistribution,
    roleInfo,
    
    // メソッド
    createGame,
    joinGame,
    leaveGame,
    startGame,
    startDayPhase,
    declareRole,
    useAbility,
    vote,
    calculateResults,
    resetGame,
    updateGameData,
    
    // エラー管理
    setError
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
