export function getTimestampSecond(lastTime: string | number, currentTime: string | number): number {
    const last = typeof lastTime === 'string' ? parseInt(lastTime) : lastTime
    const current = typeof currentTime === 'string' ? parseInt(currentTime) : currentTime
    return (current - last) / 1000
  }
  