package com.nagarnigam.servlet;

import com.nagarnigam.util.Auth;
import com.nagarnigam.util.Db;
import com.nagarnigam.util.Json;
import com.nagarnigam.util.SessionUser;
import org.mindrot.jbcrypt.BCrypt;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Map;

@WebServlet("/api/auth/*")
public class AuthServlet extends HttpServlet {

    static class LoginBody {
        public String emailOrPhone;
        public String password;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // GET /api/auth/me
        String path = req.getPathInfo();
        if (path == null || "/me".equals(path)) {
            SessionUser u = Auth.getUser(req);
            if (u == null) {
                Json.write(resp, 401, Map.of("error", "NOT_LOGGED_IN"));
                return;
            }
            Json.write(resp, 200, Map.of("id", u.id, "fullName", u.fullName, "role", u.role));
            return;
        }
        Json.write(resp, 404, Map.of("error", "NOT_FOUND"));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        if (path == null) path = "";

        if ("/login".equals(path) || "".equals(path) || "/".equals(path)) {
            LoginBody body = Json.read(req, LoginBody.class);
            if (body.emailOrPhone == null || body.password == null) {
                Json.write(resp, 400, Map.of("error", "MISSING_FIELDS"));
                return;
            }

            try (Connection con = Db.getConnection();
                 PreparedStatement ps = con.prepareStatement(
                         "SELECT id, full_name, role, password_hash FROM users WHERE email=? OR phone=? LIMIT 1")) {
                ps.setString(1, body.emailOrPhone);
                ps.setString(2, body.emailOrPhone);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        Json.write(resp, 401, Map.of("error", "INVALID_CREDENTIALS"));
                        return;
                    }
                    String hash = rs.getString("password_hash");
                    if (!BCrypt.checkpw(body.password, hash)) {
                        Json.write(resp, 401, Map.of("error", "INVALID_CREDENTIALS"));
                        return;
                    }

                    SessionUser u = new SessionUser(
                            rs.getLong("id"),
                            rs.getString("full_name"),
                            rs.getString("role")
                    );

                    HttpSession session = req.getSession(true);
                    session.setAttribute(Auth.SESSION_USER_KEY, u);

                    Json.write(resp, 200, Map.of("ok", true, "user", Map.of("id", u.id, "fullName", u.fullName, "role", u.role)));
                }
            } catch (Exception e) {
                Json.write(resp, 500, Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
            }
            return;
        }

        if ("/logout".equals(path)) {
            HttpSession session = req.getSession(false);
            if (session != null) session.invalidate();
            Json.write(resp, 200, Map.of("ok", true));
            return;
        }

        Json.write(resp, 404, Map.of("error", "NOT_FOUND"));
    }
}

