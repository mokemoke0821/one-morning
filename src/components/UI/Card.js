import React from 'react';

function Card({ 
  role, 
  flipped = false, 
  size = 'md', 
  onClick = null, 
  disabled = false,
  selected = false,
  className = '' 
}) {
  const baseStyles = 'rounded-lg shadow-md transition-all duration-300 transform text-center relative';
  
  const sizeStyles = {
    sm: 'w-16 h-24',
    md: 'w-24 h-36',
    lg: 'w-32 h-48',
  };
  
  const roleStyles = {
    werewolf: 'bg-red-700 text-white border-red-900',
    villager: 'bg-green-600 text-white border-green-800',
    seer: 'bg-purple-600 text-white border-purple-800',
    guard: 'bg-blue-600 text-white border-blue-800',
    medium: 'bg-yellow-500 text-white border-yellow-700',
    fox: 'bg-orange-500 text-white border-orange-700',
    exposer: 'bg-pink-500 text-white border-pink-700',
    unknown: 'bg-gray-800 text-white border-black',
    back: 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-blue-900'
  };
  
  const hoverStyles = onClick && !disabled ? 'cursor-pointer hover:scale-105' : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const selectedStyles = selected ? 'ring-4 ring-yellow-400 ring-opacity-70' : '';
  
  const cardStyles = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${roleStyles[flipped ? 'back' : (role || 'back')]}
    ${hoverStyles}
    ${disabledStyles}
    ${selectedStyles}
    ${className}
    border-2
  `.trim();

  const getCardContent = () => {
    if (flipped) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-xs md:text-sm font-bold">ワンモーニング人狼</div>
        </div>
      );
    }

    // 役職名の日本語表示
    const roleNames = {
      werewolf: 'おおかみ',
      villager: 'むらびと',
      seer: 'うらないし',
      guard: 'ごえい',
      medium: 'れいばいし',
      fox: 'きつね',
      exposer: 'ろしゅつきょう',
      unknown: '???'
    };

    // 役職アイコン
    const roleIcons = {
      werewolf: '🐺',
      villager: '👨‍🌾',
      seer: '🔮',
      guard: '🛡️',
      medium: '📿',
      fox: '🦊',
      exposer: '📸',
      unknown: '⚠️'
    };

    return (
      <div className="flex flex-col items-center justify-center h-full p-1">
        <div className="text-2xl mb-1">{roleIcons[role] || '❓'}</div>
        <div className="text-xs md:text-sm font-bold">{roleNames[role] || '不明'}</div>
      </div>
    );
  };

  return (
    <div 
      className={cardStyles}
      onClick={!disabled && onClick ? onClick : undefined}
    >
      {getCardContent()}
    </div>
  );
}

export default Card;
