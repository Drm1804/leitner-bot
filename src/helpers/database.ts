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

  writePhrases(ph: Phrase, userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      set(ref(this.db, userId + '/phrases/' + ph.id), ({
        ...ph
      })).then(resolve, reject).catch(reject)
    })
  }

  updatePhrasesMetrics(ph: Phrase, userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      set(ref(this.db, userId + '/phrases/' + ph.id), ({
        ...ph
      })).then(resolve, reject).catch(reject)
    })
  }

  getFilteredPhrases(userId: number, limit: number): Promise<Collection<Phrase>> {
    return new Promise((resolve, reject) => {
      const phRef = query(ref(this.db, userId + '/phrases'), orderByChild('metrics/percent'), limitToFirst(limit));
      get(phRef)
      .then((snapshot) => resolve(snapshot.val()), reject)
      .catch(reject)
    })
  }

  deletePhrase(userId, phId): Promise<void> {
    return new Promise((resolve, reject) => {
      remove(ref(this.db, userId + '/phrases/' + phId))
      .then(resolve, reject)
      .catch(reject)
    })
  }
}

const db = new DatabaseService();
export default db;


export interface Phrase {
  id: string;
  phFrom: string;
  phTo: string;
  metrics: PhraseMetrics;
}

export interface PhraseMetrics {
  percent: number;
  success: number;
  wrong: number;
}

export interface Collection<T> {
  [key: string]: T
}
