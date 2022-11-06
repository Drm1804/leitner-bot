import { Logger } from 'log4js';
import { Markup, Scenes } from 'telegraf';
import { phrases } from '../helpers/bot_phrases.js';
import db, { Card } from '../helpers/database.js';
import keyboards, { GlobalButtons } from '../helpers/keyboards.js';
import logger from '../helpers/logger.js';
import { v4 as uuid4 } from 'uuid';

const _logger: Logger = logger.get('AddCards');
const MAX_INPUT_LENGTH = 4000;
const { leave } = Scenes.Stage;


export class AddCards {
  public scene: any;
  public sceneKey = 'add-cards';

  constructor() {
    this.scene = new Scenes.BaseScene<Scenes.SceneContext>(this.sceneKey);
    this.scene.hears(GlobalButtons.FINISH, leave<Scenes.SceneContext>());
    this.scene.enter((ctx) => this.enter(ctx));
    this.scene.leave((ctx) => this.leave(ctx));
    this.scene.on('text', (ctx) => this.addCards(ctx))
  }


  private enter(ctx): void {
    _logger.info('Enter scene');
    return ctx.reply(phrases.enter_add, Markup.keyboard([GlobalButtons.FINISH]));
  }

  private leave(ctx): void {
    _logger.info('Leave scene');
    return ctx.reply(phrases.leave_scene, keyboards.mainMenu());
    leave();
  }

  private addCards(ctx: Scenes.SceneContext<Scenes.SceneSessionData>): Promise<unknown> {
    _logger.info('Start to parse user cards');
    const text = ctx.message['text'];
    const userId = ctx.message.chat.id;

    const parsed = this.parceTextToArray(text);

    const listCards = this.mapToCards(parsed);

    if (listCards.length === 0) {
      return ctx.reply(phrases.add_cards_error);
    }

    const qAll = [];

    for (const ph of listCards) {
      qAll.push(db.writeCards(ph, userId))
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
      id: uuid4(),
      term,
      definition,
      metrics: {
        percent: 0,
        success: 0,
        wrong: 0,
      }
    }))
  }
}
