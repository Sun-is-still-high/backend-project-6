export default {
  translation: {
    appName: 'Task Manager',
    errors: {
      emailAlreadyInUse: 'Email already in use',
    },
    layouts: {
      navbar: {
        brand: 'Task Manager',
        users: 'Users',
        statuses: 'Statuses',
        tasks: 'Tasks',
        labels: 'Labels',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        signOut: 'Sign Out',
      },
    },
    views: {
      index: {
        welcome: 'Hello from Hexlet!',
        description: 'Practical programming courses',
        learnMore: 'Learn More',
      },
      users: {
        id: 'ID',
        email: 'Email',
        firstName: 'First Name',
        lastName: 'Last Name',
        password: 'Password',
        fullName: 'Full Name',
        createdAt: 'Created At',
        actions: 'Actions',
        new: {
          title: 'Sign Up',
          submit: 'Sign Up',
        },
        edit: {
          title: 'Edit User',
          submit: 'Update',
          delete: 'Delete',
        },
        index: {
          title: 'Users',
        },
      },
      session: {
        new: {
          title: 'Sign In',
          submit: 'Sign In',
        },
      },
      statuses: {
        id: 'ID',
        name: 'Name',
        createdAt: 'Created At',
        actions: 'Actions',
        errors: {
          nameRequired: 'Name is required',
        },
        index: {
          title: 'Statuses',
          createLink: 'Create Status',
          edit: 'Edit',
          delete: 'Delete',
        },
        new: {
          title: 'Create Status',
          submit: 'Create',
        },
        edit: {
          title: 'Edit Status',
          submit: 'Update',
          delete: 'Delete',
        },
      },
      tasks: {
        id: 'ID',
        name: 'Name',
        description: 'Description',
        status: 'Status',
        creator: 'Creator',
        executor: 'Executor',
        createdAt: 'Created At',
        actions: 'Actions',
        selectStatus: '',
        selectExecutor: '',
        errors: {
          nameRequired: 'Name is required',
          statusRequired: 'Status is required',
        },
        index: {
          title: 'Tasks',
          createLink: 'Create Task',
          edit: 'Edit',
          delete: 'Delete',
        },
        filter: {
          status: 'Status',
          executor: 'Executor',
          label: 'Label',
          isCreatorUser: 'Only my tasks',
          selectStatus: '',
          selectExecutor: '',
          selectLabel: '',
          submit: 'Show',
        },
        new: {
          title: 'Create Task',
          submit: 'Create',
        },
        show: {
          edit: 'Edit',
          back: 'Back',
        },
        edit: {
          title: 'Edit Task',
          submit: 'Update',
          delete: 'Delete',
        },
        labels: 'Labels',
      },
      labels: {
        id: 'ID',
        name: 'Name',
        createdAt: 'Created At',
        actions: 'Actions',
        errors: {
          nameRequired: 'Name is required',
        },
        index: {
          title: 'Labels',
          createLink: 'Create Label',
          edit: 'Edit',
          delete: 'Delete',
        },
        new: {
          title: 'Create Label',
          submit: 'Create',
        },
        edit: {
          title: 'Edit Label',
          submit: 'Update',
          delete: 'Delete',
        },
      },
    },
    flash: {
      authError: 'Access denied! Please sign in.',
      users: {
        create: {
          success: 'User successfully registered',
          error: 'Failed to register user',
        },
        edit: {
          success: 'User successfully updated',
          error: 'Failed to update user',
          accessError: 'You cannot edit another user',
          notFound: 'User not found',
        },
        delete: {
          success: 'User successfully deleted',
          accessError: 'You cannot delete another user',
          hasTasks: 'Cannot delete user linked to a task',
        },
      },
      session: {
        create: {
          success: 'You are logged in',
          error: 'Wrong email or password',
        },
        delete: {
          success: 'You are logged out',
        },
      },
      statuses: {
        create: {
          success: 'Status successfully created',
          error: 'Failed to create status',
        },
        edit: {
          success: 'Status successfully updated',
          error: 'Failed to update status',
          notFound: 'Status not found',
        },
        delete: {
          success: 'Status successfully deleted',
          notFound: 'Status not found',
          hasTasks: 'Cannot delete status linked to a task',
        },
      },
      tasks: {
        create: {
          success: 'Task successfully created',
          error: 'Failed to create task',
        },
        show: {
          notFound: 'Task not found',
        },
        edit: {
          success: 'Task successfully updated',
          error: 'Failed to update task',
          notFound: 'Task not found',
        },
        delete: {
          success: 'Task successfully deleted',
          notFound: 'Task not found',
          accessError: 'Only the creator can delete this task',
        },
      },
      labels: {
        create: {
          success: 'Label successfully created',
          error: 'Failed to create label',
        },
        edit: {
          success: 'Label successfully updated',
          error: 'Failed to update label',
          notFound: 'Label not found',
        },
        delete: {
          success: 'Label successfully deleted',
          notFound: 'Label not found',
          hasTasks: 'Cannot delete label linked to a task',
        },
      },
    },
  },
};
