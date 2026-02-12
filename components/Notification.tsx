import React, { useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-rose-500';
  const icon = type === 'success' ? '✅' : '❌';

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-slideDown">
      <div className={`${bgColor} text-white px-8 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-3 min-w-[300px] border-4 border-white`}>
        <span className="text-xl">{icon}</span>
        <p className="font-black text-sm md:text-base whitespace-nowrap">{message}</p>
      </div>
      <style>{`
        @keyframes slideDown {
          0% { transform: translate(-50%, -20px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slideDown {
          animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};

export default Notification;