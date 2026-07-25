import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let socketSingleton = null;

export function getSocket() {
  if (!socketSingleton) {
    const token = localStorage.getItem('zg_token');
    socketSingleton = io(URL, {
      auth: { token },
      autoConnect: true,
      transports: ['polling', 'websocket'],
      extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
    });
  }
  return socketSingleton;
}

export function resetSocket() {
  if (socketSingleton) {
    socketSingleton.disconnect();
    socketSingleton = null;
  }
}

// Suscribe a un evento y limpia al desmontar
export function useSocketEvent(evento, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const cb = (data) => handlerRef.current(data);
    socket.on(evento, cb);
    return () => socket.off(evento, cb);
  }, [evento]);
}
