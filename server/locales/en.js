export default {
  translation: {
    appName: 'Fastify Blog',
    layouts: {
      navbar: {
        brand: 'Fastify Blog',
        home: 'Home',
        users: 'Users',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        signOut: 'Sign Out',
      },
    },
    views: {
      index: {
        welcome: 'Welcome to Fastify Blog!',
        description: 'A simple blog application built with Fastify',
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
    },
  },
};
