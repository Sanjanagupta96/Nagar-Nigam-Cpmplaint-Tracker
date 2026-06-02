package com.nagarnigam.filter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebFilter("/*")
public class CorsFilter implements Filter {
    private static final String ALLOWED_ORIGIN = "http://localhost:5173";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        String origin = req.getHeader("Origin");
        if (origin != null && origin.equals(ALLOWED_ORIGIN)) {
            resp.setHeader("Access-Control-Allow-Origin", origin);
            resp.setHeader("Access-Control-Allow-Credentials", "true");
            resp.setHeader("Vary", "Origin");
        }

        resp.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            resp.setStatus(204);
            return;
        }

        chain.doFilter(request, response);
    }
}

