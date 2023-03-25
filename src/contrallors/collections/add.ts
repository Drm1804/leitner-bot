import { uuidv4 } from '@firebase/util';
import { Logger } from 'log4js';
import { Markup, Scenes } from 'telegraf';
import { phrases } from '../../helpers/bot_phrases.js';
import db from '../../helpers/database.js';
import keyboards from '../../helpers/keyboards.js';
import logger from '../../helpers/logger.js';
import { getUserId } from '../../helpers/utils.js';
import { CollectionButtons, COLLECTIONS_LIMIT, COLLECTION_NAME_LIMIT } from './collections.js';


const _logger: Logger = logger.get('AddCollections');

export class AddCollections {
  public scene: any;
  public sceneKey = 'add-collections';
  private collectionsCount = 0;

  constructor() {
    this.scene = new Scenes.BaseScene<Scenes.SceneContext>(this.sceneKey);
    this.scene.hears(CollectionButtons.FINISH, (ctx) => ctx.scene.leave());
    this.scene.enter((ctx) => this.enter(ctx));
    this.scene.leave((ctx) => this.leave(ctx));
    this.scene.on('text', (ctx) => this.addCollection(ctx))
  }


  private async enter(ctx): Promise<void> {
    _logger.info('Enter scene');
    const userId = getUserId(ctx);

    try {
      const collectResp = await db.getCollections(userId);
      this.collectionsCount = Object.values(collectResp).length
      _logger.info('Collections was loaded');

      if (this.collectionsCount > COLLECTIONS_LIMIT) {
        _logger.info('There are collections limit');
        await ctx.reply(phrases.add_collection_limit)
        ctx.scene.leave();

      } else {
        _logger.info('Ready ro add a new collection');
        await ctx.reply(phrases.add_collection_ready_to_add(this.collectionsCount, COLLECTIONS_LIMIT, COLLECTION_NAME_LIMIT))
      }

    } catch {
      _logger.error('Cat\t grab collections');
      await ctx.reply(phrases.add_collection_enter_error);
      ctx.scene.leave();
    }
  }

  private leave(ctx): void {
    _logger.info('Leave scene');
    return ctx.reply(phrases.leave_scene, keyboards.mainMenu());
  }

  private async addCollection(ctx): Promise<void> {
    _logger.info('addCollection');
    const name = ctx.message['text'];
    const userId = getUserId(ctx);

    if (name.length > COLLECTION_NAME_LIMIT) {
      ctx.reply(phrases.add_collection_name_limit(COLLECTION_NAME_LIMIT));
      return;
    }

    const newCollection = {
      id: uuidv4(),
      name
    }
    try {
      await db.createCollection(userId, newCollection)
      _logger.info('Succes create new collection');
      this.collectionsCount += 1;
      ctx.reply(phrases.add_collection_success_add, Markup.keyboard([CollectionButtons.FINISH]));
    } catch {
      _logger.error('Can\'t create new collection');
      ctx.reply(phrases.add_collection_success_add, Markup.keyboard([CollectionButtons.FINISH]));
    }

    if(this.collectionsCount > COLLECTIONS_LIMIT) {
      ctx.scene.leave();
    }
  }
}
