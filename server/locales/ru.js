export default {
  translation: {
    appName: 'Fastify Блог',
    layouts: {
      navbar: {
        brand: 'Fastify Блог',
        home: 'Главная',
        users: 'Пользователи',
        statuses: 'Статусы',
        tasks: 'Задачи',
        labels: 'Метки',
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
      tasks: {
        id: 'ID',
        name: 'Наименование',
        description: 'Описание',
        status: 'Статус',
        creator: 'Автор',
        executor: 'Исполнитель',
        createdAt: 'Дата создания',
        actions: 'Действия',
        selectStatus: '',
        selectExecutor: '',
        errors: {
          nameRequired: 'Наименование обязательно для заполнения',
          statusRequired: 'Статус обязателен для выбора',
        },
        index: {
          title: 'Задачи',
          createLink: 'Создать задачу',
          edit: 'Изменить',
          delete: 'Удалить',
        },
        filter: {
          status: 'Статус',
          executor: 'Исполнитель',
          label: 'Метка',
          isCreatorUser: 'Только мои задачи',
          selectStatus: '',
          selectExecutor: '',
          selectLabel: '',
          submit: 'Показать',
        },
        new: {
          title: 'Создание задачи',
          submit: 'Создать',
        },
        show: {
          edit: 'Изменить',
          back: 'Назад',
        },
        edit: {
          title: 'Изменение задачи',
          submit: 'Изменить',
          delete: 'Удалить',
        },
        labels: 'Метки',
      },
      labels: {
        id: 'ID',
        name: 'Наименование',
        createdAt: 'Дата создания',
        actions: 'Действия',
        errors: {
          nameRequired: 'Наименование обязательно для заполнения',
        },
        index: {
          title: 'Метки',
          createLink: 'Создать метку',
          edit: 'Изменить',
          delete: 'Удалить',
        },
        new: {
          title: 'Создание метки',
          submit: 'Создать',
        },
        edit: {
          title: 'Изменение метки',
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
          hasTasks: 'Нельзя удалить пользователя, связанного с задачей',
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
          hasTasks: 'Нельзя удалить статус, связанный с задачей',
        },
      },
      tasks: {
        create: {
          success: 'Задача успешно создана',
          error: 'Не удалось создать задачу',
        },
        show: {
          notFound: 'Задача не найдена',
        },
        edit: {
          success: 'Задача успешно изменена',
          error: 'Не удалось изменить задачу',
          notFound: 'Задача не найдена',
        },
        delete: {
          success: 'Задача успешно удалена',
          notFound: 'Задача не найдена',
          accessError: 'Задачу может удалить только её автор',
        },
      },
      labels: {
        create: {
          success: 'Метка успешно создана',
          error: 'Не удалось создать метку',
        },
        edit: {
          success: 'Метка успешно изменена',
          error: 'Не удалось изменить метку',
          notFound: 'Метка не найдена',
        },
        delete: {
          success: 'Метка успешно удалена',
          notFound: 'Метка не найдена',
          hasTasks: 'Нельзя удалить метку, связанную с задачей',
        },
      },
    },
  },
};
