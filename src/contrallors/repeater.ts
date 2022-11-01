import { Logger } from 'log4js';
import { Markup, Scenes } from 'telegraf';
import { phrases } from '../helpers/bot_phrases.js';
import db, { Phrase } from '../helpers/database.js';
import keyboards, { GlobalButtons } from '../helpers/keyboards.js';
import logger from '../helpers/logger.js';
import { mixArray } from '../helpers/utils.js';

const _logger: Logger = logger.get('Repeater');

export enum RepeaterButtons {
  NEXT = '⏭️ Next',
  CHECK = '❓ Проверить',
  CORRECT = '✅ Знаю',
  WRONG = '❌ Ошибся',
  REPEAT_WRONG = '🔁 Повторить',
}

export class Repeater {
  public scene: any;
  public sceneKey = 'repeater';
  private learnPhrases: Phrase[]
  private currentPhrase: Phrase;
  private wrongAnswers: Phrase[] = [];
  private counter = 0;

  constructor() {
    this.scene = new Scenes.BaseScene<Scenes.SceneContext>(this.sceneKey);
    this.scene.enter((ctx) => this.enter(ctx));
    this.scene.leave((ctx) => this.leave(ctx));
    this.scene.hears(GlobalButtons.START, (ctx) => this.ask(ctx));
    this.scene.hears(RepeaterButtons.NEXT, (ctx) => this.ask(ctx));
    this.scene.hears(RepeaterButtons.CHECK, (ctx) => this.check(ctx));
    this.scene.hears(RepeaterButtons.WRONG, (ctx) => this.answer(ctx, true));
    this.scene.hears(RepeaterButtons.CORRECT, (ctx) => this.answer(ctx));
    this.scene.hears(RepeaterButtons.REPEAT_WRONG, (ctx) => this.reeateWrong(ctx));
  }

  private async enter(ctx): Promise<void> {
    _logger.info('Enter scene');
    const userId = ctx.message.chat.id;
    // получить весь список пар фраз
    try {
      const collection = await db.getAppLhrases(userId);
      _logger.info('Collection of words was got');
      this.learnPhrases = mixArray(Object.values(collection)) as Phrase[];
      _logger.info(`There are ${this.learnPhrases.length} phrases`);
      ctx.reply(phrases.enter_repeater, Markup.keyboard([[GlobalButtons.START], [GlobalButtons.FINISH]]));
    } catch {
      _logger.error('Can\'t grab words from DB');
      ctx.reply(phrases.enter_repeater_error, Markup.keyboard([GlobalButtons.FINISH]))
    }
  }

  private leave(ctx): void {
    _logger.info('Leave scene');
    return ctx.reply(phrases.leave_scene, keyboards.mainMenu())
  }

  private ask(ctx): void {
    _logger.info('Ask');
    this.currentPhrase = this.learnPhrases[this.counter];
    this.counter += 1;

    ctx.reply(this.currentPhrase.phTo, Markup.keyboard([
      [RepeaterButtons.CHECK],
      [GlobalButtons.FINISH]
    ]))
  }

  private check(ctx): void {
    _logger.info('Check');
    ctx.reply(this.currentPhrase.phFrom, Markup.keyboard([
      [RepeaterButtons.CORRECT, RepeaterButtons.WRONG],
      [GlobalButtons.FINISH]
    ]))
  }

  private answer(ctx, isWrong = false): void {
    _logger.info('Answer');

    if (isWrong) {
      this.wrongAnswers.push(this.currentPhrase);
    }

    if (this.counter >= this.learnPhrases.length - 1) {
      _logger.info('Finish phrases repeat');
      ctx.reply(phrases.repeater_finish_repeat, Markup.keyboard([
        [RepeaterButtons.REPEAT_WRONG],
        [GlobalButtons.FINISH]
      ]))
    }

    ctx.reply(phrases.repeater_continue, Markup.keyboard([
      [RepeaterButtons.NEXT],
      [GlobalButtons.FINISH]
    ]))
  }

  private reeateWrong(ctx): void {
    _logger.info('reeateWrong');

    if(this.wrongAnswers.length === 0) {
      _logger.info('Don\'t have wrong answer, go to main menu');
      ctx.reply(phrases.repeater_have_no_wrong_answeres);
      this.leave(ctx);
    }

    this.learnPhrases = this.wrongAnswers;
    this.counter = 0;
    this.wrongAnswers = [];
    ctx.reply(phrases.repeater_again)
    this.ask(ctx)
  }
}
