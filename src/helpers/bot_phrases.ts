export const phrases = {
  welcome: 'Привет, я помогу тебе не забывать фрразы на иностранном языке',
  enter_add: `
  Бот помогае запомнить все что угодно.

  1️⃣ Настрой бота, нажав на кнопку «✅ Add»
  2️⃣ Отправь боту наборы фраз в формате <вопрос> => <ответ>
  3️⃣ Переходи в раздел «💪 Workout»
  4️⃣ Бот каждый раз будет подбирать для тебя 10 пар, которые у тебя получаются хуже всего

  🎓Бот разрабатывается в режиме реального времени, за процессом можно следить на канале https://www.youtube.com/c/AlexFour

  `,  finish_advice: '/n /n Для выхода нажми /finish',
  add_cards_length_error: 'Очень длинные фразы, давай попробуем короче',
  add_cards_error: 'Некорректные фраыз, давай попробуем еще раз',
  add_cards_success: 'Фразы успешно добавлены',
  enter_repeater: 'Привет, давай, повторим фразы. Я буду выдавать случайные фразы, а ты будешь пытаться их перевести. А потом нажми кнопку далее. И я выдам тебе следующую фразу. Нажми начаать, чтобы начать',
  enter_repeater_error: 'Не удалось загрузить список фраз, возможно он пуст?',
  leave_scene: 'Пока',
  repeater_finish_repeat: 'Начать заново или повторить ошибочные?',
  repeater_have_no_wrong_answeres: 'Ты нигде не ошибся, поэтому выходим',
  repeater_again: 'Начинаем с начала',
  repeater_remove_success: 'Успешно удалил фразу:',
  repeater_remove_error: 'Не получилось удалить фразу',
  collections_main_enter: (collectionsList: string): string => `Коллекция - это набор карточек объединенных по смыслу. Список ваших коллекций: ${collectionsList}`,
  collections_main_enter_err: 'Не смог загрузить коллеции',
  add_collection_enter_error: 'Не смог загрузить коллеции',
  add_collection_limit: 'Достигнул лимит на количество коллекций',
  add_collection_name_limit: (limit: number): string => `Название коллеции слишком длинное. Максимальная длина ${limit} символов`,
  add_collection_ready_to_add: (collectionsLength: number, limit: number, nameLimit: number): string => `Чтобы добавить колекцию, отправьте ее название в следующем сообщение. \n Обратите внимание, что длинна не может быть больше ${nameLimit} символов. А количество коллеций ограничено ${limit}. Сейчас у вас создано ${collectionsLength}`,
  add_collection_success_add: 'Коллекция создана',
  add_collection_error_add: 'Не получилось создать коллекцию',

}
