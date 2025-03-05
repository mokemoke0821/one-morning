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
            <li><strong>特徴:</strong>
              <ul>
                <li><strong>夜時間なし!</strong> 議論中にCOして相手のカードを見る1日完結型人狼ゲーム</li>
                <li><strong>議論時間2分</strong>で手軽に遊べる、カードを使った正体隠匿ゲーム</li>
                <li>各プレイヤーは役職カードを1枚引き、余ったカードは中央に置かれます</li>
              </ul>
            </li>
            
            <li><strong>チームと役職:</strong>
              <ul>
                <li><strong>むらびとチーム</strong>: むらびと、うらないし(占い師)、ごえい(護衛)、れいばいし(霊媒師)</li>
                <li><strong>おおかみチーム</strong>: おおかみ</li>
                <li><strong>きつねチーム</strong>: きつね</li>
                <li><strong>関係ないやつら</strong>: ろしゅつきょう(露出狂)、みてはいけないもの</li>
              </ul>
            </li>
            
            <li><strong>CO(役職宣言)ルール:</strong>
              <ul>
                <li><strong>むらびとチーム</strong>: 必ず本当の役職をCOする(嘘つき禁止)</li>
                <li><strong>おおかみ/きつね/ろしゅつきょう</strong>: 「おおかみ」「きつね」「関係ないやつら」の中から1つを選んでCO</li>
              </ul>
            </li>
            
            <li><strong>能力(COした後に使用):</strong>
              <ul>
                <li><strong>うらないし</strong>: まだCOしていないプレイヤー1人のカードを確認</li>
                <li><strong>ごえい</strong>: すでにCOしたプレイヤー1人のカードを確認</li>
                <li><strong>れいばいし</strong>: 中央に置かれたカード1枚を確認</li>
              </ul>
            </li>
            
            <li><strong>特殊条件:</strong>
              <ul>
                <li><strong>きつね</strong>: うらないし/ごえいに見られると即敗北</li>
                <li><strong>ろしゅつきょう</strong>: うらないし/ごえいに見られると見た人と同時勝利</li>
                <li><strong>みてはいけないもの</strong>: れいばいしに中央カードとして見られると議論終了</li>
              </ul>
            </li>
          </ul>
          <p className="text-xs mt-2 text-center">詳細なルールは<a href="https://puzzliar.com/onemorning" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">公式サイト</a>をご覧ください</p>
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
