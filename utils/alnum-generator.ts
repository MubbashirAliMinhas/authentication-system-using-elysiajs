export function generateAlnum(amount: number = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const length = characters.length

  let randomString = ''

  for (let x = 0; x < amount; x++) {
    const index = Math.floor(Math.random() * length)
    randomString += characters[index]
  }

  return randomString
}