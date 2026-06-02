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
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@WebServlet("/api/users/*")
public class UserServlet extends HttpServlet {
    static class RegisterBody {
        public String fullName;
        public String email;
        public String phone;
        public String password;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        if (path == null) path = "";

        if ("/register".equals(path) || "".equals(path) || "/".equals(path)) {
            RegisterBody body = Json.read(req, RegisterBody.class);
            if (body.fullName == null || body.password == null || (body.email == null && body.phone == null)) {
                Json.write(resp, 400, Map.of("error", "MISSING_FIELDS"));
                return;
            }

            String hash = BCrypt.hashpw(body.password, BCrypt.gensalt(10));

            try (Connection con = Db.getConnection();
                 PreparedStatement ps = con.prepareStatement(
                         "INSERT INTO users(full_name,email,phone,password_hash,role) VALUES (?,?,?,?, 'USER')",
                         Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, body.fullName);
                ps.setString(2, body.email);
                ps.setString(3, body.phone);
                ps.setString(4, hash);
                ps.executeUpdate();

                long userId;
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    keys.next();
                    userId = keys.getLong(1);
                }

                SessionUser u = new SessionUser(userId, body.fullName, "USER");
                HttpSession session = req.getSession(true);
                session.setAttribute(Auth.SESSION_USER_KEY, u);

                Json.write(resp, 201, Map.of("ok", true, "user", Map.of("id", u.id, "fullName", u.fullName, "role", u.role)));
            } catch (Exception e) {
                // Likely duplicate email/phone
                Json.write(resp, 400, Map.of("error", "REGISTER_FAILED", "message", e.getMessage()));
            }
            return;
        }

        Json.write(resp, 404, Map.of("error", "NOT_FOUND"));
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        if (path == null) path = "";

        // GET /api/users/me/complaints
        if ("/me/complaints".equals(path)) {
            SessionUser u = Auth.getUser(req);
            if (u == null) {
                Json.write(resp, 401, Map.of("error", "NOT_LOGGED_IN"));
                return;
            }

            try (Connection con = Db.getConnection();
                 PreparedStatement ps = con.prepareStatement(
                         "SELECT tracking_code, category, status, created_at FROM complaints WHERE user_id=? ORDER BY created_at DESC")) {
                ps.setLong(1, u.id);
                List<Map<String, Object>> list = new ArrayList<>();
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        list.add(Map.of(
                                "trackingCode", rs.getString("tracking_code"),
                                "category", rs.getString("category"),
                                "status", rs.getString("status"),
                                "createdAt", rs.getTimestamp("created_at").toInstant().toString()
                        ));
                    }
                }
                Json.write(resp, 200, Map.of("items", list));
            } catch (Exception e) {
                Json.write(resp, 500, Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
            }
            return;
        }

        Json.write(resp, 404, Map.of("error", "NOT_FOUND"));
    }
}

