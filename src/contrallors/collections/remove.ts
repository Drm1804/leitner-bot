import { Scenes } from 'telegraf';


export class AddCollections {
  public scene: any;
  public sceneKey = 'remove-collections';

  constructor() {
    this.scene = new Scenes.BaseScene<Scenes.SceneContext>(this.sceneKey);
  }
}
