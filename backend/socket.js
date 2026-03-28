let ioInstance = null;

export const setIo = (io) => {
  ioInstance = io;
};

export const getIo = () => {
  if (!ioInstance) {
    throw new Error("Socket.io is not initialized yet.");
  }
  return ioInstance;
};