import { Logger } from 'log4js';
import { Markup, Scenes } from 'telegraf';
import { phrases } from '../../helpers/bot_phrases.js';
import db, { CardCollection } from '../../helpers/database.js';
import keyboards from '../../helpers/keyboards.js';
import logger from '../../helpers/logger.js';
import { getUserId } from '../../helpers/utils.js';
import { CollectionButtons, DEFAULT_COLLECTION } from './collections.js';

const _logger: Logger = logger.get('RemoveCollections');

const CALLBACK_SEPARATOR = '_!!_'
const CALLBACK_KEY = 'collcetions_cb_key' + CALLBACK_SEPARATOR;

export class RemoveCollections {
  public scene: any;
  public sceneKey = 'remove-collections';

  constructor() {
    this.scene = new Scenes.BaseScene<Scenes.SceneContext>(this.sceneKey);
    this.scene.hears(CollectionButtons.FINISH, (ctx) => ctx.scene.leave());
    this.scene.enter((ctx) => this.enter(ctx));
    this.scene.leave((ctx) => this.leave(ctx));
    const regExp = new RegExp(`^${CALLBACK_KEY}[a-zA-Z0-9]*`)
    this.scene.action(regExp, async (ctx) => {
      _logger.info('Choosed collections')

      const collectId = ctx.update.callback_query.data.split(CALLBACK_SEPARATOR)[1];
      await ctx.answerCbQuery('Ok');
      if(collectId === DEFAULT_COLLECTION.id) {
        _logger.info('Try to remove default collections');
        await ctx.reply(phrases.remove_collection_error_default, Markup.keyboard([CollectionButtons.FINISH]));
        return;
      }

      const userId = getUserId(ctx);

      try {
        await db.removeCollection(userId, collectId);
        _logger.info('Removed collection with id ' + collectId);
        ctx.session.collections = await db.getCollections(userId);
        await ctx.reply(phrases.remove_collections_enter, Markup.keyboard([CollectionButtons.FINISH]));
        await this.showCollectionsList(ctx);
      } catch {

        await ctx.reply(phrases.remove_collections_error_remov, Markup.keyboard([CollectionButtons.FINISH]));
      }
    })
  }

  private async enter(ctx): Promise<void> {
    _logger.info('Enter scene');

    // set default parameters
    this.reset(ctx);

    const userId = getUserId(ctx);

    try {
      ctx.session.collections = await db.getCollections(userId);
      await ctx.reply(phrases.edit_collections_enter, Markup.keyboard([CollectionButtons.FINISH]));
      await this.showCollectionsList(ctx);
    } catch {
      _logger.error('Error on enter scene');
      await ctx.reply(phrases.edit_collections_enter_error, Markup.keyboard([CollectionButtons.FINISH]));
    }
  }

  private leave(ctx): void {
    _logger.info('Leave scene');
    this.reset(ctx);
    return ctx.reply(phrases.leave_scene, keyboards.mainMenu());
  }

  private async showCollectionsList(ctx): Promise<void> {
    const d = Object.values(ctx.session.collections).map((c: CardCollection) => ([{
      text: '🚫 ' + c.name,
      callback_data: CALLBACK_KEY + c.id
    }]));

    await ctx.reply(phrases.edit_collactions_list, {
      reply_markup: JSON.stringify({
        inline_keyboard: [...d]
      }) as any
    })
  }

  private reset(ctx): void {
    ctx.session.collections = {};
  }
}
