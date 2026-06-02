package com.nagarnigam.util;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

public final class Json {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private Json() {}

    public static <T> T read(HttpServletRequest req, Class<T> clazz) throws IOException {
        return MAPPER.readValue(req.getInputStream(), clazz);
    }

    public static void write(HttpServletResponse resp, int status, Object body) throws IOException {
        resp.setStatus(status);
        resp.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json");
        MAPPER.writeValue(resp.getOutputStream(), body);
    }
}

