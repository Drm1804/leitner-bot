import { Logger } from 'log4js';
import { Markup, Scenes } from 'telegraf';
import { phrases } from '../../helpers/bot_phrases.js';
import db, { Card, CardCollection, Collection } from '../../helpers/database.js';
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
  private learnCard: Card[]
  private currentCards: Card;
  private wrongAnswers: Card[];
  private counter: number;
  private currentCollection;
  private collections: Collection<CardCollection>;

  constructor() {
    this.scene = new Scenes.BaseScene<Scenes.SceneContext>(this.sceneKey);
    this.scene.enter((ctx) => this.enter(ctx));
    this.scene.leave(this.leave);
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
      this.currentCollection = this.collections[collectId]
      await ctx.reply(phrases.repeater_select_collections(this.currentCollection.name),  Markup.keyboard([[GlobalButtons.START], [GlobalButtons.FINISH]]))
    })
  }

  private async enter(ctx): Promise<void> {
    _logger.info('Enter scene');

    // Set default parameters
    this.wrongAnswers = [];
    this.counter = 0;
    this.currentCollection = DEFAULT_COLLECTION;
    this.collections = {};


    const userId = getUserId(ctx);
    this.currentCollection = DEFAULT_COLLECTION;
    // получить весь список пар фраз
    try {
      this.collections = await db.getCollections(userId);
      await ctx.reply(phrases.enter_repeater, Markup.keyboard([[GlobalButtons.START], [GlobalButtons.FINISH]]));
      await this.showCollectionsList(ctx);
    } catch {
      _logger.error('Can\'t grab words from DB');
      ctx.reply(phrases.enter_repeater_error, Markup.keyboard([GlobalButtons.FINISH]))
    }
  }

  private leave(ctx): void {
    _logger.info('Leave scene');
    return ctx.reply(phrases.leave_scene, keyboards.mainMenu())
  }

  private async start(ctx): Promise<void> {
    const userId = getUserId(ctx);
    const collection = await db.getFilteredCards(userId, LIMIT_ONE_LEARN_CYCLE, this.currentCollection.id);
    _logger.info('Collection of words was got');
    this.learnCard = mixArray(Object.values(collection)) as Card[];
    this.counter = 0;
    this.wrongAnswers = [];
    _logger.info(`There are ${this.learnCard.length} cards`);
    this.ask(ctx);
  }

  private ask(ctx): void {
    _logger.info('Ask');
    this.currentCards = this.learnCard[this.counter];
    this.counter += 1;

    ctx.reply(pretifyAsk(this.currentCards, this.counter, this.learnCard.length), Markup.keyboard([
      [RepeaterButtons.CHECK],
      [GlobalButtons.FINISH]
    ]))
  }

  private check(ctx): void {
    _logger.info('Check');
    ctx.reply(this.currentCards.definition, Markup.keyboard([
      [RepeaterButtons.CORRECT, RepeaterButtons.WRONG],
      [RepeaterButtons.DELETE],
      [GlobalButtons.FINISH]
    ]))
  }

  private async answer(ctx, isWrong = false): Promise<void> {
    _logger.info('Answer');
    const userId = getUserId(ctx);

    this.currentCards.metrics = recalculateMetrics(this.currentCards.metrics, isWrong, STAT_TRASHHOLD)
    await db.updateCardsMetrics(this.currentCards, userId, DEFAULT_COLLECTION.id);

    if (isWrong) {
      this.wrongAnswers.push(this.currentCards);
    }

    if (this.counter >= this.learnCard.length) {
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

    if (this.wrongAnswers.length === 0) {
      _logger.info('Don\'t have wrong answer, go to main menu');
      await ctx.reply(phrases.repeater_have_no_wrong_answeres);
      this.leave(ctx);
      return;
    }

    this.learnCard = this.wrongAnswers;
    this.counter = 0;
    this.wrongAnswers = [];
    await ctx.reply(phrases.repeater_again)
    this.ask(ctx)
  }

  private async deleteCard(ctx): Promise<void> {
    _logger.info('deleteCard');

    const userId = getUserId(ctx);

    try {
      await db.deleteCard(userId, this.currentCards.id, DEFAULT_COLLECTION.id);
      _logger.info('Remove card');
      await ctx.reply(phrases.repeater_remove_success + this.currentCards.term + ' => ' + this.currentCards.definition)
    } catch {
      _logger.info('Can\t remove card');
      await ctx.reply(phrases.repeater_remove_error);
    }

    this.ask(ctx)
  }

  private async showCollectionsList(ctx): Promise<void> {
    const d = Object.values(this.collections).map((c) => ([{
      text: c.name,
      callback_data: CALLBACK_KEY + c.id
    }]));

    await ctx.reply(phrases.enter_add_collections_list, {
      reply_markup: JSON.stringify({
        inline_keyboard: [...d]
      }) as any
    })
  }
}
