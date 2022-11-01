import { conf } from '../config.js';
import { Scenes, session, Telegraf } from 'telegraf';
import { pause } from './helpers/utils.js'
import logger from './helpers/logger.js'
import { Logger } from 'log4js';
import { phrases } from './helpers/bot_phrases.js';
import keyboards, { GlobalButtons } from './helpers/keyboards.js';
import { AddPhrases } from './contrallors/add-phrases.js';

const bot = new Telegraf<Scenes.SceneContext>(conf.botToken);

const addPhrases = new AddPhrases()

const stage = new Scenes.Stage<Scenes.SceneContext>([
  addPhrases.scene
], {
  //параметры
  ttl: 600 // время сколько будет храниться сцена в памяти
});

bot.use(session()); // помечена как депрекейтед, но альтернатив пока нет
bot.use(stage.middleware());

export enum MainMenuButtons {
  ADD = '✅ Add',
  ENG_RUS = '🇺🇸 -> 🇷🇺'
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

  bot.hears(MainMenuButtons.ADD, (ctx) => ctx.scene.enter(addPhrases.sceneKey))
  // bot.hears(MainMenuButtons.ENG_RUS, () => {})

  bot.launch();
})()


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
