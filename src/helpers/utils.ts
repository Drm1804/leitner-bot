export  async function pause(val = 100): Promise<null> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(null);
    }, val)
  })
}

export function randomArrayElement(arr: unknown[]): unknown {
  const random = Math.floor(Math.random() * arr.length);
  return arr[random]
}

export function mixArray(arr: unknown[]): unknown[] {
  return arr.sort(() => 0.5 - Math.random());
}

export function getUserId(ctx): number {
  return ctx?.message?.chat?.id || ctx?.update?.callback_query?.from?.id || 0;
}
