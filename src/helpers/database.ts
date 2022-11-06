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

  writeCards(card: Card, userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      set(ref(this.db, userId + '/cards/' + card.id), ({
        ...card
      })).then(resolve, reject).catch(reject)
    })
  }

  updateCardsMetrics(card: Card, userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      set(ref(this.db, userId + '/cards/' + card.id), ({
        ...card
      })).then(resolve, reject).catch(reject)
    })
  }

  getFilteredCards(userId: number, limit: number): Promise<Collection<Card>> {
    return new Promise((resolve, reject) => {
      const cardsRef = query(ref(this.db, userId + '/cards'), orderByChild('metrics/percent'), limitToFirst(limit));
      get(cardsRef)
      .then((snapshot) => resolve(snapshot.val()), reject)
      .catch(reject)
    })
  }

  deleteCard(userId: number, cardId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      remove(ref(this.db, userId + '/cards/' + cardId))
      .then(resolve, reject)
      .catch(reject)
    })
  }
}

const db = new DatabaseService();
export default db;


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
