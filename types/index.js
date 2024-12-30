export const usersRoles = {
    admin: 'admin',
    moderator: 'moderator',
    user: 'user'
}

export const loggerMessageTypes = {
    warning: 'warning',
    success: 'success',
    error: 'error',
    info: 'info'
}

export const IUser =    {
    chatId: null,
    paid: false,
    created_at: null,
    subscription_date: null,
    activated: false,
    role: usersRoles.user,
    nick: null,
    trial_ends: null,
    showNegativeNotifications: true
}
