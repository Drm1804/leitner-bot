export const phrases = {
  welcome: 'Привет, я помогу тебе не забывать фразы на иностранном языке',
  enter_add: `
  Бот помогае запомнить все что угодно.

  1️⃣ Настрой бота, добавив слова через кнопку «✅ Добавить слова»
  2️⃣ Отправь боту наборы фраз в формате <вопрос> => <ответ>
  3️⃣ Переходи в раздел «💪 Тренировки»
  4️⃣ Бот каждый раз будет подбирать для тебя 10 карточек, которые у тебя получаются хуже всего
  5️⃣ Если у тебя несколько категорий слов, воспользуйся разделом «Коллекции»

  🎓Бот разрабатывается в режиме реального времени, за процессом можно следить на канале https://www.youtube.com/c/AlexFour

  `,  
  finish_advice: '/n /n Для выхода нажми /finish',
  enter_add_collections_list: 'Для того чтобы добавить слова в конкретную коллекцию, выбери ее из списка ниже (иначе они добавятся в коллекцию по-умолчанию). \n\n Список твоих колекций:',
  add_cards_length_error: '🛑 Очень длинные фразы, давай попробуем короче',
  add_cards_select_collections: (name: string): string => `Теперь фразы будут добавляться в коллекцию ${name}`,
  add_cards_enter_error: '🛑 Не получилось загрузить список коллекций, давай попробуем позже',
  add_cards_error: '🛑 Некорректные фразы, давай попробуем еще раз',
  add_cards_success: '✅ Фразы успешно добавлены',
  enter_repeater: 'Привет, давай, повторим фразы. Я буду выдавать случайные фразы, а ты будешь пытаться их перевести. А потом нажми кнопку далее. И я выдам тебе следующую фразу. Нажми начаать, чтобы начать',
  enter_repeater_error: '🛑 Не удалось загрузить список фраз, возможно он пуст?',
  leave_scene: 'Пока',
  repeater_finish_repeat: 'Начать заново или повторить ошибочные?',
  repeater_have_no_wrong_answeres: 'Ты нигде не ошибся, поэтому выходим',
  repeater_again: 'Начинаем с начала',
  repeater_remove_success: '✅ Успешно удалил фразу:',
  repeater_remove_error: '🛑 Не получилось удалить фразу',
  repeater_error_empty_collection: '🛑 Эта коллекция пуста, добавь в нее слова или выбери другую',
  repeater_select_collections: (name: string): string => `Теперь тренировка будет проходить по коллекции "${name}"`,
  collections_main_enter: (collectionsList: string): string => `Коллекция - это набор карточек объединенных по смыслу. Список ваших коллекций: ${collectionsList}`,
  collections_main_enter_err: '🛑 Не смог загрузить коллеции',
  add_collection_enter_error: '🛑 Не смог загрузить коллеции',
  add_collection_limit: '⚠️ Достигнул лимит на количество коллекций',
  add_collection_name_limit: (limit: number): string => `🛑 Название коллеции слишком длинное. Максимальная длина ${limit} символов`,
  add_collection_ready_to_add: (collectionsLength: number, limit: number, nameLimit: number): string => `Чтобы добавить коллекцию, отправьте ее название в следующем сообщение. \n Обратите внимание, что длинна не может быть больше ${nameLimit} символов. А количество коллеций ограничено ${limit}. Сейчас у вас создано ${collectionsLength}`,
  add_collection_success_add: '✅ Коллекция создана',
  add_collection_error_add: '🛑 Не получилось создать коллекцию',
  edit_collections_enter: `Чтобы отредактировать коллекцию, нажмите на коллекцию из списка ниже. `,
  edit_collactions_list: 'Вот список твоих коллекций',
  edit_collections_enter_error: '🛑 Не смог загрузить коллеции',
  edit_collections_instruction:  (limit: number): string => `Пришлите новое имя коллекции. \n\n Длина имени не больше ${limit} символов`,
  edit_collections_enter_name_length_error:  (limit: number): string => `🛑 Слишком длинное название. \n\n Длина имени не больше ${limit} символов`,
  edit_collactions_success: `✅ Коллекция успешно переименована`,
  remove_collections_enter: `Чтобы удалить коллекцию, нажмите на коллекцию из списка ниже. `,
  remove_collections_error_remov: `🛑 Не получилось удалить коллекцию. `,
  remove_collection_error_default: '🛑 Невозможно удалить коллекцию по-умолчанию',
}
