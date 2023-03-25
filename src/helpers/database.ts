import { FirebaseApp, initializeApp } from 'firebase/app';
import { Database, getDatabase, ref, set, get, remove, query, limitToFirst, orderByChild } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { conf } from '../../config.js';

class DatabaseService {
  app: FirebaseApp
  db: Database

  constructor() {
    try{
      this.app = initializeApp({
        ...conf.firebase
      })

      const auth = getAuth();
      signInWithEmailAndPassword(auth, conf.authFirebase.email, conf.authFirebase.password)
        .catch((error) => {
          console.log(error)
        })

      this.db = getDatabase(this.app);

    } catch(err) {
      console.error('Application works without database!!');
      console.error(err);
    }
  }

  writeCards(card: Card, userId: number, collectionsId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      set(ref(this.db, userId + '/cards/'+ collectionsId + '/' + card.id), ({
        ...card
      })).then(resolve, reject).catch(reject)
    })
  }

  updateCardsMetrics(card: Card, userId: number, collectionsId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      set(ref(this.db, userId + '/cards/' + collectionsId + '/' + card.id), ({
        ...card
      })).then(resolve, reject).catch(reject)
    })
  }

  getFilteredCards(userId: number, limit: number, collectionsId: string): Promise<Collection<Card>> {
    return new Promise((resolve, reject) => {
      const cardsRef = query(ref(this.db, userId + '/cards/' + collectionsId), orderByChild('metrics/percent'), limitToFirst(limit));
      get(cardsRef)
      .then((snapshot) => resolve(snapshot.val()), reject)
      .catch(reject)
    })
  }

  deleteCard(userId: number, cardId: string, collectionsId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      remove(ref(this.db, userId + '/cards/'+ collectionsId + '/' + cardId))
      .then(resolve, reject)
      .catch(reject)
    })
  }

  getCollections(userId: number): Promise<Collection<CardCollection>> {
    return new Promise((resolve, reject) => {
      get(ref(this.db, userId + '/collections'))
      .then((snapshot) => resolve(snapshot.val()), reject)
      .catch(reject)
    })
  }

  createCollection(userId: number, collection: CardCollection):Promise<void> {
    return new Promise((resolve, reject) => {
      set(ref(this.db, userId + '/collections/' + collection.id), {
        ...collection
      }).then(resolve, reject).catch(reject)
    })
  }

  updateCollectionName(userId: number, collectionId: string, name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      set(ref(this.db, userId + '/collections/' + collectionId + '/name'), name)
      .then(resolve, reject).catch(reject)
    })
  }
}

const db = new DatabaseService();
export default db;

export interface CardCollection{
  id: string;
  name: string
}

export interface Card {
  id: string;
  term: string;
  definition: string;
  metrics: CardMetrics;
}

export interface CardMetrics {
  percent: number;
  success: number;
  wrong: number;
}

export interface Collection<T> {
  [key: string]: T
}
