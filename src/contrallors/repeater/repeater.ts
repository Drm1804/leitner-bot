import { Logger } from 'log4js';
import { Markup, Scenes } from 'telegraf';
import { phrases } from '../../helpers/bot_phrases.js';
import db, { Card, CardCollection } from '../../helpers/database.js';
import keyboards, { GlobalButtons } from '../../helpers/keyboards.js';
import logger from '../../helpers/logger.js';
import { getUserId, mixArray } from '../../helpers/utils.js';
import { DEFAULT_COLLECTION } from '../collections/collections.js';
import { pretifyAsk, recalculateMetrics } from './repeater.utils.js';

const _logger: Logger = logger.get('Repeater');


const LIMIT_ONE_LEARN_CYCLE = 10;
const STAT_TRASHHOLD = 4; // через сколько ответов начинать считать статистику
const CALLBACK_SEPARATOR = '_!!_'
const CALLBACK_KEY = 'collcetions_cb_key' + CALLBACK_SEPARATOR;

export enum RepeaterButtons {
  CHECK = '❓ Проверить',
  CORRECT = '✅ Знаю',
  WRONG = '❌ Ошибся',
  DELETE = '🚫 Remove',
  REPEAT_WRONG = '🔁 Повторить',
}

export class Repeater {
  public scene: any;
  public sceneKey = 'repeater';

  constructor() {
    this.scene = new Scenes.BaseScene<Scenes.SceneContext>(this.sceneKey);
    this.scene.enter((ctx) => this.enter(ctx));
    this.scene.leave((ctx) => this.leave(ctx));
    this.scene.hears(GlobalButtons.FINISH, (ctx) => ctx.scene.leave());
    this.scene.hears(GlobalButtons.START, (ctx) => this.start(ctx));
    this.scene.hears(RepeaterButtons.CHECK, (ctx) => this.check(ctx));
    this.scene.hears(RepeaterButtons.WRONG, (ctx) => this.answer(ctx, true));
    this.scene.hears(RepeaterButtons.CORRECT, (ctx) => this.answer(ctx));
    this.scene.hears(RepeaterButtons.REPEAT_WRONG, (ctx) => this.reeateWrong(ctx));
    this.scene.hears(RepeaterButtons.DELETE, (ctx) => this.deleteCard(ctx));
    const regExp = new RegExp(`^${CALLBACK_KEY}[a-zA-Z0-9]*`)
    this.scene.action(regExp, async (ctx) => {
      const collectId = ctx.update.callback_query.data.split(CALLBACK_SEPARATOR)[1];
      ctx.session.currentCollection = ctx.session.collections[collectId]
      await ctx.reply(phrases.repeater_select_collections(ctx.session.currentCollection.name),  Markup.keyboard([[GlobalButtons.START], [GlobalButtons.FINISH]]))
    })
  }

  private async enter(ctx): Promise<void> {
    _logger.info('Enter scene');

    // Set default parameters
    this.reset(ctx);

    const userId = getUserId(ctx);
    ctx.session.currentCollection = DEFAULT_COLLECTION;
    // получить весь список пар фраз
    try {
      ctx.session.collections = await db.getCollections(userId);
      await ctx.reply(phrases.enter_repeater, Markup.keyboard([[GlobalButtons.START], [GlobalButtons.FINISH]]));
      await this.showCollectionsList(ctx);
    } catch {
      _logger.error('Can\'t grab words from DB');
      ctx.reply(phrases.enter_repeater_error, Markup.keyboard([GlobalButtons.FINISH]))
    }
  }

  private leave(ctx): void {
    _logger.info('Leave scene');
    this.reset(ctx);
    return ctx.reply(phrases.leave_scene, keyboards.mainMenu())
  }

  private async start(ctx): Promise<void> {
    const userId = getUserId(ctx);
    const collection = await db.getFilteredCards(userId, LIMIT_ONE_LEARN_CYCLE, ctx.session.currentCollection.id);
    if(!collection) {
      ctx.reply(phrases.repeater_error_empty_collection, Markup.keyboard([GlobalButtons.FINISH]));
      return;
    }
    _logger.info('Collection of words was got');
    ctx.session.learnCard = mixArray(Object.values(collection)) as Card[];
    ctx.session.counter = 0;
    ctx.session.wrongAnswers = [];
    _logger.info(`There are ${ctx.session.learnCard.length} cards`);
    this.ask(ctx);
  }

