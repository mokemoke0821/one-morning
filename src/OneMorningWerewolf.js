import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Firebase関連のインポート
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  deleteDoc, 
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

const OneMorningWerewolf = () => {
  // 認証状態
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  // ゲーム状態
  const [gameState, setGameState] = useState('login'); // login, setup, lobby, night, day, result
  const [gameId, setGameId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [playerCount, setPlayerCount] = useState(4);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [showRole, setShowRole] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [votes, setVotes] = useState({});
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);

  // 役職リスト
  const roleDistribution = {
    4: { werewolf: 1, villager: 2, seer: 1 },
    5: { werewolf: 1, villager: 3, seer: 1 },
    6: { werewolf: 2, villager: 3, seer: 1 },
    7: { werewolf: 2, villager: 4, seer: 1 },
    8: { werewolf: 2, villager: 5, seer: 1 },
  };

  // 役職説明
  const roleDescriptions = {
    werewolf: '人狼：他の人狼を確認し、昼に村人に紛れて投票します',
    villager: '村人：人狼を見つけて追放しましょう',
    seer: '占い師：夜に1人の正体を占うことができます',
  };

  // タイマー処理
  const timerInterval = useRef(null);

  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      timerInterval.current = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (gameState === 'day') {
        endDiscussion();
      }
    }
    return () => clearInterval(timerInterval.current);
  }, [isTimerRunning, timer, gameState]);

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // 利用可能なゲームを取得
  useEffect(() => {
    if (!user) return;
    
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
    });
    
    return () => unsubscribe();
  }, [user]);

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
      }
    });
    
    return () => unsubscribe();
  }, [gameId]);

  // 匿名ログイン
  const handleAnonymousLogin = async () => {
    try {
      if (!playerName) {
        setError('プレイヤー名を入力してください');
        return;
      }
      
      await signInAnonymously(auth);
      setGameState('setup');
    } catch (error) {
      setError(`ログインエラー: ${error.message}`);
    }
  };

  // ログアウト
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setGameState('login');
    } catch (error) {
      setError(`ログアウトエラー: ${error.message}`);
    }
  };

  // 新しいゲームを作成
  const createNewGame = async () => {
    if (!user || !playerName) {
      setError('ゲームを作成するにはログインしてプレイヤー名を設定してください');
      return;
    }
    
    try {
      const gameRef = await addDoc(collection(db, 'games'), {
        hostId: user.uid,
        status: 'waiting',
        playerCount,
        createdAt: serverTimestamp(),
        players: [{
          id: user.uid,
          name: playerName,
          role: '',
          isAlive: true,
          isHost: true
        }]
      });
      
      setGameId(gameRef.id);
      setIsHost(true);
      setGameState('lobby');
    } catch (error) {
      setError(`ゲーム作成エラー: ${error.message}`);
    }
  };

  // ゲームに参加
  const joinGame = async (gameToJoin) => {
    if (!user || !playerName) {
      setError('ゲームに参加するにはログインしてプレイヤー名を設定してください');
      return;
    }
    
    try {
      const gameRef = doc(db, 'games', gameToJoin.id);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        
        // プレイヤーが既に参加しているか確認
        const isPlayerAlreadyJoined = gameData.players.some(player => player.id === user.uid);
        
        if (isPlayerAlreadyJoined) {
          setGameId(gameToJoin.id);
          setIsHost(gameData.hostId === user.uid);
          return;
        }
        
        // プレイヤー数の上限を確認
        if (gameData.players.length >= gameData.playerCount) {
          setError('このゲームは満員です');
          return;
        }
        
        // プレイヤーを追加
        const updatedPlayers = [
          ...gameData.players,
          {
            id: user.uid,
            name: playerName,
            role: '',
            isAlive: true,
            isHost: false
          }
        ];
        
        await updateDoc(gameRef, {
          players: updatedPlayers
        });
        
        setGameId(gameToJoin.id);
        setIsHost(false);
      }
    } catch (error) {
      setError(`ゲーム参加エラー: ${error.message}`);
    }
  };

  // ゲームを離れる
  const leaveGame = async () => {
    if (!gameId || !user) return;
    
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        
        // ホストの場合はゲームを削除
        if (gameData.hostId === user.uid) {
          await deleteDoc(gameRef);
        } else {
          // ホストでない場合はプレイヤーリストから自分を削除
          const updatedPlayers = gameData.players.filter(player => player.id !== user.uid);
          await updateDoc(gameRef, {
            players: updatedPlayers
          });
        }
      }
      
      setGameId(null);
      setIsHost(false);
      setGameState('setup');
    } catch (error) {
      setError(`ゲーム退出エラー: ${error.message}`);
    }
  };

  // ゲーム情報を更新
  const updateGame = async (updateData) => {
    if (!gameId) return;
    
    try {
      const gameRef = doc(db, 'games', gameId);
      await updateDoc(gameRef, updateData);
    } catch (error) {
      setError(`ゲーム更新エラー: ${error.message}`);
    }
  };

  // ゲーム開始
  const startGame = async () => {
    if (!isHost || !gameId) return;
    
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        let playersList = [...gameData.players];
        
        // 役職の割り当て
        const roles = [];
        const distribution = roleDistribution[playersList.length];
        
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
        
        // プレイヤーに役職を割り当て
        playersList = playersList.map((player, index) => ({
          ...player,
          role: roles[index] || 'villager',
          checked: false
        }));
        
        await updateDoc(gameRef, {
          status: 'night',
          players: playersList
        });
      }
    } catch (error) {
      setError(`ゲーム開始エラー: ${error.message}`);
    }
  };

  // 役職確認
  const checkRoleAndProceed = () => {
    if (showRole) {
      setShowRole(false);
      if (currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex(currentPlayerIndex + 1);
      } else {
        handleNightActions();
      }
    } else {
      setShowRole(true);
    }
  };

  // 夜のアクション処理
  const handleNightActions = async () => {
    if (!gameId) return;
    
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        const seers = gameData.players.filter(player => player.role === 'seer');
        
        // 各プレイヤーが夜のアクションを実行したかをリセット
        const updatedPlayers = gameData.players.map(player => ({
          ...player,
          checked: false
        }));
        
        // 占い師がいない場合は昼のフェーズへ
        if (seers.length === 0) {
          await updateDoc(gameRef, {
            players: updatedPlayers,
            status: 'day',
            timer: 180,
            isTimerRunning: true
          });
        } else {
          // 占い師がいる場合は更新のみ
          await updateDoc(gameRef, {
            players: updatedPlayers
          });
          
          // 現在のプレイヤーを占い師に設定
          // 更新後のプレイヤーリストから占い師を検索
          const seerIndex = updatedPlayers.findIndex(p => p.role === 'seer');
          setCurrentPlayerIndex(seerIndex >= 0 ? seerIndex : 0);
        }
      }
    } catch (error) {
      setError(`夜のアクション処理エラー: ${error.message}`);
    }
  };

  // 占い結果の処理
  const handleSeerAction = async (targetId) => {
    if (!gameId || !user) return false;
    
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        const targetPlayer = gameData.players.find(p => p.id === targetId);
        
        if (!targetPlayer) return false;
        
        const isWerewolf = targetPlayer.role === 'werewolf';
        
        // プレイヤーをチェック済みにする
        const updatedPlayers = gameData.players.map(player => {
          if (player.id === user.uid) {
            return { ...player, checked: true };
          }
          return player;
        });
        
        // すべての占い師が行動を完了したか確認
        const allSeersChecked = updatedPlayers
          .filter(p => p.role === 'seer')
          .every(p => p.checked);
        
        await updateDoc(gameRef, {
          players: updatedPlayers,
          status: allSeersChecked ? 'day' : 'night',
          timer: allSeersChecked ? 180 : gameData.timer,
          isTimerRunning: allSeersChecked
        });
        
        return isWerewolf;
      }
      
      return false;
    } catch (error) {
      setError(`占い行動エラー: ${error.message}`);
      return false;
    }
  };

  // 昼のフェーズ開始
  const startDayPhase = async () => {
    if (!gameId) return;
    
    try {
      await updateDoc(doc(db, 'games', gameId), {
        status: 'day',
        votes: {},
        timer: 180,
        isTimerRunning: true
      });
    } catch (error) {
      setError(`昼フェーズ開始エラー: ${error.message}`);
    }
  };

  // 議論終了、投票へ
  const endDiscussion = async () => {
    if (!gameId) return;
    
    try {
      await updateDoc(doc(db, 'games', gameId), {
        isTimerRunning: false
      });
    } catch (error) {
      setError(`議論終了エラー: ${error.message}`);
    }
  };

  // 投票処理
  const handleVote = async (voterId, targetId) => {
    if (!gameId) return;
    
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
      }
    } catch (error) {
      setError(`投票エラー: ${error.message}`);
    }
  };

  // 投票の集計と結果判定
  const calculateVotes = async () => {
    if (!gameId || !isHost) return;
    
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        const votesData = gameData.votes || {};
        
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
        
        // ゲーム結果の判定
        const eliminatedPlayer = eliminatedId ? updatedPlayers.find(player => player.id === eliminatedId) : null;
        const remainingWerewolves = updatedPlayers.filter(player => player.role === 'werewolf' && player.isAlive).length;
        const remainingVillagers = updatedPlayers.filter(player => player.role !== 'werewolf' && player.isAlive).length;
        
        let result = {
          eliminatedPlayer: eliminatedPlayer ? {
            name: eliminatedPlayer.name,
            role: eliminatedPlayer.role
          } : null
        };
        
        if (remainingWerewolves === 0) {
          result.winner = 'villagers';
          result.message = '村人陣営の勝利！すべての人狼が追放されました。';
        } else if (remainingWerewolves >= remainingVillagers) {
          result.winner = 'werewolves';
          result.message = '人狼陣営の勝利！人狼の数が村人以上になりました。';
        } else {
          result.winner = 'undecided';
          if (eliminatedPlayer) {
            const roleText = eliminatedPlayer.role === 'werewolf' ? '人狼' : eliminatedPlayer.role === 'villager' ? '村人' : '占い師';
            result.message = `追放されたのは ${eliminatedPlayer.name} (${roleText}) でした。`;
          } else {
            result.message = '投票が行われませんでした。ゲームを続行します。';
          }
        }
        
        await updateDoc(gameRef, {
          players: updatedPlayers,
          result,
          status: 'result'
        });
      }
    } catch (error) {
      setError(`投票集計エラー: ${error.message}`);
    }
  };

  // ゲームをリセット
  const resetGame = async () => {
    if (!gameId || !isHost) return;
    
    try {
      await updateDoc(doc(db, 'games', gameId), {
        status: 'waiting',
        votes: {},
        result: null,
        timer: 0,
        isTimerRunning: false,
        players: players.map(player => ({
          ...player,
          role: '',
          isAlive: true,
          checked: false
        }))
      });
    } catch (error) {
      setError(`ゲームリセットエラー: ${error.message}`);
    }
  };

  // ログイン画面の表示
  const renderLogin = () => {
    return (
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">ワンモーニング人狼にログイン</h2>
        
        <div className="mb-4">
          <label className="block mb-2">プレイヤー名:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="あなたの名前を入力"
          />
        </div>
        
        <button
          onClick={handleAnonymousLogin}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4"
          disabled={!playerName}
        >
          ゲストとしてプレイ
        </button>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  };

  // ゲームセットアップ画面の表示
  const renderSetup = () => {
    return (
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">ゲームセットアップ</h2>
        
        <div className="mb-4">
          <label className="block mb-2">プレイヤー名:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            placeholder="あなたの名前を入力"
          />
          
          <label className="block mb-2">プレイヤー数:</label>
          <select 
            value={playerCount} 
            onChange={(e) => setPlayerCount(parseInt(e.target.value))}
            className="w-full p-2 border rounded mb-4"
          >
            <option value="4">4人</option>
            <option value="5">5人</option>
            <option value="6">6人</option>
            <option value="7">7人</option>
            <option value="8">8人</option>
          </select>
          
          <div className="mb-4">
            <h3 className="font-bold mb-2">役職配分:</h3>
            <ul className="list-disc pl-6">
              <li>人狼: {roleDistribution[playerCount].werewolf}人</li>
              <li>村人: {roleDistribution[playerCount].villager}人</li>
              <li>占い師: {roleDistribution[playerCount].seer}人</li>
            </ul>
          </div>
          
          <button
            onClick={createNewGame}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-2"
          >
            新しいゲームを作成
          </button>
        </div>
        
        <div className="mb-4">
          <h3 className="font-bold mb-2">または既存のゲームに参加:</h3>
          
          {availableGames.length === 0 ? (
            <p className="text-sm text-gray-500">現在利用可能なゲームはありません</p>
          ) : (
            <div className="space-y-2">
              {availableGames.map(game => (
                <div key={game.id} className="border p-2 rounded">
                  <p>ホスト: {game.players.find(p => p.isHost)?.name || '不明'}</p>
                  <p>プレイヤー: {game.players?.length || 0}/{game.playerCount}</p>
                  <button
                    onClick={() => joinGame(game)}
                    className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded text-sm"
                  >
                    参加する
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            ログアウト
          </button>
        </div>
        
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </div>
    );
  };

  // ロビー画面の表示
  const renderLobby = () => {
    return (
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">ゲームロビー</h2>
        
        <div className="mb-4">
          <h3 className="font-bold mb-2">参加プレイヤー ({players.length}):</h3>
          <ul className="border rounded p-2">
            {players.map((player, index) => (
              <li key={index} className="py-1 border-b last:border-b-0 flex justify-between">
                <span>{player.name}</span>
                {player.isHost && <span className="text-xs bg-yellow-100 px-2 py-1 rounded">ホスト</span>}
              </li>
            ))}
          </ul>
        </div>
        
        {isHost && (
          <div className="mb-4">
            <p className="text-sm mb-2">役職配分:</p>
            <ul className="text-sm pl-6 list-disc">
              <li>人狼: {roleDistribution[players.length]?.werewolf || 0}人</li>
              <li>村人: {roleDistribution[players.length]?.villager || 0}人</li>
              <li>占い師: {roleDistribution[players.length]?.seer || 0}人</li>
            </ul>
            
            <p className="mt-4 mb-2 text-sm">
              <span className="font-bold">ゲーム開始条件:</span> 最低4人のプレイヤーが必要です
            </p>
            
            <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4">
              <p className="text-sm">
                <span className="font-bold">部屋のID:</span> {gameId}
              </p>
              <p className="text-sm mt-1">他のプレイヤーに共有して参加してもらいましょう</p>
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          {isHost && (
            <button
              onClick={startGame}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              disabled={players.length < 4}
            >
              ゲーム開始 {players.length < 4 && `(あと${4-players.length}人必要)`}
            </button>
          )}
          
          <button
            onClick={leaveGame}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            退出する
          </button>
        </div>
        
        {!isHost && (
          <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200">
            <p className="text-sm">ホストがゲームを開始するのをお待ちください</p>
          </div>
        )}
        
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </div>
    );
  };
  
// 夜のフェーズの表示
  const renderNight = () => {
    const currentPlayer = players[currentPlayerIndex];
    const myPlayer = players.find(p => p.id === user?.uid);
    const isMyTurn = myPlayer && currentPlayer && myPlayer.id === currentPlayer.id;
    
    if (!currentPlayer) return null;
    
    return (
      <div className="p-4 max-w-md mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">夜のフェーズ</h2>
        
        {isMyTurn ? (
          !showRole ? (
            <div>
              <p className="mb-4">{currentPlayer.name}さん、あなたの役職を確認してください</p>
              <button
                onClick={checkRoleAndProceed}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4"
              >
                役職を確認する
              </button>
            </div>
          ) : (
            <div>
              <p className="text-lg font-bold mb-2">あなたは{currentPlayer.role === 'werewolf' ? '人狼' : currentPlayer.role === 'villager' ? '村人' : '占い師'}です</p>
              <p className="mb-4">{roleDescriptions[currentPlayer.role]}</p>
              
              {currentPlayer.role === 'werewolf' && (
                <div className="mb-4">
                  <p className="font-bold">他の人狼:</p>
                  <ul className="list-disc pl-6">
                    {players.filter(p => p.role === 'werewolf' && p.id !== currentPlayer.id).map((wolf, index) => (
                      <li key={index}>{wolf.name}</li>
                    ))}
                    {players.filter(p => p.role === 'werewolf' && p.id !== currentPlayer.id).length === 0 && (
                      <li>他の人狼はいません</li>
                    )}
                  </ul>
                </div>
              )}
              
              {currentPlayer.role === 'seer' && !currentPlayer.checked && (
                <div className="mb-4">
                  <p className="font-bold mb-2">誰を占いますか？</p>
                  <div className="grid grid-cols-2 gap-2">
                    {players.filter(p => p.id !== currentPlayer.id).map((player, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleSeerAction(player.id).then(isWerewolf => {
                            alert(`${player.name}は${isWerewolf ? '人狼' : '人狼ではありません'}です。`);
                          });
                        }}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
                      >
                        {player.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={checkRoleAndProceed}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                確認完了
              </button>
            </div>
          )
        ) : (
          <div>
            <p className="mb-4">{currentPlayer.name}さんが役職を確認しています</p>
            <p className="text-sm text-gray-500">他のプレイヤーが行動中です。しばらくお待ちください。</p>
          </div>
        )}
      </div>
    );
  };

  // 昼のフェーズの表示
  const renderDay = () => {
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    return (
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">昼のフェーズ - 議論</h2>
        
        <div className="mb-4 text-center">
          <p className="text-lg font-bold">残り時間: {formatTime(timer)}</p>
          {isHost && (
            <div>
              <button
                onClick={() => updateGame({ isTimerRunning: !isTimerRunning })}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded mr-2"
              >
                {isTimerRunning ? '一時停止' : '再開'}
              </button>
              <button
                onClick={endDiscussion}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded"
              >
                議論終了
              </button>
            </div>
          )}
        </div>
        
        {!isTimerRunning && (
          <div className="mb-4">
            <h3 className="font-bold mb-2">投票</h3>
            <p className="mb-2">追放する人を選んでください:</p>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {players.filter(player => player.isAlive).map((player, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (user) {
                      handleVote(user.uid, player.id);
                      alert(`${myPlayer?.name || 'あなた'}さんが${player.name}さんに投票しました`);
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  {player.name}
                </button>
              ))}
            </div>
            
            <div className="mb-4">
              <h4 className="font-bold mb-1">現在の投票状況:</h4>
              <ul>
                {Object.entries(votes).map(([voterId, targetId], index) => {
                  const voterPlayer = players.find(p => p.id === voterId);
                  const targetPlayer = players.find(p => p.id === targetId);
                  return (
                    <li key={index}>
                      {voterPlayer?.name || '不明'} → {targetPlayer?.name || '不明'}
                    </li>
                  );
                })}
                {Object.keys(votes).length === 0 && (
                  <li>まだ投票はありません</li>
                )}
              </ul>
            </div>
            
            {isHost && (
              <button
                onClick={calculateVotes}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                disabled={Object.keys(votes).length === 0}
              >
                投票集計
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // 結果画面の表示
  const renderResult = () => {
    // 勝者に応じた背景色を設定
    let resultBgColor = "bg-gray-50";
    let resultBorderColor = "border-gray-200";
    let resultIcon = "❓";
    
    if (gameResult?.winner === 'villagers') {
      resultBgColor = "bg-blue-50";
      resultBorderColor = "border-blue-200";
      resultIcon = "🏆";
    } else if (gameResult?.winner === 'werewolves') {
      resultBgColor = "bg-red-50";
      resultBorderColor = "border-red-200";
      resultIcon = "🐺";
    }
    
    // 自分の勝敗判定
    const myRole = myPlayer?.role || '';
    let iWon = false;
    
    if (gameResult?.winner === 'villagers' && myRole !== 'werewolf') {
      iWon = true;
    } else if (gameResult?.winner === 'werewolves' && myRole === 'werewolf') {
      iWon = true;
    }
    
    return (
      <div className="p-4 max-w-md mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">ゲーム結果</h2>
        
        <div className={`${resultBgColor} border ${resultBorderColor} rounded-lg p-4 mb-6 shadow-sm`}>
          <div className="text-3xl mb-2">{resultIcon}</div>
          <p className="text-lg font-bold mb-2">
            {gameResult?.winner === 'villagers' 
              ? '村人陣営の勝利！' 
              : gameResult?.winner === 'werewolves' 
                ? '人狼陣営の勝利！' 
                : '勝敗未決'}
          </p>
          <p className="mb-2">{gameResult?.message}</p>
          
          {gameResult?.eliminatedPlayer && (
            <p className="text-sm mt-2">
              追放されたプレイヤー: 
              <span className="font-medium ml-1">
                {gameResult.eliminatedPlayer.name}
                （{gameResult.eliminatedPlayer.role === 'werewolf' ? '人狼' : 
                   gameResult.eliminatedPlayer.role === 'villager' ? '村人' : '占い師'}）
              </span>
            </p>
          )}
          
          {iWon ? (
            <p className="mt-4 bg-green-100 text-green-800 p-2 rounded inline-block">あなたの勝利です！</p>
          ) : (
            gameResult?.winner && <p className="mt-4 bg-red-100 text-red-800 p-2 rounded inline-block">あなたの敗北です</p>
          )}
        </div>
        
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-bold mb-3">プレイヤー役職:</h3>
          <ul className="space-y-2 text-left">
            {players.map((player, index) => {
              let roleColor = "";
              
              if (player.role === "werewolf") {
                roleColor = "text-red-600";
              } else if (player.role === "seer") {
                roleColor = "text-purple-600";
              } else {
                roleColor = "text-green-600";
              }
              
              return (
                <li key={index} className={`py-1 px-2 rounded ${index % 2 === 0 ? 'bg-gray-50' : ''} ${!player.isAlive ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-center">
                    <span>
                      {player.name} 
                      {player.isHost && <span className="text-xs bg-yellow-100 ml-2 px-1 py-0.5 rounded">ホスト</span>}
                      {!player.isAlive && <span className="text-xs bg-gray-100 ml-2 px-1 py-0.5 rounded">追放</span>}
                    </span>
                    <span className={`font-medium ${roleColor}`}>
                      {player.role === 'werewolf' ? '人狼' : player.role === 'villager' ? '村人' : '占い師'}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="flex space-x-2">
          {isHost && (
            <button
              onClick={resetGame}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              新しいゲームを始める
            </button>
          )}
          
          <button
            onClick={leaveGame}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            ロビーに戻る
          </button>
        </div>
      </div>
    );
  };

  // ローディング表示
  const renderLoading = () => {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="sr-only">読み込み中...</span>
          </div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  };

  // ゲーム状態に応じたレンダリング
  if (isLoading) {
    return renderLoading();
  }

  // 自分のプレイヤー情報
  const myPlayer = players.find(p => p.id === user?.uid);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-900 text-white p-4 text-center">
        <h1 className="text-2xl font-bold">ワンモーニング人狼</h1>
        {user && myPlayer && (
          <p className="text-sm">プレイヤー: {myPlayer.name}</p>
        )}
      </header>
      
      <main className="flex-1 p-4">
        {!user && renderLogin()}
        {user && gameState === 'setup' && renderSetup()}
        {gameState === 'lobby' && renderLobby()}
        {gameState === 'night' && renderNight()}
        {gameState === 'day' && renderDay()}
        {gameState === 'result' && renderResult()}
      </main>
      
      <footer className="bg-gray-200 p-2 text-center text-sm">
        ワンモーニング人狼 - 短時間で楽しめる人狼ゲーム
      </footer>
    </div>
  );
};

export default OneMorningWerewolf;
