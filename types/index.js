export const usersStatus = {
    free: 'free',
    standard: 'standard',
    proPlus: 'proPlus'
}

export const usersRoles = {
    admin: 'admin',
    superUser: 'superUser',
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
    status: usersStatus.free,
    created_at: null,
    subscription_date: null,
    role: usersRoles.user,
    lastCheck: null,
    showNegativeNotifications: true
}
