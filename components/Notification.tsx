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
    <div className="fixed top-6 left-0 right-0 mx-auto z-[1000] animate-slideDown w-[90vw] max-w-[320px]">
      <div className={`${bgColor} text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 border-2 border-white`}>
        <span className="text-lg shrink-0">{icon}</span>
        <p className="font-bold text-xs md:text-sm text-center leading-tight whitespace-nowrap">{message}</p>
      </div>
      <style>{`
        @keyframes slideDown {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slideDown {
          animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};

export default Notification;