import { conf } from '../config.js';
import { Scenes, session, Telegraf } from 'telegraf';
import { pause } from './helpers/utils.js'
import logger from './helpers/logger.js'
import { Logger } from 'log4js';
import { phrases } from './helpers/bot_phrases.js';
import keyboards, { GlobalButtons } from './helpers/keyboards.js';
import { AddCards } from './contrallors/add-cards.js';
import { Repeater } from './contrallors/repeater/repeater.js';
import { colectionsScenes, MainCollections } from './contrallors/collections/collections.js';

const bot = new Telegraf<Scenes.SceneContext>(conf.botToken);

const addCards = new AddCards()
const repeater = new Repeater()
const mainCollections = new MainCollections()

const stage = new Scenes.Stage<Scenes.SceneContext>([
  addCards.scene,
  repeater.scene,
  ...colectionsScenes
], {
  //параметры
  ttl: 1800 // время сколько будет храниться сцена в памяти
});

bot.use(session()); // помечена как депрекейтед, но альтернатив пока нет
bot.use(stage.middleware());

export enum MainMenuButtons {
  ADD = '✅ Добавить слова',
  WORKOUT = '💪 Тренеровка',
  CONFIG_COLLECTIONS = '📚 Коллеции',
}

(async (): Promise<void> => {
  const _logger: Logger = logger.get('Main')
  await pause(1000);
  // bot.on('text', async (ctx) => {
  //   _logger.info('trigger бота')
  //   await db.writeMessage(ctx.update.message.text, ctx.update.message.date)
  //   ctx.reply('Привет')
  // })

  bot.command('start', (ctx) => {
    _logger.info('Command start')
    return ctx.reply(phrases.welcome, keyboards.mainMenu())
  })

  bot.hears(GlobalButtons.FINISH, (ctx) => {
    _logger.info('Finish btn click');
    return ctx.reply('Ok', keyboards.mainMenu())
  })

  bot.hears(MainMenuButtons.ADD, (ctx) => ctx.scene.enter(addCards.sceneKey));
  bot.hears(MainMenuButtons.WORKOUT, (ctx) => ctx.scene.enter(repeater.sceneKey));
  bot.hears(MainMenuButtons.CONFIG_COLLECTIONS, (ctx) => mainCollections.start(ctx));
  // mainCollections.initBotHears(bot);
  bot.launch();
})()


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
