import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = (import.meta.env.VITE_API_URL as string).replace('/api', '')

let socket: Socket | null = null

export function connectSocket (token: string): void {
  if (socket) socket.disconnect()

  socket = io(SOCKET_URL, {
    auth: { token },
  })

  socket.on('connect_error', err => {
    console.warn('[Socket] Connection error:', err.message)
  })
}

export function disconnectSocket (): void {
  socket?.disconnect()
  socket = null
}

export function getSocket (): Socket | null {
  return socket
}
