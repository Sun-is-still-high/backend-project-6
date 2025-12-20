export default {
  translation: {
    appName: 'Fastify Блог',
    layouts: {
      navbar: {
        brand: 'Fastify Блог',
        home: 'Главная',
        users: 'Пользователи',
        signIn: 'Вход',
        signUp: 'Регистрация',
        signOut: 'Выход',
      },
    },
    views: {
      index: {
        welcome: 'Добро пожаловать в Fastify Блог!',
        description: 'Простое блог-приложение на Fastify',
      },
      users: {
        id: 'ID',
        email: 'Email',
        firstName: 'Имя',
        lastName: 'Фамилия',
        password: 'Пароль',
        fullName: 'Полное имя',
        createdAt: 'Дата создания',
        actions: 'Действия',
        new: {
          title: 'Регистрация',
          submit: 'Зарегистрировать',
        },
        edit: {
          title: 'Редактирование пользователя',
          submit: 'Изменить',
          delete: 'Удалить',
        },
        index: {
          title: 'Пользователи',
        },
      },
      session: {
        new: {
          title: 'Вход',
          submit: 'Войти',
        },
      },
    },
    flash: {
      authError: 'Доступ запрещён! Пожалуйста, авторизируйтесь.',
      users: {
        create: {
          success: 'Пользователь успешно зарегистрирован',
          error: 'Не удалось зарегистрировать',
        },
        edit: {
          success: 'Пользователь успешно изменён',
          error: 'Не удалось изменить пользователя',
          accessError: 'Вы не можете редактировать другого пользователя',
          notFound: 'Пользователь не найден',
        },
        delete: {
          success: 'Пользователь успешно удалён',
          accessError: 'Вы не можете удалить другого пользователя',
        },
      },
      session: {
        create: {
          success: 'Вы залогинены',
          error: 'Неправильный email или пароль',
        },
        delete: {
          success: 'Вы разлогинены',
        },
      },
    },
  },
};
