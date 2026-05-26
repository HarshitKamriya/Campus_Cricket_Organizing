import toast from 'react-hot-toast';

export const wicketToast = (message) => {
  toast(message, {
    icon: '🏏',
    style: {
      background: 'rgba(255, 23, 68, 0.15)',
      border: '1px solid rgba(255, 23, 68, 0.3)',
      color: '#ff1744',
      backdropFilter: 'blur(12px)',
    },
    duration: 4000,
  });
};

export const boundaryToast = (message) => {
  toast(message, {
    icon: '🎯',
    style: {
      background: 'rgba(255, 193, 7, 0.15)',
      border: '1px solid rgba(255, 193, 7, 0.3)',
      color: '#ffc107',
      backdropFilter: 'blur(12px)',
    },
    duration: 3000,
  });
};

export const sixToast = (message) => {
  toast(message, {
    icon: '🔥',
    style: {
      background: 'rgba(255, 112, 67, 0.15)',
      border: '1px solid rgba(255, 112, 67, 0.3)',
      color: '#ff7043',
      backdropFilter: 'blur(12px)',
    },
    duration: 4000,
  });
};

export const matchEndToast = (message) => {
  toast(message, {
    icon: '🏆',
    style: {
      background: 'rgba(0, 230, 118, 0.15)',
      border: '1px solid rgba(0, 230, 118, 0.3)',
      color: '#00e676',
      backdropFilter: 'blur(12px)',
    },
    duration: 5000,
  });
};

export const infoToast = (message) => {
  toast(message, {
    icon: 'ℹ️',
    style: {
      background: 'rgba(0, 176, 255, 0.15)',
      border: '1px solid rgba(0, 176, 255, 0.3)',
      color: '#00b0ff',
      backdropFilter: 'blur(12px)',
    },
  });
};

export const errorToast = (message) => {
  toast.error(message, {
    style: {
      background: 'rgba(213, 0, 0, 0.15)',
      border: '1px solid rgba(213, 0, 0, 0.3)',
      color: '#ff1744',
      backdropFilter: 'blur(12px)',
    },
  });
};
