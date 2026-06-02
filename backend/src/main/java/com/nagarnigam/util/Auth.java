package com.nagarnigam.util;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

public final class Auth {
    private Auth() {}

    public static final String SESSION_USER_KEY = "user";

    public static SessionUser getUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) return null;
        Object obj = session.getAttribute(SESSION_USER_KEY);
        if (obj instanceof SessionUser u) return u;
        return null;
    }

    public static boolean isAdmin(HttpServletRequest req) {
        SessionUser u = getUser(req);
        return u != null && "ADMIN".equalsIgnoreCase(u.role);
    }
}

