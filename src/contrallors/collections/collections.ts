import { Logger } from 'log4js';
import { Markup } from 'telegraf';
import { phrases } from '../../helpers/bot_phrases.js';
import db, { CardCollection } from '../../helpers/database.js';
import keyboards from '../../helpers/keyboards.js';
import logger from '../../helpers/logger.js';
import { getUserId } from '../../helpers/utils.js';
import { AddCollections } from './add.js';


const _logger: Logger = logger.get('MainCollections');

export const COLLECTIONS_LIMIT = 10;
export const COLLECTION_NAME_LIMIT = 100;
export const DEFAULT_COLLECTION: CardCollection = {
  id: 'default',
  name: 'default'
}

export enum CollectionButtons {
  ADD = '✅ Добавить',
  REMOVE = '🚫 Удалить',
  EDIT = '✏️ Редактировать',
  FINISH = '🏁 Закончить' // Пришлось задублировать, поскольку в рантайме не работае импорт GlobalButtons
}


const addCollections = new AddCollections();

export class MainCollections {
  public async start(ctx): Promise<void> {
    _logger.info('Start')
    const userId = getUserId(ctx);
    try {
      const collectResp = await db.getCollections(userId);
      _logger.info('Collections was loaded');
      await ctx.reply(
        phrases.collections_main_enter(this.pretifyCollectionsList(Object.values(collectResp))),
        keyboards.collectionMainMenu())
    } catch(err) {
      await ctx.reply(phrases.collections_main_enter_err, Markup.keyboard([CollectionButtons.FINISH]))
      _logger.error('Error load collections');
      _logger.error(err);
    }

  }


  public initBotHears(bot): void {
    _logger.info('initBotHears')
    bot.hears(CollectionButtons.ADD, (ctx) => ctx.scene.enter(addCollections.sceneKey))
    // bot.hears(CollectionButtons.EDIT, () => {})
    // bot.hears(CollectionButtons.REMOVE, () => {})
  }


  private pretifyCollectionsList(arr: CardCollection[]): string {
    return arr.reduce((acc, c) => {
      acc += `➡️ ${c.name} \n`
      return acc;
    }, '\n')
  }
}



export const colectionsScenes = [
  addCollections.scene
]
