package com.nagarnigam.listener;

import jakarta.servlet.SessionCookieConfig;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

/**
 * Dev fix:
 * When running backend on contextPath "/nagar-nigam-backend" and frontend via Vite proxy on "/api",
 * default JSESSIONID cookie path becomes "/nagar-nigam-backend" and browser won't send it for "/api" requests.
 * Force cookie path "/" so session works through the proxy.
 */
@WebListener
public class AppInitListener implements ServletContextListener {
    @Override
    public void contextInitialized(ServletContextEvent sce) {
        SessionCookieConfig cfg = sce.getServletContext().getSessionCookieConfig();
        cfg.setPath("/");
        cfg.setHttpOnly(true);
    }
}

