import { Logger } from 'log4js';
import { Markup, Scenes } from 'telegraf';
import { phrases } from '../helpers/bot_phrases.js';
import db, { Phrase } from '../helpers/database.js';
import keyboards, { GlobalButtons } from '../helpers/keyboards.js';
import logger from '../helpers/logger.js';
import { v4 as uuid4 } from 'uuid';

const _logger: Logger = logger.get('AddPhrases');
const MAX_INPUT_LENGTH = 4000;

export class AddPhrases {
  public scene: any;
  public sceneKey = 'add-phrases';

  constructor() {
    this.scene = new Scenes.BaseScene<Scenes.SceneContext>(this.sceneKey);
    this.scene.enter((ctx) => this.enter(ctx));
    this.scene.leave((ctx) => this.leave(ctx));
    this.scene.on('text', (ctx) => this.addPhrases(ctx))
  }


  private enter(ctx): void {
    _logger.info('Enter scene');
    return ctx.reply(phrases.enter_add, Markup.keyboard([GlobalButtons.FINISH]));
  }

  private leave(ctx): void {
    _logger.info('Leave scene');
    return ctx.reply(phrases.leave_scene, keyboards.mainMenu())
  }

  private addPhrases(ctx: Scenes.SceneContext<Scenes.SceneSessionData>): Promise<unknown> {
    _logger.info('Start to parse user phrases');
    const text = ctx.message['text'];
    const userId = ctx.message.chat.id;

    const parsed = this.parceTextToArray(text);

    const listPhrases = this.mapToPhrases(parsed)

    const qAll = [];

    for (const ph of listPhrases) {
      qAll.push(db.writePhrases(ph, userId))
    }

    return Promise.all(qAll)
      .then(() => {
        _logger.info('All phrases was write to DB');
        return ctx.reply(phrases.add_phrases_success);
      }, () => {
        _logger.error('Can\'t write to DB');
        return ctx.reply(phrases.add_phrases_error);
      })
  }

  private parceTextToArray(text: string): string[][] {
    if (text.length > MAX_INPUT_LENGTH) {
      _logger.warn('Overhead max input length');
      return []
    }

    const result = text.split('\n').map(t => t.split('=>'));
    _logger.info('Finish parsing string to array');
    const isNotValid = Boolean(result.find((pair) => pair.length !== 2));
    _logger.info('Validation result: ' + isNotValid);

    return isNotValid ? [] : result;

  }

  private mapToPhrases(arr: string[][]): Phrase[] {
    return arr.map(([phFrom, phTo]) => ({
      id: uuid4(),
      phFrom,
      phTo
    }))
  }
}
