import { Markup } from 'telegraf';
import { CollectionButtons } from '../contrallors/collections/collections.js';
import { MainMenuButtons } from '../main.js'

const keyboards: KeyboardInterface = {}


keyboards.mainMenu = (): Markup.Markup<any> => {
  return Markup.keyboard([
    [MainMenuButtons.WORKOUT],
    [MainMenuButtons.ADD, MainMenuButtons.CONFIG_COLLECTIONS],
    [GlobalButtons.FINISH],
  ])
}

keyboards.collectionMainMenu = (): Markup.Markup<any> => {
  return Markup.keyboard([
    [CollectionButtons.ADD, CollectionButtons.EDIT],
    [CollectionButtons.REMOVE, GlobalButtons.FINISH],
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