  private ask(ctx): void {
    _logger.info('Ask');
    ctx.session.currentCards = ctx.session.learnCard[ctx.session.counter];
    ctx.session.counter += 1;

    ctx.reply(pretifyAsk(ctx.session.currentCards, ctx.session.counter, ctx.session.learnCard.length), Markup.keyboard([
      [RepeaterButtons.CHECK],
      [GlobalButtons.FINISH]
    ]))
  }

  private check(ctx): void {
    _logger.info('Check');
    ctx.reply(ctx.session.currentCards.definition, Markup.keyboard([
      [RepeaterButtons.CORRECT, RepeaterButtons.WRONG],
      [RepeaterButtons.DELETE],
      [GlobalButtons.FINISH]
    ]))
  }

  private async answer(ctx, isWrong = false): Promise<void> {
    _logger.info('Answer');
    const userId = getUserId(ctx);

    ctx.session.currentCards.metrics = recalculateMetrics(ctx.session.currentCards.metrics, isWrong, STAT_TRASHHOLD)
    await db.updateCardsMetrics(ctx.session.currentCards, userId, DEFAULT_COLLECTION.id);

    if (isWrong) {
      ctx.session.wrongAnswers.push(ctx.session.currentCards);
    }

    if (ctx.session.counter >= ctx.session.learnCard.length) {
      _logger.info('Finish cards repeat');
      await ctx.reply(phrases.repeater_finish_repeat, Markup.keyboard([
        [RepeaterButtons.REPEAT_WRONG],
        [GlobalButtons.FINISH]
      ]))
      return;
    }

    this.ask(ctx);
  }

  private async reeateWrong(ctx): Promise<void> {
    _logger.info('reeateWrong');

    if (ctx.session.wrongAnswers.length === 0) {
      _logger.info('Don\'t have wrong answer, go to main menu');
      await ctx.reply(phrases.repeater_have_no_wrong_answeres);
      this.leave(ctx);
      return;
    }

    ctx.session.learnCard = ctx.session.wrongAnswers;
    ctx.session.counter = 0;
    ctx.session.wrongAnswers = [];
    await ctx.reply(phrases.repeater_again)
    this.ask(ctx)
  }

  private async deleteCard(ctx): Promise<void> {
    _logger.info('deleteCard');

    const userId = getUserId(ctx);

    try {
      await db.deleteCard(userId, ctx.session.currentCards.id, DEFAULT_COLLECTION.id);
      _logger.info('Remove card');
      await ctx.reply(phrases.repeater_remove_success + ctx.session.currentCards.term + ' => ' + ctx.session.currentCards.definition)
    } catch {
      _logger.info('Can\t remove card');
      await ctx.reply(phrases.repeater_remove_error);
    }

    if (ctx.session.counter >= ctx.session.learnCard.length) {
      _logger.info('Finish cards repeat');
      await ctx.reply(phrases.repeater_finish_repeat, Markup.keyboard([
        [RepeaterButtons.REPEAT_WRONG],
        [GlobalButtons.FINISH]
      ]))
      return;
    }
    
    this.ask(ctx)
  }

  private async showCollectionsList(ctx): Promise<void> {
    const d = Object.values(ctx.session.collections).map((c: CardCollection) => ([{
      text: c.name,
      callback_data: CALLBACK_KEY + c.id
    }]));

    await ctx.reply(phrases.enter_add_collections_list, {
      reply_markup: JSON.stringify({
        inline_keyboard: [...d]
      }) as any
    })
  }

  private reset(ctx): void {
    ctx.session.learnCard = []
    ctx.session.currentCards = {};
    ctx.session.wrongAnswers = [];
    ctx.session.counter = 0;
    ctx.session.currentCollection = null;
    ctx.session.collections = {};
  }
}
