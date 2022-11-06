import { Markup } from 'telegraf';
import { MainMenuButtons } from '../main.js'

const keyboards: KeyboardInterface = {}


keyboards.mainMenu = (): Markup.Markup<any> => {
  return Markup.keyboard([
    [MainMenuButtons.WORKOUT],
    [MainMenuButtons.ADD],
    [GlobalButtons.FINISH],
  ])
}

export default keyboards;

interface KeyboardInterface {
  [key: string]: any
}

export enum GlobalButtons {
  START = '🏳️ Начать',
  FINISH = '🏁 Закончить'
}
