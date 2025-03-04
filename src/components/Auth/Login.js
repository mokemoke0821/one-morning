import React, { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../firebase/auth';
import './Login.css';

function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [playerName, setPlayerName] = useState('');

  const handleGuestLogin = async () => {
    if (!playerName.trim()) {
      setError('プレイヤー名を入力してください');
      return;
    }

    try {
      setLoading(true);
      await signInAnonymously(auth);
      // ローカルストレージにプレイヤー名を保存
      localStorage.setItem('playerName', playerName);
      // 成功時は自動的にApp.jsのルート保護によりリダイレクトされる
    } catch (error) {
      setError('ログインに失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">ワンモーニング人狼</h1>
        <p className="login-subtitle">短時間で楽しめる人狼ゲーム</p>
        
        <div className="game-rules">
          <h2 className="rules-title">ワンモーニング人狼のルール</h2>
          <ul className="rules-list">
            <li><strong>ゲームの目的:</strong> 自分の陣営を勝利に導くため議論と推理を駆使する</li>
            
            <li><strong>ゲームの流れ:</strong>
              <ol>
                <li>各プレイヤーにランダムで役職が配布される</li>
                <li>役職カミングアウト(CO)と能力使用の議論（約2分）</li>
                <li>投票で最も疑わしいプレイヤーを追放</li>
                <li>追放された役職で勝敗が決まる</li>
              </ol>
            </li>
            
            <li><strong>役職:</strong>
              <ul>
                <li><strong>村人陣営</strong>: 正直に役職COする（占い師/護衛/霊媒師）</li>
                <li><strong>人狼陣営</strong>: 村人陣営の役職になりすまし、村人たちを欺く。投票で村人を追放させれば勝利。</li>
                <li><strong>第三陣営</strong>: 
                  <ul>
                    <li>狐: 占い師や護衛のターゲットになると即座に勝利</li>
                    <li>露出狂: 占い師や護衛のターゲットになると同時に即座に勝利</li>
                  </ul>
                </li>
              </ul>
            </li>
            
            <li><strong>能力:</strong>
              <ul>
                <li><strong>占い師</strong>: 未COプレイヤーの役職を確認</li>
                <li><strong>護衛</strong>: すでにCOしたプレイヤーの役職を確認</li>
                <li><strong>霊媒師</strong>: 余った役職カードを1枚確認</li>
              </ul>
            </li>
          </ul>
        </div>
        
        <div className="input-group">
          <label htmlFor="playerName">プレイヤー名</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="名前を入力してください"
            className="login-input"
          />
        </div>
        
        <button 
          onClick={handleGuestLogin} 
          disabled={loading}
          className="login-button"
        >
          {loading ? 'ログイン中...' : 'ゲストとしてプレイ'}
        </button>
        
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

export default Login;
