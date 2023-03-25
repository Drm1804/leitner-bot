import { Logger } from 'log4js';
import { Markup, Scenes } from 'telegraf';
import { phrases } from '../helpers/bot_phrases.js';
import db, { Card, CardCollection } from '../helpers/database.js';
import keyboards, { GlobalButtons } from '../helpers/keyboards.js';
import logger from '../helpers/logger.js';
import { uuidv4 } from '@firebase/util';
import { DEFAULT_COLLECTION } from './collections/collections.js';
import { getUserId } from '../helpers/utils.js';

const _logger: Logger = logger.get('AddCards');
const MAX_INPUT_LENGTH = 4000;
const CALLBACK_SEPARATOR = '_!!_'
const CALLBACK_KEY = 'collcetions_cb_key' + CALLBACK_SEPARATOR;

export class AddCards {
  public scene: any;
  public sceneKey = 'add-cards';

  constructor() {
    this.scene = new Scenes.BaseScene<Scenes.SceneContext>(this.sceneKey);
    this.scene.hears(GlobalButtons.FINISH, (ctx) => ctx.scene.leave());
    this.scene.enter((ctx) => this.enter(ctx));
    this.scene.leave((ctx) => this.leave(ctx));
    this.scene.on('text', (ctx) => this.addCards(ctx));
    const regExp = new RegExp(`^${CALLBACK_KEY}[a-zA-Z0-9]*`)
    this.scene.action(regExp, async (ctx) => {
      const collectId = ctx.update.callback_query.data.split(CALLBACK_SEPARATOR)[1];
      ctx.session.currentCollection = ctx.session.collections[collectId]
      await ctx.reply(phrases.add_cards_select_collections(ctx.session.currentCollection.name),  Markup.keyboard([GlobalButtons.FINISH]))
    })
  }


  private async enter(ctx): Promise<void> {
    _logger.info('Enter scene');
    ctx.session.currentCollection = DEFAULT_COLLECTION
    ctx.session.collections = {};

    try {
      const userId = getUserId(ctx);
      ctx.session.collections = await db.getCollections(userId) || {};

      if(Object.values(ctx.session.collections).length === 0) {
        await db.createCollection(getUserId(ctx), DEFAULT_COLLECTION);
        ctx.session.collections[DEFAULT_COLLECTION.id] = DEFAULT_COLLECTION;
      }

      await ctx.reply(phrases.enter_add, Markup.keyboard([GlobalButtons.FINISH]));
      this.showCollectionsList(ctx)
    } catch (err) {
      _logger.error('Catn\'t get collections');
      ctx.reply(phrases.add_cards_enter_error,  Markup.keyboard([GlobalButtons.FINISH]))
    }
  }

  private leave(ctx): void {
    _logger.info('Leave scene');
    this.reset(ctx);
    return ctx.reply(phrases.leave_scene, keyboards.mainMenu());
  }

  private addCards(ctx): Promise<unknown> {
    _logger.info('Start to parse user cards');
    const text = ctx.message['text'];
    const userId = getUserId(ctx);

    const parsed = this.parceTextToArray(text);

    const listCards = this.mapToCards(parsed);

    if (listCards.length === 0) {
      return ctx.reply(phrases.add_cards_error);
    }

    const qAll = [];

    for (const ph of listCards) {
      qAll.push(db.writeCards(ph, userId, ctx.session.currentCollection.id))
    }

    return Promise.all(qAll)
      .then(() => {
        _logger.info('All cards was write to DB');
        return ctx.reply(phrases.add_cards_success);
      }, () => {
        _logger.error('Can\'t write to DB');
        return ctx.reply(phrases.add_cards_error);
      })
  }

  private parceTextToArray(text: string): string[][] {
    if (text.length > MAX_INPUT_LENGTH) {
      _logger.warn('Overhead max input length');
      return []
    }

    const result = text.split('\n').map(t => t.split('=>'));
    _logger.info('Finish parsing string to array');
    const isNotValid = Boolean(result.find((card) => card.length !== 2));
    _logger.info('Validation result: ' + isNotValid);

    return isNotValid ? [] : result;

  }

  private mapToCards(arr: string[][]): Card[] {
    return arr.map(([term, definition]) => ({
      id: uuidv4(),
      term,
      definition,
      metrics: {
        percent: 0,
        success: 0,
        wrong: 0,
      }
    }))
  }

  private async showCollectionsList(ctx): Promise<void> {
    const d = Object.values(ctx.session.collections).map((c:CardCollection) => ([{
      text: c.name,
      callback_data: CALLBACK_KEY + c.id
    }]));

    await ctx.reply(phrases.enter_add_collections_list, {
      reply_markup: JSON.stringify({
        inline_keyboard: [...d]
      }) as any
    })
  }

  private reset(ctx) {
    ctx.session.currentCollection = {}
    ctx.session.collections = {}
  }
}
