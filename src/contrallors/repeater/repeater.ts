import { Logger } from 'log4js';
import { Markup, Scenes } from 'telegraf';
import { phrases } from '../../helpers/bot_phrases.js';
import db, { Card } from '../../helpers/database.js';
import keyboards, { GlobalButtons } from '../../helpers/keyboards.js';
import logger from '../../helpers/logger.js';
import { mixArray } from '../../helpers/utils.js';
import { pretifyAsk, recalculateMetrics } from './repeater.utils.js';

const _logger: Logger = logger.get('Repeater');
const { leave } = Scenes.Stage;


const LIMIT_ONE_LEARN_CYCLE = 10;
const STAT_TRASHHOLD = 4; // через сколько ответов начинать считать статистику

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
  private wrongAnswers: Card[] = [];
  private counter = 0;

  constructor() {
    this.scene = new Scenes.BaseScene<Scenes.SceneContext>(this.sceneKey);
    this.scene.enter((ctx) => this.enter(ctx));
    this.scene.leave(this.leave);
    this.scene.hears(GlobalButtons.FINISH, leave());
    this.scene.hears(GlobalButtons.START, (ctx) => this.ask(ctx));
    this.scene.hears(RepeaterButtons.CHECK, (ctx) => this.check(ctx));
    this.scene.hears(RepeaterButtons.WRONG, (ctx) => this.answer(ctx, true));
    this.scene.hears(RepeaterButtons.CORRECT, (ctx) => this.answer(ctx));
    this.scene.hears(RepeaterButtons.REPEAT_WRONG, (ctx) => this.reeateWrong(ctx));
    this.scene.hears(RepeaterButtons.DELETE, (ctx) => this.deleteCard(ctx));
  }

  private async enter(ctx): Promise<void> {
    _logger.info('Enter scene');
    const userId = ctx.message.chat.id;
    // получить весь список пар фраз
    try {
      const collection = await db.getFilteredCards(userId, LIMIT_ONE_LEARN_CYCLE);
      _logger.info('Collection of words was got');
      this.learnCard = mixArray(Object.values(collection)) as Card[];
      this.counter = 0;
      this.wrongAnswers = [];
      _logger.info(`There are ${this.learnCard.length} cards`);
      ctx.reply(phrases.enter_repeater, Markup.keyboard([[GlobalButtons.START], [GlobalButtons.FINISH]]));
    } catch {
      _logger.error('Can\'t grab words from DB');
      ctx.reply(phrases.enter_repeater_error, Markup.keyboard([GlobalButtons.FINISH]))
    }
  }

  private leave(ctx): void {
    _logger.info('Leave scene');
    return ctx.reply(phrases.leave_scene, keyboards.mainMenu());
    leave();

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
    const userId = ctx.message.chat.id;

    this.currentCards.metrics = recalculateMetrics(this.currentCards.metrics, isWrong, STAT_TRASHHOLD)
    await db.updateCardsMetrics(this.currentCards, userId);

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

    const userId = ctx.message.chat.id;

    try {
      await db.deleteCard(userId, this.currentCards.id);
      _logger.info('Remove card');
      await ctx.reply(phrases.repeater_remove_success + this.currentCards.term + ' => ' + this.currentCards.definition)
    } catch {
      _logger.info('Can\t remove card');
      await ctx.reply(phrases.repeater_remove_error);
    }

    this.ask(ctx)
  }
}
