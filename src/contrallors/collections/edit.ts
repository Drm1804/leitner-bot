import { Logger } from 'log4js';
import { Markup, Scenes } from 'telegraf';
import { phrases } from '../../helpers/bot_phrases.js';
import db, { CardCollection } from '../../helpers/database.js';
import keyboards from '../../helpers/keyboards.js';
import logger from '../../helpers/logger.js';
import { getUserId } from '../../helpers/utils.js';
import { CollectionButtons, COLLECTION_NAME_LIMIT } from './collections.js';

const _logger: Logger = logger.get('AddCollections');

const CALLBACK_SEPARATOR = '_!!_'
const CALLBACK_KEY = 'collcetions_cb_key' + CALLBACK_SEPARATOR;

export class EditCollections {
  public scene: any;
  public sceneKey = 'edit-collections';

  constructor() {
    this.scene = new Scenes.BaseScene<Scenes.SceneContext>(this.sceneKey);
    this.scene.hears(CollectionButtons.FINISH, (ctx) => ctx.scene.leave());
    this.scene.enter((ctx) => this.enter(ctx));
    this.scene.leave((ctx) => this.leave(ctx));
    this.scene.on('text', (ctx) => this.renameCollection(ctx));
    const regExp = new RegExp(`^${CALLBACK_KEY}[a-zA-Z0-9]*`)
    this.scene.action(regExp, async (ctx) => {
      ctx.session.currendCollectionId = ctx.update.callback_query.data.split(CALLBACK_SEPARATOR)[1];
      await ctx.answerCbQuery('Ok');
      await ctx.reply(phrases.edit_collections_instruction(COLLECTION_NAME_LIMIT),  Markup.keyboard([CollectionButtons.FINISH]))
    })
  }

  private async enter(ctx): Promise<void> {
    _logger.info('Enter scene');

    //set default parameters
    ctx.session.collections = {};
    ctx.session.currendCollectionId = null;

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


  private async renameCollection(ctx): Promise<void> {
    _logger.info('renameCollection');
    const newName = ctx.message['text'];
    if(!ctx.session.currendCollectionId) {
      _logger.warn('Collections ID didn\'t select');

      await ctx.reply(phrases.edit_collections_enter, Markup.keyboard([CollectionButtons.FINISH]));
      await this.showCollectionsList(ctx);
      return;
    }

    if(newName.length > COLLECTION_NAME_LIMIT) {
      _logger.warn('Vary long name');
      await ctx.reply(phrases.edit_collections_enter_name_length_error(COLLECTION_NAME_LIMIT), Markup.keyboard([CollectionButtons.FINISH]));
      return;
    }

    await db.updateCollectionName(getUserId(ctx), ctx.session.currendCollectionId, newName);

    ctx.session.currendCollectionId = null;
    ctx.session.collections = await db.getCollections(getUserId(ctx));
    await ctx.reply(phrases.edit_collactions_success, Markup.keyboard([CollectionButtons.FINISH]));
    await this.showCollectionsList(ctx);

  }

  private async showCollectionsList(ctx): Promise<void> {
    const d = Object.values(ctx.session.collections).map((c: CardCollection) => ([{
      text: '✏️ ' + c.name,
      callback_data: CALLBACK_KEY + c.id
    }]));

    await ctx.reply(phrases.edit_collactions_list, {
      reply_markup: JSON.stringify({
        inline_keyboard: [...d]
      }) as any
    })
  }

  private reset(ctx): void {
    ctx.session.collections = {}
    ctx.session.currendCollectionId = null;
  }
}
