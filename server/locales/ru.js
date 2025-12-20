export default {
  translation: {
    appName: 'Fastify Блог',
    layouts: {
      navbar: {
        brand: 'Fastify Блог',
        home: 'Главная',
        users: 'Пользователи',
        statuses: 'Статусы',
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
      statuses: {
        id: 'ID',
        name: 'Наименование',
        createdAt: 'Дата создания',
        actions: 'Действия',
        errors: {
          nameRequired: 'Наименование обязательно для заполнения',
        },
        index: {
          title: 'Статусы',
          createLink: 'Создать статус',
          edit: 'Изменить',
          delete: 'Удалить',
        },
        new: {
          title: 'Создание статуса',
          submit: 'Создать',
        },
        edit: {
          title: 'Изменение статуса',
          submit: 'Изменить',
          delete: 'Удалить',
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
      statuses: {
        create: {
          success: 'Статус успешно создан',
          error: 'Не удалось создать статус',
        },
        edit: {
          success: 'Статус успешно изменён',
          error: 'Не удалось изменить статус',
          notFound: 'Статус не найден',
        },
        delete: {
          success: 'Статус успешно удалён',
          notFound: 'Статус не найден',
        },
      },
    },
  },
};
