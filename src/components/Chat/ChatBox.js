import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase/firestore';
import Button from '../UI/Button';

function ChatBox({ gameId }) {
  const { currentUser } = useAuth();
  const { players, isAdmin } = useGame();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // 現在ログイン中のプレイヤー情報を取得
  const currentPlayer = players.find(player => player.id === currentUser?.uid);

  // チャットメッセージを監視
  useEffect(() => {
    if (!gameId || !currentUser) return;
    
    const messagesRef = collection(db, 'games', gameId, 'chatMessages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = [];
      snapshot.forEach((doc) => {
        messagesData.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messagesData);
      scrollToBottom();
    });
    
    return unsubscribe;
  }, [gameId, currentUser]);

  // メッセージが更新されたら自動スクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // メッセージ送信処理
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser || !gameId || !currentPlayer) return;
    
    try {
      const messagesRef = collection(db, 'games', gameId, 'chatMessages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderUid: currentUser.uid,
        senderName: currentPlayer.name,
        timestamp: serverTimestamp(),
        isAdmin: isAdmin // 管理者かどうかのフラグを追加
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* チャットヘッダー */}
      <div 
        className="bg-blue-700 text-white px-4 py-2 flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-bold">チャット</h3>
        <span>{isOpen ? '▼' : '▲'}</span>
      </div>
      
      {isOpen && (
        <>
          {/* メッセージ表示エリア */}
          <div className="h-64 overflow-y-auto p-3 bg-gray-50 border-b">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 py-4">メッセージはまだありません</p>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`mb-2 ${message.senderUid === currentUser?.uid ? 'text-right' : 'text-left'}`}
                >
                  <div 
                    className={`inline-block max-w-xs px-3 py-2 rounded-lg 
                    ${message.senderUid === currentUser?.uid 
                      ? 'bg-blue-100 text-blue-900' 
                      : 'bg-gray-200 text-gray-900'} 
                    ${message.isAdmin ? 'border-2 border-red-500' : ''}`}
                  >
                    <div className="text-xs font-bold text-gray-600 mb-1">
                      {message.senderName}
                      {message.isAdmin && <span className="text-red-500 ml-1">[管理者]</span>}
                    </div>
                    <div>{message.text}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* メッセージ入力エリア */}
          <form onSubmit={handleSendMessage} className="p-2 flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="メッセージを入力..."
              maxLength={100}
            />
            <Button 
              type="submit" 
              variant="primary"
              className="rounded-l-none py-2"
              disabled={!newMessage.trim()}
            >
              送信
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

export default ChatBox;
