import { Logger } from 'log4js';
import { Markup, Scenes } from 'telegraf';
import { phrases } from '../helpers/bot_phrases.js';
import db, { Phrase } from '../helpers/database.js';
import keyboards, { GlobalButtons } from '../helpers/keyboards.js';
import logger from '../helpers/logger.js';
import { randomArrayElement } from '../helpers/utils.js';

const _logger: Logger = logger.get('Repeater');

export enum RepeaterButtons {
  NEXT = '⏭️ Next',
}

export class Repeater {
  public scene: any;
  public sceneKey = 'repeater';
  private learnPhrases: Phrase[]
  private currentPhrase: Phrase;

  constructor() {
    this.scene = new Scenes.BaseScene<Scenes.SceneContext>(this.sceneKey);
    this.scene.enter((ctx) => this.enter(ctx));
    this.scene.leave((ctx) => this.leave(ctx));
    this.scene.hears(GlobalButtons.START, (ctx) => this.loop(ctx));
    this.scene.hears(RepeaterButtons.NEXT, (ctx) => this.loop(ctx));
  }

  private async enter(ctx): Promise<void> {
    _logger.info('Enter scene');
    const userId = ctx.message.chat.id;
    // получить весь список пар фраз
    try {
      const collection = await db.getAppLhrases(userId);
      _logger.info('Collection of words was got');
      this.learnPhrases = Object.values(collection);
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

  private loop(ctx): void {
    _logger.info('Start the loop');
    let resp = '';
    if(this.currentPhrase) {
      resp = this.currentPhrase.phFrom + '\n\n';
    }

    this.currentPhrase = randomArrayElement(this.learnPhrases) as Phrase;
    resp += this.currentPhrase.phTo;
    ctx.reply(resp, Markup.keyboard([[RepeaterButtons.NEXT], [GlobalButtons.FINISH]]))
  }
}
